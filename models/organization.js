import mongoose from "mongoose";
import Contact from'./contact.js';
var Schema = mongoose.Schema;

var contactSchema = Contact.schema;

var organizationSchema = new Schema( {
    name: { type: String, required: true, unique:true },
    organizationId: { type: String, required: true, unique: true},
    componentsUrl: String,
    contacts: [ {
        name: { type: String, required: true },
        contactType: { type: String, enum: ['Technical', 'Billing', 'Administrative'], required: true },
        hasLoginAccess: { type:Boolean, default:false },
        contactInfo: contactSchema
    } ],
    applications:[{
        name: { type: String, required: true},
        applicationId: { type: String, required: true},
        isApproved: {type: Boolean, default: true},
        mimeType: { type: String, required: false },
        logo: { type: Buffer, required: false },
        url: {type: String}
    }],
    components:[{
        name: { type: String, required: true},
        componentId: { type: String, required: true},
        isApproved: {type: Boolean, default: true}
    }],
    groups:[{
        name: {type: String, required: true}
    }]
}, {timestamps:true});

export default mongoose.model( 'Organization', organizationSchema );