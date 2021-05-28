import BaseAction from './baseaction'
import moment from 'moment';
import Roles from '../../models/workflowroles'

//import Promise from 'promise';
export class CalendarScheduling extends BaseAction{
    constructor(){
      super();
      this.setRoles(Roles.SysAdmin);
    }
    
    route() {
      //params: procedureId, monthDateRange, organizationIds, ignoreCaseId
      this.post({path:"/scheduledateslist", tag:'CalendarScheduling scheduleddatelist', overrideRoles:[Roles.ANY]}, (req, res) => {
        var firstDayOfMonth = moment().date(1);
        if (req.body.monthDateRange) {
          var parts = req.body.monthDateRange.split(':')
          firstDayOfMonth = moment(parts[0], 'YYYY-MM-DD');
        }
        res.json([]); //FIXME
      });
      
      this.post({path:"/schedulingcalendarcases", tag:'CalendarScheduling schedulingcalendarcases'}, (req, res) => {
        res.json({fixme:''});
      });
      return this.router;
    }
}
