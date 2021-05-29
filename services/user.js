import mongoose, { Mongoose } from 'mongoose';
import Folder from '../models/folder';
import User from '../models/user';
import _ from 'lodash'

var obj = {};

obj.createUserMessageFolders = function( userId ) {
  var promise = new Promise(function( resolve, reject){
    if (_.isString(userId)) userId = mongoose.Types.ObjectId(userId);
    Folder.find( {user:userId}, {name:1} )
    .then((folders)=>{
      var folderMap = (folders||[]).reduce((mp,f)=>{
        mp[f.name] = f;
        return mp;
      },{});
      return ['Inbox', 'Sent', 'Trash'].reduce((ar, fn)=>{
        if (!folderMap[fn]) {
          ar.push({user: userId, name: fn});
        }
        return ar;
      },[]);
    })
    .then((folders) => {
      if (folders.length==0) {
        resolve(true);
      } else {
        Folder.insertMany(folders)
        .then(result=>{
          resolve(true);
        })    
      }
    })
  })
  return promise;
};
obj.userSearch = function( searchPhrase ) {
  var filter = {$or: [
    { email: { '$regex': searchPhrase, '$options': 'i'}},
    { firstName: { '$regex': searchPhrase, '$options': 'i'}},
    { lastName: { '$regex': searchPhrase, '$options': 'i'}}
]};
  return User.find(filter, {email:1, firstName:1, middelName:1, lastName:1 });
}

export default obj;