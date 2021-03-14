var mongoose = require('mongoose');
import Comment from'./comment.js';
var CommentSchema = Comment.schema;
var Schema = mongoose.Schema;


var ConversationSchema = new Schema({
  created_at: { type: Date, required: true, default: Date.now},
  owner: { type:Schema.ObjectId, ref:'User', required: true },
  topic: { type: String, required: false},
  comments: [CommentSchema]
});

module.exports = mongoose.model('Conversation', ConversationSchema);