import mongoose from 'mongoose';
import Folder from '../models/folder';
import Message from '../models/message';
import User from '../models/user'
import Organization from '../models/organization'
import _ from 'lodash'

var obj = {};

function ensureRequiredFolders( userId, folders ) {
  var requiredFolders = {Inbox:1, Sent:1, Trash:1};
  folders.forEach(f=>{
    if (!f.parentFolder) {
      delete requiredFolders[f.name];
    }
  });
  var foldersToAdd = Object.keys(requiredFolders).map(fn=>({name:fn, user:userId}));
  return foldersToAdd.length>0?Folder.insertMany(foldersToAdd):mongoose.Promise.resolve([]);
}
obj.getUserFolderTree = function( userId ) {
    return Folder.find( {user:userId} )
    .then( folders =>{
      return ensureRequiredFolders(userId, folders)
      .then(addlFolders=>{
        return folders.concat(addlFolders);
      })
    })
    .catch(error=>{
      console.log(error);
    })
};

obj.getFolderMsgs = function( userId, folderId ) {
  if (_.isString(userId)) userId = mongoose.Types.ObjectId(userId);
  if (_.isString(folderId)) folderId = mongoose.Types.ObjectId(folderId);
  return Message.find({sharings: {$elemMatch:{user:userId, folder:folderId}}})
    .populate({path: 'sharings.user', select:{name:1, firstName:1, middleName:1, lastName:1}})
}

//Get all of the tasks for all of the groups for which a user is a member
//params: userId
obj.getUnassignedTasksForUser = function( pUserId ) {
  var userId = mongoose.Types.ObjectId(pUserId);
  return Organization.find({'groups.members':{$elemMatch:{$eq:userId}}})
  .then(orgs =>{
    var groupIds = orgs.reduce((ar, o)=>{
      ar = ar.concat(o.groups.filter(g=>(g.members.find(m=>(m.toString()==pUserId)))));
      return ar;
    },[]).map(g=>(g._id));
    return Message.find({sharings:{$elemMatch:{recipientType:'taskqueue', groupId:{$in:groupIds}}}})
  })
}
//params: groupId, subject, message
obj.queueTask = function( params ) {
  return Message.create(
    {
      sharings:[{groupId:params.groupId, recipientType:'taskqueue'}],
      subject: params.subject || '',
      message: params.message || '',
      applicationId: params.applicationId || ''
    });
}

//params: senderId, recipients, folderName, subject, message
//recipients: [{type: 'to|cc|bcc', email: <email>}, ...]
obj.userCreateMsg = function( params ) {
  var promise = new Promise(function( resolve, reject) {
    var emailToUserMap = {};
    var organizationId = null;
    var componentId = null;
    var applicationId = null;
    var emails = params.recipients.map((r)=>{
      if (!_.isString(r)) {
        if (!r.email) {
          reject('No username (email) specified for recipient.');
        }
        if (!r.type) {
          reject('No type (to, cc, bcc) specified for recipient.');
        }
      }
      return _.isString(r)?r:r.email;
    });
    if (!params.senderId && params.senderEmail) {
      emails.push( params.senderEmail );
    }
    var promises = [];
    promises.push(User.find({email:{ $in: emails}}, {_id:1, email:1}));
    if (params.application) {
      var filter = {organizationId:params.application.organizationId};
      if (params.application.applicationId) {
        filter.applications = {$elemMatch:{applicationId:params.application.applicationId}};
      } else if (params.application.componentId) {
        filter.components = {$elemMatch:{componentId:params.application.componentId}};
      } else {
        reject('Missing applicationId or componentId');
      }
    }
    promises.push(Organization.findOne(filter));
    mongoose.Promise.all(promises)
    .then(results=>{
      if (results.length>1) {
        var org = results[1];
        if (!org) {
          reject(`Unrecognized ${params.applicationId?'application':'component'}.`);
        }
        organizationId = org._id;
        if (params.application.applicationId) {
          var app = org.applications.find(a=>(a.applicationId==params.application.applicationId));
          applicationId = app?app._id.toString():'';
        } else if (params.application.componentId) {
          var component = org.components.find(c=>(c.componentId)==params.application.componentId);
          componentId = component?component._id.toString():'';

        }
      }
      var users = results[0];
      var userIds = [];
      emailToUserMap = users.reduce((mp,u)=>{
        mp[u.email] = u;
        userIds.push(u._id);
        return mp;
      },{});
      return Folder.find({user:{$in:userIds}, name: {$in:['Sent','Trash', params.folderName]}}, {user:1, name:1})
    })
    .then(folders=>{
      var sentFolder = null;
      var userToFolderMap = folders.reduce((mp,f)=>{
        mp[f.name+'|'+f.user] = f;
        if (f.name == 'Sent') sentFolder = f;
        return mp;
      },{})
      var sharings = params.recipients.map((r)=>{
        var userId = emailToUserMap[r.email]._id;
        return {
          user: userId,
          recipientType: r.type,
          folder: userToFolderMap[params.folderName+'|'+userId]
        };
      });
      if (sentFolder) {
        sharings.push({user:params.senderId, recipientType:'sender', folder: sentFolder._id})
      }
      var message = {
        sendingUser: params.senderId || emailToUserMap[params.senderEmail],
        sharings: sharings,
        subject: params.subject||'',
        message: params.message||''
      };
      if (params.application.organizationId) message.organization = organizationId;
      if (params.application.applicationId) message.applicationId = applicationId;
      if (params.application.componentId) message.componentId = componentId;
      if (params.application.appConfigData) message.appConfigData = JSON.stringify(params.application.appConfigData);
  
      return Message.create(message);
    })
    .then(newMsg =>{
      resolve(newMsg);
    })
    .catch(err =>{
      reject(err);
    })
  });
  return promise;
}
obj.delete = function(msgId, folderId, userId) {
  if (_.isString(msgId)) msgId = mongoose.Types.ObjectId(msgId);
  if (_.isString(userId)) userId = mongoose.Types.ObjectId(userId);
  if (_.isString(folderId)) folderId = mongoose.Types.ObjectId(folderId);
  var trashFolder = null;
  var deleteFolder = null;
  var promise = new Promise(function( resolve, reject) {
    Folder.find({user:userId, $or:[{name: 'Trash'}, {_id:folderId}]}, {user:1, name:1})
    .then(folders =>{
      deleteFolder = folders.find(f=>(f._id.toString() == folderId.toString()));
      trashFolder = folders.find(f=>(f.name=='Trash'));
      if (deleteFolder.name == 'Trash') {
        return Message.findOneAndUpdate({_id: msgId, sharings:{$elemMatch:{user:userId, folder:trashFolder._id}}},
          {$pull:{sharings:{user:userId, folder:folderId}}}, {new:true})
      } else {
        return Message.findOneAndUpdate({_id: msgId}, 
          {$set:{'sharings.$[elem].folder':trashFolder._id}}, {arrayFilters: [{'elem.folder':deleteFolder._id}], new:true}) 
      }
    })
    .then(newMsg=>{
      if (newMsg && newMsg.sharings.length==0) {
        Message.remove( {_id: msgId})
        .then(result => {
          resolve(true);
        })
      } else {
        resolve(true);
      }
    })
    .catch(err => {
      console.log(err);
      resolve(false);
    })
  })
  return promise;
}

export default obj;