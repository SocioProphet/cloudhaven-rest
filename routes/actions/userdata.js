import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import UserData from '../../models/userdata';
import UserFile from '../../models/userfile';
import VariableUserData from '../../models/variableuserdata';
import {fail} from "../../js/utils"
import mongoose, { Mongoose } from 'mongoose';
import fileUpload from 'express-fileupload'
import mammoth from 'mammoth';

function sendResponse( res, userFile, data) {
  var filename = userFile.name+'-_-_-'+userFile.fileName;
  res.writeHead(200, [
    ['Content-Type', userFile.mimeType],
    ["Content-Disposition", `attachment; filename='${filename}'`]
  ]);
  res.end(Buffer.from(data));  
}

export class UserDataMgr extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin, Roles.User];
  }

  route() {
    this.router.use(fileUpload());
    //this.authenticate(Roles.ANY, 'Update UserData'), 
    // {userId:'', updates:[{name: '', content:''}, ...]}
    this.router.post("/batchupsert", (req, res) => {
//      if (this.getToken(req.headers)) {
        var promises = req.body.updates.map((u)=>{
          var promise = UserData.findOneAndUpdate(
            {user: mongoose.Types.ObjectId(req.body.userId), name: u.name}, 
            {$set:{ user: req.body.userId, name: u.name, content: u.content}},
            { new:true, upsert: true}
          );
          return promise;
        });
        mongoose.Promise.all(promises)
        .then((result)=>{
          res.json(result)
        })
        .then(null, fail(res));
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

    //this.authenticate([this.roles], 'UserData get'),
    //{userIds:'', names:['name1', ...]} 
    this.router.post("/batchget", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userIds = req.body.userIds.map(id=>(mongoose.Types.ObjectId(id)));
        var filter = {user:{$in:userIds}}
        if (req.body.userDataIds && req.body.userDataIds.length>0) {
          filter.name = {$in:req.body.userDataIds}
        }
        UserData.find(filter)
        .then((userDataList)=>{
          res.json(userDataList.reduce((mp,r)=>{
            var list = mp[r.user] || (mp[r.user]=[]);
            list.push(r);
            return mp;
          },{}))
        })
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

    //this.authenticate([this.roles], 'UserData get'),
    //{userId:'', names:['name1', ...]} 
    this.router.get("/getbulkdata/:userId", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userId = mongoose.Types.ObjectId(req.params.userId);
        VariableUserData.find({owner:userId})
        .then(( list )=>{
          res.json(list)
        })
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

      //this.authenticate([this.roles], 'UserData get'),
    this.router.get("/userfile/getfile/:userId/:fileId", (req, res) => {
//      if (this.getToken(req.headers)) {
        UserFile.findOne({user:mongoose.Types.ObjectId(req.params.userId), _id:mongoose.Types.ObjectId(req.params.fileId)},
          {name:1, fileName:1, mimeType:1, body:1})
        .then(userFile=>{
          var buffer = null;
          if (userFile.mimeType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            mammoth.convertToHtml(userFile.body)
            .then((result)=>{
              sendResponse(res, userFile, result.value);
            })
          } else {
            sendResponse(res, userFile, userFile.body)
          }
         })
        .then(null, fail(res));
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

      this.router.post("/userfile/doc2html", (req, res) => {
        var keys = Object.keys(req.files);
        var fileData = keys.length>0?req.files[keys[0]].data:null;
        if (fileData) {
          mammoth.convertToHtml(fileData)
          .then((result)=>{
            res.contentType('text/html');
            res.send(result.value);
          })
        }
      });
  
    //this.authenticate(this.roles), 
    this.router.get("/userfile/list/:userId", (req, res) => {
      var self = this;
//      if (this.getToken(req.headers)) {
        UserFile.find({user:mongoose.Types.ObjectId(req.params.userId)},{name:1, fileName:1, mimeType:1})
        .then(userFiles=>{
          res.json(userFiles);
        })
        .then(null, fail(res));
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

    //this.authenticate(this.roles), 
    this.router.post("/userfile", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userId = req.body.userId;
        var op = req.body.operation;
        var fileData = null;
        if (req.files) {
          var keys = Object.keys(req.files);
          var fileData = keys.length>0?req.files[keys[0]].data:null;
        }
        var promise = null;
        if (op == 'add') {
          var userFile = { user: userId,
              name: req.body.name,
              fileName: req.body.fileName,
              mimeType: req.body.mimeType,
              body: fileData
          };
          promise = UserFile.create(userFile);
        } else if (op == 'update') {
          var update = {$set:{
            name:req.body.name,
            fileName: req.body.fileName,
          }}
          if (fileData) {
            update['$set'].mimeType = req.body.mimeType;
            update['$set'].body = fileData;
          }
          promise = UserFile.findOneAndUpdate({user:mongoose.Types.ObjectId(userId), _id:mongoose.Types.ObjectId(req.body.fileId)}, update);
        } else if (op == 'delete') {
          promise = UserFile.deleteOne({user:mongoose.Types.ObjectId(userId), _id:mongoose.Types.ObjectId(req.body.fileId)});
        }
        promise.then(result=>{
          res.json({success:true})
        })
        .then(null, fail(res));
/*    } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });


    return this.router;
  }
}
