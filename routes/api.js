import mongoose from 'mongoose';
import passport from 'passport';
import config from '../config/database';
import passportObj from '../config/passport'
import express from 'express';
import jwt from 'jsonwebtoken';
import User from "../models/user";
import { CalendarScheduling } from './actions/calendarscheduling.js';
//import VendorApp from './actions/vendorapp.js'
import { UserDataMgr } from './actions/userdata.js'
import { ConversationMgr } from './actions/conversation.js'
import { UserInfo } from './actions/userinfo.js'
import { UserSearch } from './actions/usersearch.js'
import { Reports } from './actions/reports.js'
import { VendorContactMgr } from './actions/vendorcontact'
import { UserSubscription } from './actions/usersubscription'
import { VendorAppMgr } from './actions/vendorapplication'
import { ChangePassword } from './actions/chgpwd'
import cityStateLookup from '../services/citystatelookup'
import { AuditLogReview } from './actions/auditlogreview'
import { EventLogReview } from './actions/eventlogreview'




import { UserController, VendorController } from './controllers';


export default function() {
  passportObj(passport);
  const router = express.Router();

  router.get('/citystatelookup/:zip', (req, res) => {
    cityStateLookup(req.params.zip)
    .then(cityStateObj=>{
      res.json(cityStateObj);
    })
   });
  router.post('/emailtest', (req, res) => {
    NotificationService.sendEmail( req.body.testEmail, 'Email Test', 'This is a test email from SRSS.', process.env.EMAIL_USER )
    .then(ok =>{
      res.json({succeeded:ok});
    })
  });
  
    router.post('/signup', (req, res) => {
      if (!req.body.email || !req.body.password) {
        res.json({success: false, msg: 'Please supply both email and password.'});
      } else {
        var newUser = new User({
          email: req.body.email,
          password: req.body.password,
          language: req.body.language,
          roles: []
        });
        // save the user
        newUser.save(function(err) {
          if (err) {
            if (err.name == 'ValidationError') {
              res.json({success:false, errMsg: err.message})
            } else if (err.name == 'MongoError' && err.code == 11000) {
              res.json({success: false, msg: `User with email ${req.body.email} already exists.`});
            } else {
              res.json({success:false, errMsg: err.message})
            }
          }
          res.json({success: true, msg: 'Successful created new user.'});
        });
      }
    });
  
    router.post('/login', (req, res) => {
      User.findOne({email: req.body.email}, {OSC:1, email:1, password:1, firstName:1, lastName:1, name:1, roles:1, vendor:1})
      .then(user => {
        if (!user) {
          res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
          // check if password matches
          user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
              // if user is found and password is right create a token
              var token = jwt.sign(user.toJSON(), config.secret,  {expiresIn: '24h'} );
              // return the information including token as JSON
              res.json({success: true, token: 'JWT ' + token, user:user});
            } else {
              res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
          });
        }
      })
      .catch(err=>{
        res.status(401).send({success: false, msg: `Authentication failed. Error: ${err}.`});
      })
    });
  
    router.use( '/users', new UserController().route());
    router.use( '/vendors', new VendorController().route());
  
    router.use( '/calendarscheduling', new CalendarScheduling().route());
    router.use( '/auditlog', new AuditLogReview().route());
    router.use( '/eventlog', new EventLogReview().route());

//    router.use( '/vendorapp', new VendorApp().route());
    router.use( '/userinfo', new UserInfo().route());
    router.use( '/usersearch', new UserSearch().route());
    router.use( '/userdata', new UserDataMgr().route());
    router.use( '/conversation', new ConversationMgr().route());
    router.use( '/reports', new Reports().route());
    router.use( '/vendorcontact', new VendorContactMgr().route());
    router.use( '/usersubscription', new UserSubscription().route());
    router.use( '/vendorapplication', new VendorAppMgr().route());
    router.use( '/chgpwd', new ChangePassword().route());
    
    
    return router;
  }
