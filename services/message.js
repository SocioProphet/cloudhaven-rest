import mongoose, { Mongoose } from 'mongoose';
import Folder from '../models/folder';
import Message from '../models/message';
import User from '../models/user'
import _ from 'lodash'

var obj = {};

obj.getUserFolderTree = function( userId ) {
    return Folder.find( {user:userId} );
};

obj.getFolderMsgs = function( userId, folderId ) {
  if (_.isString(userId)) userId = mongoose.Types.ObjectId(userId);
  if (_.isString(folderId)) folderId = mongoose.Types.ObjectId(folderId);
  return Message.find({sharings: {$elemMatch:{user:userId, folder:folderId}}})
    .populate({path: 'sharings.user', select:{name:1, firstName:1, middleName:1, lastName:1}})
}

//recipients: [{type: 'to|cc|bcc', email: <email>}, ...]
obj.userCreateMsg = function( senderId, recipients, folderName,  subject, message ) {
  var promise = new Promise(function( resolve, reject){
    var emailToUserMap = {};
    var emails = recipients.map(r=>(r.email));
    User.find({email:{ $in: emails}}, {_id:1, email:1})
    .then(users=>{
      var userIds = [];
      emailToUserMap = users.reduce((mp,u)=>{
        mp[u.email] = u;
        userIds.push(u._id);
        return mp;
      },{});
      return Folder.find({user:{$in:userIds}, name: {$in:['Sent','Trash', folderName]}}, {user:1, name:1})
    })
    .then(folders=>{
      var sentFolder = null;
      var userToFolderMap = folders.reduce((mp,f)=>{
        mp[f.name+'|'+f.user] = f;
        if (f.name == 'Sent') sentFolder = f;
        return mp;
      },{})
      var sharings = recipients.map((r)=>{
        var userId = emailToUserMap[r.email]._id;
        return {
          user: userId,
          recipientType: r.type,
          folder: userToFolderMap[folderName+'|'+userId]
        };
      });
      if (sentFolder) {
        sharings.push({user:senderId, recipientType:'sender', folder: sentFolder._id})
      }
      return Message.create({
        sendingUser: senderId,
        sharings: sharings,
        subject: subject||'',
        message: message||''
      })
    })
    .then(newMsg =>{
      resolve(newMsg);
    })
    .catch(err =>{
      resolve(null);
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