import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import User from '../../models/user'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'

export class UserSubscription extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin, Roles.User];
  }
  
  route() {
    this.router.get("/:userId", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {
        if (!req.params.userId && req.params.userId!='undefined') {
          res.status(403).send({success: false, msg: 'No User Id specified.'});
          return;
        }
        User.findOne({ _id:mongoose.Types.ObjectId(req.params.userId)})
        .populate( 'subscribedApps.vendor')
        .then(user=>{
          if (!user) {
            res.json({success:false, errMsg:`Failed retrieve Users.`});
          } else {
            var subscribedApps = user.subscribedApps.map(app=>{
              var application = app.vendor.applications.find(sa=>(sa._id==app.application)).toObject();
              application.vendor = app.vendor.toObject();
              return application;
            })
            res.json({success:true, subscribedApps:subscribedApps});
          }
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    //subscribe
    this.router.post("/", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {
        User.findOneAndUpdate(
          { _id:mongoose.Types.ObjectId(req.body.userId), 
            subscribedApps:{$not:{$elemMatch:{'application':req.body.applicationId}}}}, 
          {$push:{subscribedApps:{vendor:req.body.vendorId, application:req.body.applicationId}}}, {new:true})
        .then(user=>{
          if (!user) {
            res.json({success:false, errMsg:`Failed to subscribe to application.`});
          } else {
            res.json({success:true, applications:user.subscribedApps});
          }
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    //unsubscribe
    this.router.delete("/:userId/:vendorId/:applicationId", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {

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
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });

    return this.router;
  }
}
