import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import Roles from '../../models/workflowroles'
import EventLog from '../../models/eventlog';
import moment from 'moment'

export class EventLogReview extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin];
  }
  
  route() {
    this.router.post("/", this.authenticate(this.roles), (req, res) => {
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
        if (req.body.category) filter.category = req.body.category;
        if (req.body.type) filter.type = req.body.type;
        return EventLog.find(filter)
        .then(events=>{
            res.json(events);
        })
        .then(null, fail(res));
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    return this.router;
  }
}
