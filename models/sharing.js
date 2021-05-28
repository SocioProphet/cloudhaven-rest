import mongoose from "mongoose"
var Schema = mongoose.Schema;

var sharingSchema = new Schema ({
  user: { type:Schema.ObjectId, ref:'User' },
  group: { type: String},
  recipientType: { type: String, enum: ['to', 'cc', 'bcc']},
  folder: { type:Schema.ObjectId, ref:'Folder' }
});
sharingSchema.set('toJSON', { virtuals: true });
export default mongoose.model( 'Sharing', sharingSchema );