import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import Vendor from '../../models/vendor'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'
import fileUpload from 'express-fileupload'
import axios from 'axios'

export class VendorAppMgr extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin, Roles.VendorAdmin];
  }
  
  route() {
    this.router.use(fileUpload());
    this.router.post("/", this.authenticate(this.roles), (req, res) => {
      var operation = req.body.operation;
      if (this.getToken(req.headers)) {
        var application = {name: req.body.name, url: req.body.url};
        (()=>{
          var len = req.files?Object.keys(req.files).length:0;
          if (len==1) {
            var file = req.files.logo;
            application.logo = file.data;
            application.mimeType = file.mimetype;
          } else if (req.body.logoUpdated=='true') {
            application.logo = null;
            application.mimeType = '';
          }
          if (operation == 'add') {
            return Vendor.findOneAndUpdate(
              { _id:mongoose.Types.ObjectId(req.body.vendor_Id), 
                applications:{$not:{$elemMatch:{'applications.name':application.name}}}}, 
              {$push:{applications:application}}, {new:true})
          } else {
            var update = Object.keys(application).reduce((mp,fld)=>{
              mp['applications.$[elem].'+fld] = application[fld];
              return mp;
            },{});
            return Vendor.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.body.vendor_Id)},
              {$set:update}, {new:true, arrayFilters:[{'elem._id':mongoose.Types.ObjectId(req.body.applicationId)}]})
          }
        })()
        .then(vendor=>{
          if (!vendor) {
            res.json({success:false, errMsg:`Failed to ${operation} application.`});
          } else {
            res.json({success:true, applications:vendor.applications});
          }
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    this.router.delete("/:vendorId/:applicationId", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {
        Vendor.findByIdAndUpdate( req.params.vendorId, {$pull:{applications:{_id:req.params.applicationId}}} )
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

    this.router.post("/getapppage", (req, res) => {
      //      if (this.getToken(req.headers)) {
      var app = req.body.app;
      axios.get(app.url+'/'+req.body.page)
      .then((response)=>{
        res.json(response.data);
      })
  })
      
    this.router.post("/apppost", (req, res) => {
//      if (this.getToken(req.headers)) {
      var app = req.body.app;
      if (req.body.httpMethod=='GET') {
        axios.get(app.url+'/'+req.body.postId)
        .then((response)=>{
          res.json(response.data);
        })
      } else if (req.body.httpMethod=='POST') {
        axios.post(app.url+'/'+req.body.postId, req.body.postData)
        .then((response)=>{
          res.json(response.data);
        })
      }

/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });
      
    return this.router;
  }
}
