import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import Vendor from '../../models/vendor'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'
import axios from 'axios'

export class VendorComponentMgr extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin, Roles.VendorAdmin];
  }
  
  route() {
    //Get vendor component details
    //{vendorComps:[{vendorId:'', componentId:''}, ...]}
    this.router.post("/getcomponents", this.authenticate(this.roles), (req, res) => {
      var operation = req.body.operation;
      if (this.getToken(req.headers)) {
        var vendorComponents = req.body.vendorComps.reduce((mp,e)=>{
          var compList = mp[e.vendorId] || (mp[e.vendorId] = []);
          compList.push(e.componentId);
          return mp;
        },{});
        var vendorIds = Object.keys(vendorComponents)
        Vendor.find({vendorId:{$in:vendorIds}}, {_id:1, vendorId:1, components:1, componentsUrl:1})
        .then((vendors)=>{
          if (!vendors) {
            res.json({success:false, errMsg:`Failed to ${operation} component.`});
          } else {
            var promises = [];
            vendors.forEach(v=>{
              var validCompMap = v.components.reduce((mp,c)=>{
                mp[c.componentId] = c.componentId;
                return mp;
              },{})
              var vComponentIds = vendorComponents[v.vendorId].filter(cId=>(validCompMap[cId]));
              promises.push(axios.post(v.componentsUrl, {componentIds:vComponentIds}));
            })
            mongoose.Promise.all(promises)
            .then((results)=>{
              if (!results) {
                res.json({success:false});
              } else {
                var retComponents = results.reduce((ar,r)=>{
                  ar = ar.concat(r.data);
                  return ar;
                },[]);
                res.json({success:true, components: retComponents});
              }
            })
          }
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    this.router.post("/", this.authenticate(this.roles), (req, res) => {
      var operation = req.body.operation;
      if (this.getToken(req.headers)) {
        var component = {name: req.body.name, componentId: req.body.componentId, url: req.body.url};
        (()=>{
          if (operation == 'add') {
            return Vendor.findOneAndUpdate(
              { _id:mongoose.Types.ObjectId(req.body.vendor_Id), 
                components:{$not:{$elemMatch:{'components.name':component.name}}}}, 
              {$push:{components:component}}, {new:true})
          } else {
            var update = Object.keys(component).reduce((mp,fld)=>{
              mp['components.$[elem].'+fld] = component[fld];
              return mp;
            },{});
            return Vendor.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.body.vendor_Id)},
              {$set:update}, {new:true, arrayFilters:[{'elem._id':mongoose.Types.ObjectId(req.body.component_Id)}]})
          }
        })()
        .then(vendor=>{
          if (!vendor) {
            res.json({success:false, errMsg:`Failed to ${operation} component.`});
          } else {
            res.json({success:true, components:vendor.components});
          }
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    this.router.delete("/:vendor_Id/:component_Id", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {
        Vendor.findByIdAndUpdate( req.params.vendor_Id, {$pull:{components:{_id:req.params.component_Id}}} )
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

    /*this.router.post("/apppost", (req, res) => {
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
