import BaseAction from './baseaction'
import {fail} from "../../js/utils"
import Vendor from '../../models/vendor'
import User from '../../models/user'
import Roles from '../../models/workflowroles'
import mongoose from 'mongoose'

export class VendorContactMgr extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin, Roles.VendorAdmin];
  }
  
  route() {
    this.router.post("/", this.authenticate(this.roles), (req, res) => {
      var contact = req.body.vendorContact;
      if (this.getToken(req.headers)) {
        User.findOne({email:contact.hasLoginAccess?contact.contactInfo.email:'dummyemailvalue'})
        .then(result=>{
          if (result) {
            res.json({success:false, errMsg:'A user already exists for '+contact.contactInfo.email});
          } else {
            return Vendor.findOneAndUpdate(
              { _id:mongoose.Types.ObjectId(req.body.vendorId), 
                contacts:{$not:{$elemMatch:{'contacts.name':contact.name, 'contacts.contactInfo.email':contact.contactInfo.email}}}}, 
              {$push:{contacts:contact}}, {new:true})
            .then(vendor=>{
              if (!vendor) {
                res.json({success:false, errMsg:'Failed to add contact.'});
              } else {
                if (contact.hasLoginAccess) {
                  var addedContact = vendor.contacts.find(c=>(c.name==contact.name && c.contactInfo.email==contact.contactInfo.email));
                  User.create({name:contact.name, email:contact.contactInfo.email, vendor:vendor.id, contactId:addedContact.id, password:(new Date().getTime()+''), roles:['VENDOR']})
                  .then(result=>{
                    res.json({success:true, contacts:vendor.contacts});
                  })
                  .catch(error=>{
                    res.json({success:false, errMsg:error+''});
                  })
                } else {
                  res.json({success:true, contacts:vendor.contacts});
                }
              }
            })
          }
        })
        .then(null, fail(res));
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    this.router.put("/:vendorId/:contactId", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {
        var updContact = {contactInfo:{}};
        this.copyAttributes(req.body, updContact);
        var update = Object.keys(updContact).reduce((mp,fld)=>{
          mp['contacts.$[elem].'+fld] = updContact[fld];
          return mp;
        },{});
        mongoose.Promise.all([
          Vendor.findById(req.params.vendorId),
          User.findOne({vendor:req.params.vendorId, contactId:req.params.contactId}),
          User.findOne({email:updContact.contactInfo.email})])
        .then(results=>{
          var vendor = results[0];
          var user = results[1];
          var userWithEmail = results[2];
          var promises = [];
          var origContact = vendor.contacts.find(c=>(c.id==req.params.contactId));
          var userAdded = false;
          if ((user || origContact.hasLoginAccess) && !updContact.hasLoginAccess) {
            promises.push(User.remove({vendor:req.params.vendorId, contactId:req.params.contactId}));
          } else if (!user && updContact.hasLoginAccess) {
            userAdded = true;
            promises.push(User.create({name:updContact.name, email:updContact.contactInfo.email, vendor:req.params.vendorId, contactId:req.params.contactId, password:(new Date().getTime()+''), roles:['VENDOR']}));
          } else if (updContact.hasLoginAccess) {
            if (userWithEmail && user.id != userWithEmail.id) {
              res.json({success:false, errMsg: 'A user already exists for '+updContact.contactInfo.email});
              return;
            }
          }
          if (!userAdded && user) {
            promises.push(User.findByIdAndUpdate(user.id, {$set:{email:updContact.contactInfo.email}}));
          }
          mongoose.Promise.all(promises)
          .then(results => {
            Vendor.findByIdAndUpdate(req.params.vendorId, {$set:update}, {new:true, arrayFilters:[{'elem._id':mongoose.Types.ObjectId(req.params.contactId)}]})
            .then((result)=>{
              res.json({success:true})
            })
            .catch((error)=>{
              if (error.code == 11000) {
                res.json({success:false, errMsg: 'Duplicate vendor.'})
              }
            })
          })
          .catch(error=>{
            if (error.code == 11000 && error.message.indexOf('email_1')>0) {
              res.json({success:false, errMsg: 'Login access denied (another user already exists with this email.'})
            } else {
              res.json({success:false, errMsg:error.message})
            }
            console.log(error);
          })
        })
      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }
    });
    this.router.delete("/:vendorId/:contactId", this.authenticate(this.roles), (req, res) => {
      if (this.getToken(req.headers)) {
        var promises = [];
        promises.push(Vendor.findByIdAndUpdate( req.params.vendorId, {$pull:{contacts:{_id:req.params.contactId}}} ));
        promises.push(User.remove({vendor:req.params.vendorId, contactId:req.params.contactId}));
        mongoose.Promise.all(promises)
        .then(results=>{
          if (results[0] && results[1].n>0) {
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
