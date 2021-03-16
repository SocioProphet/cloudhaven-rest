var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VariableUserDataSchema = new Schema({
    owner: { type:Schema.ObjectId, ref:'User', required: true },
    content: { type: String, required: true },
    created_at: { type: Date, required: true, default: Date.now},
    modified_at: { type: Date, required: false}
});

module.exports = mongoose.model('VariableUserData', VariableUserDataSchema);