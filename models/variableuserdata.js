var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VariableUserDataSchema = new Schema({
    owner: { type:Schema.ObjectId, ref:'User', required: true },
    content: { type: String, required: true }
});

module.exports = mongoose.model('VariableUserData', VariableUserDataSchema);