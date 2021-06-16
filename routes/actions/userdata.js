import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import User from '../../models/user';
import UserData from '../../models/userdata';
import UserFile from '../../models/userfile';
import VariableUserData from '../../models/variableuserdata';
import {fail} from "../../js/utils"
import mongoose, { Mongoose } from 'mongoose';
import fileUpload from 'express-fileupload'
import mammoth from 'mammoth';
import moment from 'moment';

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
    this.setRoles(Roles.SysAdmin, Roles.User);
  }

  route() {
    this.router.use(fileUpload());
    // {userId:'', updates:[{name: '', content:''}, ...]}
    this.post({path:"/batchupsert"}, (req, res) => {
      var updatesMap = {};
      var promises = req.body.updates.map((u)=>{
        updatesMap[u.name] = u.content;
        var promise = UserData.updateOne(
          {user: mongoose.Types.ObjectId(req.body.userId), name: u.name}, 
          {$set:{ user: req.body.userId, name: u.name, content: u.content}},
          { upsert: true}
        );
        return promise;
      });
      var update = ['email', 'firstName', 'middleName', 'lastName', 'ssn', 'dateOfBirth'].reduce((u,f)=>{
        u['$set'][f] = f=='dateOfBirth'?(moment(updatesMap[f]).toDate()||null):(updatesMap[f] || '');
        return u;
      },{$set:{}})
      promises.push(User.updateOne({_id:mongoose.Types.ObjectId(req.body.userId)}, update))
      mongoose.Promise.all(promises)
      .then((results)=>{
        var updateCnt = results.reduce((cnt,r)=>{cnt+=r.ok; return cnt;},0);
        res.json({success:updateCnt==(req.body.updates.length+1)});
      })
      .then(null, fail(res));
    });

    this.get({path:'/getuser/:userId'}, (req, res) =>{
      User.findOne({_id:mongoose.Types.ObjectId(req.params.userId)})
      .then(user=>{
        if (user) {
          res.json({success:true, user:user});
        } else {
          res.json({success:false})
        }
      })
      .catch(error =>{
        res.json({success:false, errMsg:error});
      })
    });

    //{userIds:'', names:['name1', ...]} 
    this.post({path:"/batchget"}, (req, res) => {
      var userIds = req.body.userIds.map(id=>(mongoose.Types.ObjectId(id)));
      var filter = {user:{$in:userIds}}
      if (req.body.userDataIds && req.body.userDataIds.length>0) {
        filter.name = {$in:req.body.userDataIds}
      }
      UserData.find(filter)
      .then((userDataList)=>{
        res.json({success:true, userDataMap:userDataList.reduce((mp,r)=>{
          var list = mp[r.user] || (mp[r.user]=[]);
          list.push(r);
          return mp;
        },{})});
      })
      .catch(error=>{
        res.json({success:false, errMsg: error+''});
      })
    });

    //{userId:'', names:['name1', ...]} 
    this.get({path:"/getbulkdata/:userId"}, (req, res) => {
        var userId = mongoose.Types.ObjectId(req.params.userId);
        VariableUserData.find({owner:userId})
        .then(( list )=>{
          res.json(list)
        })
    });

    this.get({path:"/userfile/getfile/:userId/:fileId"}, (req, res) => {
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
    });

      this.post({path:"/userfile/doc2html"}, (req, res) => {
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
  
    this.get({path:"/userfile/list/:userId"}, (req, res) => {
      UserFile.find({user:mongoose.Types.ObjectId(req.params.userId)},{name:1, fileName:1, mimeType:1})
      .then(userFiles=>{
        res.json(userFiles);
      })
      .then(null, fail(res));
    });

    this.post({path:"/userfile"}, (req, res) => {
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
    });

    return this.router;
  }
}
