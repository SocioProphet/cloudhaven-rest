var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var AppFavoriteSchema = new Schema({
    name: {type: String, required: true},
    organization: { type: Schema.ObjectId, ref: 'Organization'},
    applicationId: {type:String, default: ''},
    componentId: {type:String, default: ''},
    appConfigData: String //any string value including stringified JSON
});

module.exports = mongoose.model('AppFavorite', AppFavoriteSchema);