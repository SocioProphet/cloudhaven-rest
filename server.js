import createError from 'http-errors';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import mongoose from 'mongoose';
import passport from 'passport';
import config from './config/database';

import User from './models/user.js'

//import pdf from 'express-pdf'
//express-pdf uses html-pdf which has a critical vulnerability, however the way this application
//uses this package is safe and this vulnerability can be ignored


import fs from 'fs'
import https from 'https'

import api  from './routes/api';

const args = process.argv.slice(2);
console.log(JSON.stringify(args));

const DIST_DIR = path.join(__dirname, "dist");
const PORT = 3000;
const useSSL = false; //process.env.NODE_ENV != 'development'; //args.find(a=>(a.toLowerCase()=='-usessl'))!=null;

mongoose.connect(config.database, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }, (err) => {
  if (err)
      console.error(err);
  else
      console.log("Connected to the mongodb"); 
});

var spaServer = null;
const spaApp = express();
console.log(__dirname + '\\spa');
spaApp.use(express.static(__dirname + '\\spa'));
var logger0 = function(req, res, next) {
  console.log('Req:'+req.method);
  console.log('Path:'+req.path);
  console.log('Params:'+JSON.stringify(req.params));
  next(); // Passing the request to the next handler in the stack.
}
spaApp.use(logger0);

var key_config = null;
if (useSSL) {
  key_config = {
//    pfx: fs.readFileSync('demo_surgicalrecoverysuites_com.pfx'),
    key: fs.readFileSync('demo_cloudhaven_com.key'),
    cert: fs.readFileSync('demo_cloudhaven_com.crt'),
    ca:[
      fs.readFileSync('TrustedRoot.crt'),
      fs.readFileSync('DigiCertCA.crt')
    ]
  }
  https.createServer(key_config, spaApp)
  .listen(443, function () {
    console.log('SPA app listening on port 443 with SSL.')
  })
} else {
  console.log('SPA running on port 80')
  spaServer = spaApp.listen(80);
}


//ClearingHouse.getClaimsStatus();
const app = express();

//app.use(pdf);

//Serving the files on the dist folder
app.use(express.static(DIST_DIR));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });
  
  var logger2 = function(req, res, next) {
    console.log('Req:'+req.method);
    console.log('Path:'+req.path);
    console.log('Params:'+JSON.stringify(req.params));
    next(); // Passing the request to the next handler in the stack.
  }
  app.use(logger2);
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
//  app.use(logger('dev'));
  app.use(passport.initialize());
    
  app.use('/api', api());

  //Send index.html when the user access the web
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

if (useSSL) {
  https.createServer(key_config, app)
  .listen(PORT, function () {
    console.log('REST server listening on port 3000 with SSL.')
  })
} else {
  app.listen(PORT);
}

User.find({})
.then((results)=>{
  if (results.length==0) {
    var newUser = new User({
      email: 'richjvann@gmail.com',
      password: '22222',
      language: 'English',
      roles: ['SYSADMIN']
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
      } else {
        console.log('Initial user (richjvann) created.');
      }
    });
  }
})

