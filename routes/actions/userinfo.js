import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import User from '../../models/user'
import {fail} from "../../js/utils"
import _ from 'lodash'
import mongoose from 'mongoose';

export class UserInfo extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin];
  }

  route() {
    this.router.post("/", this.authenticate(this.roles, 'Update UserInfo'), (req, res) => {
      if (this.getToken(req.headers)) {
        User.findById(req.userId)
        .then((user)=>{
          res.json(user)
        })
        .then(null, fail(res));
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });

    this.router.get("/", this.authenticate([Roles.ANY], 'UserInfo get'), (req, res) => {
      if (this.getToken(req.headers)) {
        this.getUserInfo(req.userId)
        .then((user)=>{
          res.json(user)
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });

    //(search criteria) {email, ssn}
    this.router.post("/lookup", this.authenticate([Roles.ANY], 'Lookup User'), (req, res) => {
      if (this.getToken(req.headers)) {
        User.findOne(req.body)
        .then((user)=>{
          res.json(_.pick(user,["_id", "email", "firstName", "middleName", "lastName"]))
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
  
    return this.router;
  }
}
