var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var emailMatch = [/^[^@]+@[^\.]+\..+$/, "Please fill a valid email address"];

var FolderSchema = new Schema({
});

var UserSchema = new Schema({
  email: {type: String, unique: true, required: true, match: emailMatch },
  password: { type: String   },
  firstName: { type: String, required: true},
  middleName: { type: String, required: false},
  lastName: { type: String, required: true},
  dateOfBirth: Date,
  ssn: String,
  language: { type: String, required: true, enum: ['English', 'Spanish'], default:'English' },
  roles: [{type:String, enum: ['SYSADMIN', 'USER']}],
  organization: { type:Schema.ObjectId, ref:'Organization', required: false },
  contactId: String,
  subscribedApps: [{
    startDatetime: { type: Date, required: true, default: Date.now},
    organization: { type:Schema.ObjectId, ref:'Organization', required: true },
    application: { type: String, required: true }
  }]
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (user.password && (this.isModified('password') || this.isNew)) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

UserSchema.virtual('name').get(function () {
    return this.firstName+' '+(this.middleName?(this.middleName+' '):'')+this.lastName;
});
UserSchema.set('toObject', { virtuals: true })
UserSchema.set('toJSON', { virtuals: true })
module.exports = mongoose.model('User', UserSchema);