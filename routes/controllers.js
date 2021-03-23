import BaseController  from './basecontroller';
import User from '../models/user'
import Vendor from '../models/vendor';
import AuditLog from '../models/auditlog'
import Roles from '../models/workflowroles'
import mongoose from 'mongoose'

//import CaseWorkflowAssignment from '../models/caseworkflowassignment';

const MAX_RESULTS = 100;

export class UserController extends BaseController{
  constructor(){
    super(User, '_id',
      [Roles.SysAdmin],
      [Roles.SysAdmin]
    );
  }
  list() {
    return this.model
    .find({})
    .populate({path:'vendor', select:{name:1}})
    .limit(MAX_RESULTS)
    .then((modelInstances) => {
      return modelInstances;
    });
  }
  update(id, updates) {
    this.logAuditData( id, 'update', updates);
    return User.findOneAndUpdate({_id:id}, 
      {$set:{ email:updates.email, name:updates.name, language:updates.language, roles:updates.roles}},
      {new:true})
      .then((user) => {
        return user;
      });
  }
  delete(id) {
    return mongoose.Promise.all([
      AuditLog.find({user:id})
    ])
    .then(results=>{
      if (results[1].length>0) {
        return mongoose.Promise.reject({name:'ValidationError', message:'In use - delete not allowed.'});
      } else {
        return super.delete(id);
      }
   })
  }
}

export class VendorController extends BaseController{
  constructor(){
    super(Vendor, '_id',
      [Roles.SysAdmin],
      [Roles.SysAdmin]);
  }
  list() {
    return this.model
    .find({})
    .limit(MAX_RESULTS)
    .then((modelInstances) => {
      return modelInstances;
    });
  }
}
