import mongoose from "mongoose";
var Schema = mongoose.Schema;

var commentSchema = new Schema( {
    author: { type:Schema.ObjectId, ref:'User', required: true },
    content: { type:Schema.ObjectId, ref:'VariableUserData', required: true },
    created_at: { type: Date, required: true, default: Date.now},
    lastEdited_at: { type: Date, required: false}
});

export default mongoose.model( 'Comment', commentSchema );