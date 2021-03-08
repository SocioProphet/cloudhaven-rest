import BaseAction from './baseaction'
import moment from 'moment';
import Roles from '../../models/workflowroles'

//import Promise from 'promise';
export class CalendarScheduling extends BaseAction{
    constructor(){
      super();
      this.roles = [Roles.SysAdmin];
    }
    
    route() {
      //params: procedureId, monthDateRange, vendorIds, ignoreCaseId
      this.router.post("/scheduledateslist", this.authenticate([Roles.ANY], 'CalendarScheduling scheduleddatelist'), (req, res) => {
        if (this.getToken(req.headers)) {
          var firstDayOfMonth = moment().date(1);
          if (req.body.monthDateRange) {
            var parts = req.body.monthDateRange.split(':')
            firstDayOfMonth = moment(parts[0], 'YYYY-MM-DD');
          }
          res.json([]); //FIXME
        } else {
          res.status(403).send({success: false, msg: 'Unauthorized.'});
        }
      });
      
      this.router.post("/schedulingcalendarcases", this.authenticate(this.roles, 'CalendarScheduling schedulingcalendarcases'), (req, res) => {
        if (this.getToken(req.headers)) {
           res.json({fixme:''});
        } else {
          res.status(403).send({success: false, msg: 'Unauthorized.'});
        }
      });
      return this.router;
    }
}
