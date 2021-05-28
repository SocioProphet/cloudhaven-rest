import mongoose from 'mongoose';
import scheduleItemSchema from 'scheduleitem';
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    user: { type:Schema.ObjectId, ref:'User' },
//    group: { type:Schema.Object, ref:'Group'},

    subject: { type: String, required: true},
    message: { type: String, required: true },
    organizationzation: { type: Schema.ObjectId, ref: 'Organization'},
    applicationId: {type:String, default: ''},
    componentId: {type:String, default: ''},
    appConfigData: String, //any string value including stringified JSON
    wasRead: {type: Boolean, default: true},
    isDone: {type: Boolean, default: false},
    resultMessage: String,
    schedule: scheduleItemSchema
});

MessageSchema.index({user:1, name: 1, applicationId:1, appAuxId: 1});
module.exports = mongoose.model('Message', MessageSchema);