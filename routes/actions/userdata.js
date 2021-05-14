import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import UserData from '../../models/userdata';
import UserFile from '../../models/userfile';
import VariableUserData from '../../models/variableuserdata';
import {fail} from "../../js/utils"
import mongoose, { Mongoose } from 'mongoose';
import fileUpload from 'express-fileupload'

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
    this.router.get("/userfile/body/:userId/:fileId", this.authenticate(this.roles), (req, res) => {
      var self = this;
//      if (this.getToken(req.headers)) {
        UserFile.findOne({user:mongoose.Types.ObjectId(req.params.userId), _id:mongoose.Types.ObjectId(req.params.fileId)},
          {name:1, fileName:1, mimeType:1})
        .then(userFiles=>{
          res.json(list);
        })
        .then(null, fail(res));
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

    this.router.get("/userfile/list/:userId", this.authenticate(this.roles), (req, res) => {
      var self = this;
//      if (this.getToken(req.headers)) {
        UserFile.find(req.params.id)
        .then(userFile=>{
          res.contentType(userFile.mimeType)
          res.send(userFile.body)
        })
        .then(null, fail(res));
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

    //this.authenticate(this.roles), 
    this.router.post("/", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userId = req.body.userId;
        var op = req.body.op;
        var keys = Object.keys(req.files);
        var fileData = keys.length>0?req.files[keys[0]]:null;
        var promise = null;
        if (op == 'add') {
          var userFile = { user: userId,
              name: req.body.name,
              fileName: file.name,
              mimeType: file.mimetype,
              body: fileData
          };
          promise = UserFile.create(userFile);
        } else if (op == 'update') {
          var update = {$set:{
            name:req.body.name,
            fileName: req.body.fileName,
            mimeType: req.body.mimeType
          }}
          if (fileData) update.body = fileData;
          promise = UserFile.findOneAndUpdate({user:mongoose.Types.ObjectId(userId), _id:mongoose.Types.ObjectId(req.body.fileId)}, update);
        } else if (op == 'delete') {
          promise = UserFile.deleteOne({user:mongoose.Types.ObjectId(userId), user_id:mongoose.Types.ObjectId(req.body.fileId)});
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
