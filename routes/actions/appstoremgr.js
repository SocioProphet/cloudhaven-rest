import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import AppStore from '../../models/appstore';
import User from '../../models/user';
import {fail} from "../../js/utils"
import mongoose, { Mongoose } from 'mongoose';

export class AppStoreMgr extends BaseAction{
  constructor(){
    super();
    this.setRoles(Roles.SysAdmin, Roles.User);
  }

  route() {
    // {organizationId, collection, key, jsonData]}
    this.post({path:"/upsert"}, (req, res) => {
      var orgId = mongoose.Types.ObjectId(req.body.organizationId);
      AppStore.updateOne({organization:orgId, table:req.body.table, key: req.body.key}, req.body, {upsert:true})
      .then((result)=>{
        res.json({success:result.ok==1, nModified:result.nModified});
      })
      .catch(fail(res));
    });

    this.get({path:'/get/:organizationId/:table/:key'}, (req, res) =>{
      var orgId = mongoose.Types.ObjectId(req.params.organizationId);
      AppStore.findOne({organization:orgId, table:req.params.table, key:req.params.key})
      .then(doc =>{
        res.json({success:true, data:doc});
      })
      .catch(fail(res));
    })
    return this.router;
  }
}
