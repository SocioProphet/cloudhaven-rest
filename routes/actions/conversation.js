import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import VariableUserData from '../../models/variableuserdata';
import Conversation from '../../models/conversation';
import {fail} from "../../js/utils"
import mongoose, { Mongoose } from 'mongoose';

export class ConversationMgr extends BaseAction{
  constructor(){
    super();
    this.roles = [Roles.SysAdmin, Roles.User];
  }

  route() {
    //this.authenticate(Roles.ANY, 'Create Conversation'), 
    this.router.post("/", (req, res) => {
      //      if (this.getToken(req.headers)) {
      Conversation.findOne({
          vendor:mongoose.Types.ObjectId(req.body.application.vendorId),
          applicationId: req.body.application.applicationId,
          page: req.body.application.page,
          topic: req.body.topic})
        .populate('owner')
        .populate({path:'comments', populate: {path: 'owner'}})
        .then((conversation)=>{
          res.json(conversation)
        })
        .then(null, fail(res));
      /*      } else {
              res.status(403).send({success: false, msg: 'Unauthorized.'});
            }*/
    });

    //this.authenticate(Roles.ANY, 'Create Conversation'), 
    this.router.get("/list", (req, res) => {
      //      if (this.getToken(req.headers)) {
        var userId = mongoose.Types.ObjectId(req.body.userId);

        Conversation.find({})
        .populate('owner')
        .populate('vendor')
        .populate({path:'comments', populate: {path: 'owner'}})
        .then((conversations)=>{
          res.json(conversations)
        })
        .then(null, fail(res));
      /*      } else {
              res.status(403).send({success: false, msg: 'Unauthorized.'});
            }*/
    });

    //this.authenticate(Roles.ANY, 'Create Conversation'), 
    // {userId:'', topic: '', content: ''}
    this.router.post("/create", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userId = mongoose.Types.ObjectId(req.body.userId);

        VariableUserData.create({
          owner:userId, 
          content: req.body.content})
        .then(comment=>{
          return Conversation.findOneAndUpdate(
            {vendor:mongoose.Types.ObjectId(req.body.application.vendorId),
              applicationId: req.body.application.applicationId,
              page: req.body.application.page,
              topic: req.body.topic},
            { $set: {
            owner: userId,
            vendorId: req.body.application.vendorId,
            applicationId: req.body.application.applicationId,
            page: req.body.application.page,
            topic: req.body.topic,
            comments:[comment]
          }}, {upsert: true, new: true})
          .populate('owner')
          .populate({path:'comments', populate: {path: 'owner'}})
        })
        .then((conversation)=>{
          res.json({success:true, conversation:conversation})
        })
        .then(null, fail(res));
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
    });

    //this.authenticate(Roles.ANY, 'Add Comment'), 
    // {conversationId:'', authorId:'', content: ''}
    this.router.post("/addcomment", (req, res) => {
//      if (this.getToken(req.headers)) {
        var authorId = mongoose.Types.ObjectId(req.body.authorId);
        var newComment = null;
        VariableUserData.create({owner:authorId, content: req.body.content})
        .then(comment=>{
          newComment = comment;
          return Conversation.findOneAndUpdate(
            {_id:mongoose.Types.ObjectId(req.body.conversationId)},
            {$push:{comments:comment}},
            {new:true}
          )
        })
        .then((conversation)=>{
          res.json(newComment)
        })
        .then(null, fail(res));
/*      } else {
        res.status(403).send({success: false, msg: 'Unauthorized.'});
      }*/
      });

    //this.authenticate(Roles.ANY, 'Add Comment'), 
    // {contentId:'', content: ''}
    this.router.post("/updatecomment", (req, res) => {
      //      if (this.getToken(req.headers)) {
        var varUserDataId = mongoose.Types.ObjectId(req.body.contentId);

        VariableUserData.findOneAndUpdate({_id:varUserDataId}, 
          {$set:{content: req.body.content, modified_at: new Date()}}, {new: true} )
        .then((varUserData)=>{
          res.json({success:true, content:varUserData})
        })
        .then(null, fail(res));
      /*      } else {
              res.status(403).send({success: false, msg: 'Unauthorized.'});
            }*/
    });
      
            //this.authenticate(this.roles), 
      this.router.delete("/comment/:conversationId/:commentId", (req, res) => {
//        if (this.getToken(req.headers)) {
          var conversationId = mongoose.Types.ObjectId(req.params.conversationId);
          var commentId = mongoose.Types.ObjectId(req.params.commentId);

          Conversation.findOneAndUpdate( {_id: conversationId}, {$pull:{comments:{_id:commentId}}}, {new: true} )
          .then(conversation=>{
            return VariableUserData.deleteOne({_id: commentId})
          })
          .then(results=>{
            if (results && results.n>0) {
              res.json({success:true});
            }
          })
          .catch(error=>{
            res.json({success:false, errMsg:error+''});
          })
/*        } else {
          res.status(403).send({success: false, msg: 'Unauthorized.'});
        }*/
      });
  
  
      return this.router;
  }
}
