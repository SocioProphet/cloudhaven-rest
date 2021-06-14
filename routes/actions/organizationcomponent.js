import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import Organization from '../../models/organization'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'
import axios from 'axios'

export class OrganizationComponentMgr extends BaseAction{
  constructor(){
    super();
    this.setRoles(Roles.SysAdmin, Roles.User);
  }
  
  route() {
    //Get organization component details
    //status, organizationComps:[{organizationId:'', componentId:''}, ...]}
    this.post({path:"/getcomponents"}, (req, res) => {
      var operation = req.body.operation;
      var organizationComponents = req.body.organizationComps.reduce((mp,e)=>{
        var compList = mp[e.organizationId] || (mp[e.organizationId] = []);
        compList.push(e.componentId);
        return mp;
      },{});
      var organizationIds = Object.keys(organizationComponents);
      Organization.find({organizationId:{$in:organizationIds}}, {_id:1, organizationId:1, components:1, componentsUrl:1})
      .then((organizations)=>{
        if (!organizations) {
          res.json({success:false, errMsg:`Failed to ${operation} component.`});
        } else {
          var promises = [];
          var localStoredComponents = [];
          var compOrgs = [];
          organizations.forEach(v=>{
            var validCompMap = v.components.reduce((mp,c)=>{
              if (c.status == (req.body.status||'Published'))
              mp[c.componentId] = c;
              return mp;
            },{})
            var fetchComponentIds = organizationComponents[v.organizationId].filter(cId=>{
              var comp = validCompMap[cId];
              if (comp) {
                if (comp.source == 'CloudHaven') {
                  var uiConfig = {};
                  try {
                    uiConfig = eval(comp.content);
                    uiConfig.componentId = cId;
                    uiConfig.organizationId = v.organizationId;
                  } catch(e) {
                    uiConfig.syntaxError = e+'';
                  }
                  localStoredComponents.push(uiConfig);
                } else {
                  return true;
                }
                return false;
              }
            });
            if (v.componentsUrl && fetchComponentIds.length>0) {
              compOrgs.push(v.organizationId)
              promises.push(axios.post(v.componentsUrl, {componentIds:fetchComponentIds}));
            }
          })
          mongoose.Promise.all(promises)
          .then((results)=>{
            if (!results) {
              res.json({success:false});
            } else {
              var retComponents = [].concat(localStoredComponents);
              for (var i=0;i<results.length;i++) {
                r = results[i];
                orgId = compOrgs[i];
                retComponents = retComponents.concat(r.data.map(comp=>{
                  var uiConfig = Object.assign({organizationId:orgId}, comp.uiConfig)
                  return uiConfig;
                }));
              }
              res.json({success:true, components: retComponents});
            }
          })
        }
      })
    });
    this.post({path:"/"}, (req, res) => {
      var operation = req.body.operation;
      var component = {name: req.body.name, componentId: req.body.componentId, source: req.body.source, status: req.body.status, content: req.body.content};
      (()=>{
        if (operation == 'add') {
          return Organization.findOneAndUpdate(
            { _id:mongoose.Types.ObjectId(req.body.organization_Id), 
//              components:{$not:{$elemMatch:{'components.name':component.name}}}}, 
              components:{$not:{$elemMatch:{'name':component.name}}}}, 
            {$push:{components:component}}, {new:true})
        } else {
          var update = Object.keys(component).reduce((mp,fld)=>{
            mp['components.$[elem].'+fld] = component[fld];
            return mp;
          },{});
          return Organization.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.body.organization_Id)},
            {$set:update}, {new:true, arrayFilters:[{'elem._id':mongoose.Types.ObjectId(req.body.component_Id)}]})
        }
      })()
      .then(organization=>{
        if (!organization) {
          res.json({success:false, errMsg:`Failed to ${operation} component.`});
        } else {
          res.json({success:true, components:organization.components});
        }
      })
    });
    this.delete({path:"/:organization_Id/:component_Id"}, (req, res) => {
      var orgId = mongoose.Types.ObjectId(req.params.organization_Id);
      var compId = mongoose.Types.ObjectId(req.params.component_Id)
      Organization.updateOne( {_id: orgId}, {$pull:{components:{_id:compId}}} )
      .then(result=>{
        if (result && result.ok>0) {
          res.json({success:true});
        }
      })
      .catch(error=>{
        res.json({success:false, errMsg:error+''});
      })
    });

    /*this.post("/apppost", (req, res) => {
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

**      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }**
    });*/
      
    return this.router;
  }
}
