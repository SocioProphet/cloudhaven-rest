import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import User from '../../models/user'
import {fail} from "../../js/utils"
import _ from 'lodash'
import mongoose from 'mongoose';

export class UserSearch extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin];
  }

  route() {
    this.router.post("/", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {
        var phrase = req.body.phrase;
        var searchCriteria = {
          $or: [{ firstName: { $regex: phrase, $options: 'i'} },
            { lastName: { $regex: phrase, $options: 'i'} },
            { ssn: { $regex: phrase, $options: 'i'} }]
        }
        if (req.body.dateOfBirth) {
          var lowBnd = moment(req.body.dateOfBirth).startOf('day');
          var highBnd = moment(lowBnd).add(1, 'days');
          searchCriteria.dateOfBirth = { $gte: lowBnd.toDate(), $lt: highBnd.toDate()};
        }
        User.find( searchCriteria )
        .then((user)=>{
          res.json(user);
        })
        .catch((err)=>{
          res.json({errMsg:"Can't find user.", success:false})
        });
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
  
    return this.router;
  }
}