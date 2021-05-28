import mongoose, { Mongoose } from 'mongoose';
import Folder from '../models/folder';
import Message from '../models/message';
import User from '../models/user'
import _ from 'lodash'

var obj = {};

obj.getUserFolderTree = function( userId ) {
    return Folder.find( {user:userId} );
};

obj.getFolderMsgs = function( userId, folderId, sentMessages ) {
  if (_.isString(userId)) userId = mongoose.Types.ObjectId(userId);
  if (_.isString(folderId)) folderId = mongoose.Types.ObjectId(folderId);
  return Message.find(sentMessages?{sendingUser:userId}:{sharings: {$elemMatch:{user:userId, folder:folderId}}})
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
      return Folder.find({user:{$in:userIds}, name: folderName}, {user:1})
    })
    .then(folders=>{
      var userToFolderMap = folders.reduce((mp,f)=>{
        mp[f.user] = f;
        return mp;
      },{})
      var sharings = recipients.map((r)=>{
        var userId = emailToUserMap[r.email]._id;
        return {
          user: userId,
          recipientType: r.type,
          folder: userToFolderMap[userId]
        };
      });
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

export default obj;