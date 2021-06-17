import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import Organization from '../../models/organization'
import User from '../../models/user'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'
import fileUpload from 'express-fileupload'
import axios from 'axios'
import FormData from 'form-data';
import { OrganizationUserMgr } from './organizationuser'

export class OrganizationAppMgr extends BaseAction{
  constructor(){
    super();
    this.setRoles(Roles.SysAdmin, Roles.User);
  }
  
  route() {
    this.router.use(fileUpload());
    this.post({path:"/upsert", overrideRoles:[Roles.SysAdmin, Roles.User]}, (req, res) => {
      var operation = req.body.operation;
      var application = {name: req.body.name, url: req.body.url, applicationId: req.body.applicationId, source:req.body.source, status: req.body.status};
      if (req.body.pages) {
        application.pages = JSON.parse(req.body.pages);
      }
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
//              applications:{$not:{$elemMatch:{'applications.applicationId':application.applicationId}}}}, 
              applications:{$not:{$elemMatch:{'applicationId':application.applicationId}}}}, 
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
      var orgId = mongoose.Types.ObjectId(req.params.organizationId);
      var appId = mongoose.Types.ObjectId(req.params.applicationId)
      var promises = [];
      promises.push(Organization.findByIdAndUpdate( req.params.organizationId, {$pull:{applications:{_id:req.params.applicationId}}}, {new:true} ));
      promises.push(User.updateMany({subscribedApps:{$elemMatch:{organization:orgId,application:appId}}},
        {$pull:{subscribedApps:{organization:orgId, application:appId}}}));
      mongoose.Promise.all(promises)
      .then(results=>{
        if (results && results[0] && results[1].ok>0) {
          res.json({success:true, apps:results[0].applications});
        }
      })
      .catch(error=>{
        res.json({success:false, errMsg:error+''});
      })
    });

    this.delete({path:"/page/:organizationId/:applicationId/:pageName", overrideRoles:[Roles.SysAdmin, Roles.User]}, (req, res) => {
      var orgId = mongoose.Types.ObjectId(req.params.organizationId);
      var appId = mongoose.Types.ObjectId(req.params.applicationId)
      Organization.findOneAndUpdate({_id:orgId}, {$pull:{'applications.$[app].pages': {name:req.params.pageName}}},
        {new:true, arrayFilters:[{'app._id':appId}]})
      .then(newOrg=>{
        var app = newOrg.applications.find(a=>(a._id.toString()==req.body.applicationId));
        res.json({success:true, pages:app?app.pages:[]});
      })
      .catch(error=>{
        res.json({success:false, errMsg:error+''});
      })
    });
/*    this.post({path:"/getapppage"}, (req, res) => {
      var app = req.body.app;
      axios.get(app.url+'/apppages/'+req.body.page)
      .then((response)=>{
        res.json(response.data);
      })
    })*/
    this.post({path:"/getapppage"}, (req, res) => {
      var app = req.body.app;
      axios.get(app.url+'/apppages/'+req.body.page)
      .then((response)=>{
        res.json({success:true, data:response.data});
      })
      .catch(error =>{
        res.json({success:false, errMsg: 'Communication with application page source failed.'});
      })
    })
      
    this.post({path:"/apppost"}, (req, res) => {
      var app = req.body.app;
      if (req.body.httpMethod=='GET') {
        axios.get(app.url+'/'+req.body.operationId)
        .then((response)=>{
          res.json(response.data);
        })
      } else if (req.body.httpMethod=='POST') {
        axios.post(app.url+'/'+req.body.operationId, req.body.postData)
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
        if (key != '_appUrl' && key !='_operationId' && key.indexOf('files.')!=0) {
          formData.append(key, req.body[key]);
        }
      });
      var appUrl = req.body._appUrl;
      axios.post(appUrl+'/'+req.body._operationId, formData, {headers: formData.getHeaders()})
      .then((response)=>{
        res.json(response.data);
      })
    });

    this.post({path:'/appgetfile'}, (req, res) => {
      var appUrl = req.body.appUrl;
      var URL = `${appUrl}/${req.body.operationId}/${req.body.fileId}`;
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

    //{organizationId, applicationId, pageName, content}
    this.post({path:'/writepage', overrideRoles:[Roles.SysAdmin, Roles.User]}, (req, res) => {
      var orgId = mongoose.Types.ObjectId(req.body.organizationId);
      var appId = mongoose.Types.ObjectId(req.body.applicationId)
      Organization.findOne({_id: orgId})
      .then(org =>{
        var app = org.applications.find(a=>(a._id.toString()==req.body.applicationId));
        if (!app) {
          res.json({success:false, errMsg:'Application does not exist.'})
          return null;
        }
        var pageExists = app.pages.find(p=>(p.name==req.body.pageName));
        if (pageExists) {
          return Organization.findOneAndUpdate({_id:orgId}, {$set:{'applications.$[app].pages.$[pg].content': req.body.content}}, 
            {new:true, arrayFilters:[{'app._id':appId}, {'pg.name':req.body.pageName}]})
        } else {
          return Organization.findOneAndUpdate({_id:orgId}, {$push:{'applications.$[app].pages': {name:req.body.pageName, content: req.body.content}}},
            {new:true, arrayFilters:[{'app._id':appId}]})
        }
      })
      .then( newOrg =>{
        var app = newOrg.applications.find(a=>(a._id.toString()==req.body.applicationId));
        res.json({success:true, pages: app.pages})
      }) 
      .catch(error => {
        res.json({success:false, errMsg: error});
      })
    })

    this.get({path:'/applications', overrideRoles:[Roles.SysAdmin, Roles.User]}, (req, res) =>{
      Organization.find({}, {name:1, organizationId:1, applications:1})
      .then(organizations =>{
        var applications = organizations.reduce((ar, o)=>{
          ar = ar.concat(o.applications.filter(a=>(a.status=='Published')).map((a)=>{
            var app = Object.assign({key:o.name+':'+a.name , organizationId:o._id}, a.toObject());
            app.organizationName = o.name;
            app.logo = a.logo;
            return app;
          })||[]);
          return ar;
        },[]);
        res.json(applications);
      })
    })
      
    return this.router;
  }
}


const uiConfig = {
  requiredUserData: ['firstName', 'lastName'],
  dataModel:{
    displayString:''
  },
  methods: {
    mounted: {
      args:[],
      body: 'this.displayString = \'CloudHaven skeleton application\';'
    }
  },
  computed: {
    decoratedDisplayString: {
      args:[],
      body: 'return \'** \'+this.displayString+\' **;'
    }
  },
  externalComponents: [{organizationId:'some-org', componentId:'some-component-id'}],
  appFrame: {
    name: 'Skeleton App',
    appBarStyle: {background: 'linear-gradient(rgb(40, 54, 102) 0%, rgb(37, 114, 210) 100%)'},
    appBarTextClass: 'yellow--text text--accent-2',
    nameTextClass: 'white--text',
    menuItems: [ //These are just examples and need to be replaced by real pages
      { page: 'home', title: 'Dashboard'},
      { page: 'widgets', title: 'Widgets'}, 
    ]
  },
  uiSchema: {
    component: 'container',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', contents: 'This is the title' },
        {component: 'cardText', contents: [
            {component: 'sheet', props:{'min-width':'200px', 'min-height':'200px'}, class: 'mt-auto mb-auto ml-auto mr-auto',
              template: '<span>{{decoratedDisplayString}}</span>'}]}
        ]}
    ]
  }
};


/*
const x = {
  requiredUserData: ['firstName', 'lastName'],
  dataModel:{
    displayString:''
  },
  methods: {
    mounted: {
      args:[],
      body: 'this.displayString = "CloudHaven skeleton application";\
this._writeAppData("NewTable", "key1", JSON.stringify({aaa:111,bbb:222}), function(data) {\
  alert(JSON.stringify(data);\
  this._readAppData("NewTable", "key1", function(data) {alert("read:" + JSON.stringify(data);});\
});'
    }
  },
  computed: {
    decoratedDisplayString: {
      args:[],
      body: "return '** '+this.displayString+' **';"
    }
  },
  externalComponents: [{organizationId:'some-org', componentId:'some-component-id'}],
  appFrame: {
    name: 'Skeleton App',
    appBarStyle: {background: 'linear-gradient(rgb(40, 54, 102) 0%, rgb(37, 114, 210) 100%)'},
    appBarTextClass: 'yellow--text text--accent-2',
    nameTextClass: 'white--text',
    menuItems: [ //These are just examples and need to be replaced by real pages
      { page: 'home', title: 'Dashboard'},
      { page: 'widgets', title: 'Widgets'}, 
    ]
  },
  uiSchema: {
    component: 'container',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', contents: 'This is the title' },
        {component: 'cardText', contents: [
            {component: 'sheet', props:{'min-width':'200px', 'min-height':'200px'}, class: 'mt-auto mb-auto ml-auto mr-auto',
              template: '<span>{{decoratedDisplayString}}</span>'}]}
        ]}
    ]
  }
}
*/
