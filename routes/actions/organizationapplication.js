import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import Organization from '../../models/organization'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'
import fileUpload from 'express-fileupload'
import axios from 'axios'
import FormData from 'form-data';

export class OrganizationAppMgr extends BaseAction{
  constructor(){
    super();
    this.setRoles(Roles.SysAdmin, Roles.OrganizationAdmin);
  }
  
  route() {
    this.router.use(fileUpload());
    this.post({path:"/upsert"}, (req, res) => {
      var operation = req.body.operation;
      var application = {name: req.body.name, url: req.body.url, applicationId: req.body.applicationId};
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
          return Organization.findOneAndUpdate(
            { _id:mongoose.Types.ObjectId(req.body.organization_Id), 
              applications:{$not:{$elemMatch:{'applications.applicationId':application.applicationId}}}}, 
            {$push:{applications:application}}, {new:true})
        } else {
          var update = Object.keys(application).reduce((mp,fld)=>{
            mp['applications.$[elem].'+fld] = application[fld];
            return mp;
          },{});
          return Organization.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.body.organization_Id)},
            {$set:update}, {new:true, arrayFilters:[{'elem._id':mongoose.Types.ObjectId(req.body._id)}]})
        }
      })()
      .then(organization=>{
        if (!organization) {
          res.json({success:false, errMsg:`Failed to ${operation} application.`});
        } else {
          res.json({success:true, applications:organization.applications});
        }
      })
    });
    this.delete({path:"/:organizationId/:applicationId"}, (req, res) => {
      Organization.findByIdAndUpdate( req.params.organizationId, {$pull:{applications:{_id:req.params.applicationId}}} )
      .then(result=>{
        if (result && result.n>0) {
          res.json({success:true});
        }
      })
      .catch(error=>{
        res.json({success:false, errMsg:error+''});
      })
    });

    this.post({path:"/getapppage"}, (req, res) => {
      var app = req.body.app;
      axios.get(app.url+'/apppages/'+req.body.page)
      .then((response)=>{
        res.json(response.data);
      })
    })
      
    this.post({path:"/apppost"}, (req, res) => {
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
    });

    this.post({path:"/appmultipartpost"}, (req, res) => {
      var formData = new FormData();
      Object.keys(req.files).forEach(fileKey=>{
        var fileName = (fileKey.indexOf('files.')==0)?fileKey.substring(6):fileKey;
        var file = req.files[fileKey];
        formData.append(fileKey, file.data);
      })
      Object.keys(req.body).forEach((key)=>{
        if (key != '_appUrl' && key !='_postId' && key.indexOf('files.')!=0) {
          formData.append(key, req.body[key]);
        }
      });
      var appUrl = req.body._appUrl;
      axios.post(appUrl+'/'+req.body._postId, formData, {headers: formData.getHeaders()})
      .then((response)=>{
        res.json(response.data);
      })
    });

    this.post({path:'/appgetfile'}, (req, res) => {
      var appUrl = req.body.appUrl;
      var URL = `${appUrl}/${req.body.postId}/${req.body.fileId}`;
      axios.get(URL, {responseType: 'arraybuffer', timeout: 30000 })
      .then(response => {
        if (!response) {
          res.json(null);
        } else {
          var parts = response.headers["content-disposition"].split(/["']/);
          const filename = parts[1];
          const contentType = response.headers["content-type"];
          var headers = [
            ['Content-Type', contentType],
            ["Content-Disposition", `filename='${filename}'`]
          ];
          res.writeHead(200, headers);
          res.end(response.data);
        }
      })

    })
      
    return this.router;
  }
}
