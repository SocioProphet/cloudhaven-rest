import mongoose from "mongoose";
import User from'./user.js';
var Schema = mongoose.Schema;

var organizationSchema = new Schema( {
    name: { type: String, required: true, unique:true },
    organizationId: { type: String, required: true, unique: true},
    componentsUrl: String,
    applications:[{
        name: { type: String, required: true},
        applicationId: { type: String, required: true},
        source: {type: String, enum: ['App Server', 'CloudHaven'], default:'CloudHaven'},
        isApproved: {type: Boolean, default: true},
        mimeType: { type: String, required: false },
        logo: { type: Buffer, required: false },
        url: {type: String},
        status: {type: String, required: true, enum:['Draft', 'Published'], default: 'Draft'},
        pages: [{name: {type: String, required:true}, content:String}]
    }],
    components:[{
        name: { type: String, required: true},
        componentId: { type: String, required: true},
        source: {type: String, enum: ['App Server', 'CloudHaven'], default:'CloudHaven'},
        isApproved: {type: Boolean, default: true},
        status: {type: String, required: true, enum:['Draft', 'Published'], default: 'Draft'},
        content: String
    }],
    groups:[{
        name: {type: String, required: true}
    }]
}, {timestamps:true});

export default mongoose.model( 'Organization', organizationSchema );