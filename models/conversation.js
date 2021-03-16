var mongoose = require('mongoose');
import VariableUserData from'./variableuserdata.js';
var VariableUserDataSchema = VariableUserData.schema;
var Schema = mongoose.Schema;


var ConversationSchema = new Schema({
  created_at: { type: Date, required: true, default: Date.now},
  owner: { type:Schema.ObjectId, ref:'User', required: true },
  topic: { type: String, required: false},
  comments: [VariableUserDataSchema]
});

module.exports = mongoose.model('Conversation', ConversationSchema);