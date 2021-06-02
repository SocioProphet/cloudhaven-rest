import mongoose, { Mongoose } from 'mongoose';
import CalendarEvent from '../models/calendarevent';
import moment from 'moment';
import User from '../models/user'
import _ from 'lodash'

var obj = {};


obj.getEvents = function( userId, start, end ) {
  if (_.isString(userId)) userId = mongoose.Types.ObjectId(userId);
  return CalendarEvent.find({owner: userId, start: {$gte:start, $lt:end} /*, end:{$or:[{$eq:null}, {$lt:end}]}*/})
    .populate({path: 'owner', select:{name:1, firstName:1, middleName:1, lastName:1}})
}

obj.userCreateEvent = function( ownerId, type, title, content, start, end, durationType ) {
  var event = {
    owner: ownerId,
    title: title,
    content: content || '',
    start: start,
    end: end,
    durationType: durationType
  };
  if (type) event.type = type;
  return CalendarEvent.create(event);
}
obj.userUpdateEvent = function( _id, type, title, content, start, end, durationType ) {
  var update = {$set:{
    title: title,
    content: content || '',
    start: start,
    end: end,
    durationType: durationType
  }
  };
  if (type) update['$set'].type = type;
  if (_.isString(_id)) _id = mongoose.Types.ObjectId(_id);
  return CalendarEvent.findOneAndUpdate({_id: _id}, update, {new:true});
}
obj.delete = function(userId, eventId ) {
  if (_.isString(userId)) userId = mongoose.Types.ObjectId(userId);
  if (_.isString(eventId)) eventId = mongoose.Types.ObjectId(eventId);
  return CalendarEvent.deleteOne({owner: userId, _id: eventId})
}

export default obj;