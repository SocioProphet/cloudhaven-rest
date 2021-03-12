import { Router } from 'express';
import passport from 'passport';
import passportObj from '../../config/passport'
import { checkRoleWithPassport } from '../../checkroles'
import AuditLog from '../../models/auditlog'

passportObj(passport);

import jwt from 'jsonwebtoken';

export default class BaseController{
    constructor() {
        this.router = new Router();
        this.authData = {};
    }
  
    getToken(headers) {
      if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
          return parted[1];
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    getUser() {
      return (this.authData && this.authData.user) ? this.authData.user.name : '';
    }

    authenticate(roles, sourceTag) {
      var ad = this.authData;
      var retVal = checkRoleWithPassport({authData:this.authData, user:this.authData.user, roles:roles}, passport, sourceTag );
      var a = this.authData;
      var x = '';
      return retVal;
    }

    logAuditData( model, recordId, operation, dataObj) {
      var publicIdFldMap = {}
      var obj = { user:this.authData.user.id, model:model, operation: operation };
      if (dataObj) {
        obj.data = JSON.stringify(dataObj);
        var publicIdFld = publicIdFldMap[obj.model];
        if (publicIdFld) {
          var publicId = dataObj[publicIdFld];
          if (publicId) {
            obj.publicId = publicId;
          }
          obj.isPHI = true;
        }
      }
      if (recordId) obj.recordId = recordId;
      AuditLog
      .create( obj )
      .then(auditLogObj => {
        var x = auditLogObj;
      })
      .then(null, error=>{
        console.log(error);
      })
    }
    
    copyAttributes( src, dst, key ) {
      const skipAttributes = {id:true, _id:true, createdAt:true, updatedAt:true, __v:true}
      if (key) skipAttributes[key] = true;
      for (var attribute in src){
        if (attribute == 'contactInfo') {
          this.copyAttributes( src.contactInfo, dst.contactInfo, key);
        } else {
          if (src.hasOwnProperty(attribute) && attribute !== key && !skipAttributes[attribute]){
            dst[attribute] = src[attribute];
          }
        }
      }
    }
  
    route(){
    }
    
}  