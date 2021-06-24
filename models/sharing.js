import mongoose from "mongoose"
var Schema = mongoose.Schema;

//Can be shared with a user or a org/group
var sharingSchema = new Schema ({
  user: { type:Schema.ObjectId, ref:'User' },
  groupId: { type: String }, //InternalId of group
  recipientType: { type: String, enum: ['to', 'cc', 'bcc', 'sender', 'taskqueue']},
  folder: { type:Schema.ObjectId, ref:'Folder' }
});
sharingSchema.set('toJSON', { virtuals: true });
export default mongoose.model( 'Sharing', sharingSchema );
