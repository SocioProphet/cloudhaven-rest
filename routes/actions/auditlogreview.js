import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import User from '../../models/user';
import Roles from '../../models/workflowroles'
import AuditLog from '../../models/auditlog';
import moment from 'moment'

export class AuditLogReview extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin];
  }
  
  route() {
    this.router.get("/users", this.authenticate(this.roles, 'AuditLogReview/users'), (req, res) => {
      if (this.getToken(req.headers)) {
        return User.find({})
        .then(users=>{
          res.json(users);
        })
        .then(null, fail(res));
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    /*
  isPHI: { type:Boolean, default: false},
  model: { type: String, required: true},
  recordId: {type: String, required: true},
  publicId: {type: String },
  operation: { type: String, enum:['create', 'read', 'update', 'delete'], required:true},
  data: String,
  datetime: { type: Date, required: true, default: Date.now}

    */
    this.router.post("/", this.authenticate(this.roles, 'AuditLogReview post'), (req, res) => {
      if (this.getToken(req.headers)) {
        var filter = {};
        if (req.body.startDate) filter.datetime = {'$gte': moment(req.body.startDate).toDate()};
        if (req.body.endDate) {
          if (filter.datetime) {
            filter.datetime['$lt'] = moment(req.body.endDate).toDate();
          } else {
            filter.datetime = {'$lt': moment(req.body.endDate).toDate()};
          }
        }
        if (req.body.operation) filter.operation = req.body.operation;
        if (req.body.model) filter.model = req.body.model;
        if (req.body.userId) filter.user = req.body.userId;
        if (req.body.publicId) filter.publicId = req.body.publicId;
        return AuditLog.find(filter)
        .populate({path:'user'})
        .then(users=>{
            res.json(users);
        })
        .then(null, fail(res));
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    return this.router;
  }
}
