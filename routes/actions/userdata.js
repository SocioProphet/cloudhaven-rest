import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import UserData from '../../models/userdata';
import VariableUserData from '../../models/variableuserdata';
import {fail} from "../../js/utils"
import mongoose, { Mongoose } from 'mongoose';

export class UserDataMgr extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin, Roles.User];
  }

  route() {
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
    //{userId:'', names:['name1', ...]} 
    this.router.post("/batchget", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userId = mongoose.Types.ObjectId(req.body.userId);
        var filter = req.body.tokenIds?{$or: req.body.tokenIds.map(name=>({user:userId, name:name}))}:{};
        UserData.find(filter)
        .then((userDataList)=>{
          res.json(userDataList)
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
    return this.router;
  }
}
