import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import User from '../../models/user'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'

export class UserSubscription extends BaseAction{
  constructor(){
    super();
    this.setRoles(Roles.SysAdmin, Roles.User);
  }
  
  route() {
    this.get({path:"/:userId"}, (req, res) => {
      if (!req.params.userId && req.params.userId!='undefined') {
        res.status(403).send({success: false, msg: 'No User Id specified.'});
        return;
      }
      User.findOne({ _id:mongoose.Types.ObjectId(req.params.userId)})
      .populate( 'subscribedApps.organization')
      .then(user=>{
        if (!user) {
          res.json({success:false, errMsg:`Failed retrieve Users.`});
        } else {
          var subscribedApps = user.subscribedApps.map(app=>{
            var application = app.organization.applications.find(sa=>(sa._id==app.application)).toObject();
            application.organization = app.organization.toObject();
            return application;
          })
          res.json({success:true, subscribedApps:subscribedApps});
        }
      })
    });
    //subscribe
    this.post({path:"/"}, (req, res) => {
      User.findOneAndUpdate(
        { _id:mongoose.Types.ObjectId(req.body.userId), 
          subscribedApps:{$not:{$elemMatch:{'application':req.body.applicationId}}}}, 
        {$push:{subscribedApps:{organization:req.body.organizationId, application:req.body.applicationId}}}, {new:true})
      .then(user=>{
        if (!user) {
          res.json({success:false, errMsg:`Failed to subscribe to application.`});
        } else {
          res.json({success:true, applications:user.subscribedApps});
        }
      })
    });
    //unsubscribe
    this.delete({path:"/:userId/:organizationId/:applicationId"}, (req, res) => {
      User.updateOne( {_id:mongoose.Types.ObjectId(req.params.userId)}, 
        {$pull:{subscribedApps:{application:req.params.applicationId}}} )
      .then(result=>{
        if (result && result.n>0) {
          res.json({success:true});
        }
      })
      .catch(error=>{
        res.json({success:false, errMsg:error+''});
      })
    });

    return this.router;
  }
}
