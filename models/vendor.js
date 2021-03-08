import mongoose from "mongoose";
import Contact from'./contact.js';
var Schema = mongoose.Schema;

var contactSchema = Contact.schema;

var vendorSchema = new Schema( {
    name: { type: String, required: true, unique:true },
    contacts: [ {
        name: { type: String, required: true },
        contactType: { type: String, enum: ['Technical', 'Billing', 'Administrative'], required: true },
        hasLoginAccess: { type:Boolean, default:false },
        contactInfo: contactSchema
    } ],
    applications:[{
        name: { type: String, required: true},
        isApproved: {type: Boolean, default: true},
        mimeType: { type: String, required: false },
        logo: { type: Buffer, required: false },
        url: {type: String}
    }]
}, {timestamps:true});

export default mongoose.model( 'Vendor', vendorSchema );