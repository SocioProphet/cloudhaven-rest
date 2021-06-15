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

    //body: :organizationId, table, key, searchOperator
    this.post({path:'/read'}, (req, res) =>{
      var orgId = mongoose.Types.ObjectId(req.body.organizationId);
      var searchFilter = {organization:orgId, table:req.body.table};
      if (req.body.key) {

      }
      if (req.body.searchOperator == 'startsWith') {
        seaarchFilter.key = {$regex:req.body.key};
      } else if (req.body.searchOperator == 'contains') {
        seaarchFilter.key = {$regex:"/"+req.body.key};
      } else {
        searchFilter.key = req.body.key;
      }
      AppStore.find( searchFilter )
      .then(results =>{
        res.json({success:true, data:results});
      })
      .catch(fail(res));
    })
    return this.router;
  }
}
