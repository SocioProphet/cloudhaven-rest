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
    // {userId:'', conversation:{topic:'', comment:{author:'', content: ''}}}
    this.router.post("/create", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userId = mongoose.Types.ObjectId(req.body.userId);

        VariableUserData.create({owner:userId, content: req.body.conversation.comment.content})
        .then(data=>{
          return Conversation.create({
            owner: userId,
            topic: req.body.conversation.topic,
            comments:[{author: userId, content: data._id}]
          })
        })
        .then((conversation)=>{
          res.json({success:true, conversaton:conversation})
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

        VariableUserData.create({owner:authorId, content: req.body.content})
        .then(data=>{
          return Conversation.findOneAndUpdate(
            {_id:mongoose.Types.ObjectId(req.body.conversationId)},
            {$push:{comments:{author: authorId, content: data._id}}},
            {new:true}
          )
        })
        .then((conversation)=>{
          res.json({success:true, conversaton:conversation})
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

        VariableUserData.findOneAndUpdate({_id:varUserDataId}, {content: req.body.content}, {new: true} )
        .then((varUserData)=>{
          res.json({success:true, content:varUserData})
        })
        .then(null, fail(res));
      /*      } else {
              res.status(403).send({success: false, msg: 'Unauthorized.'});
            }*/
    });
      
            //this.authenticate(this.roles), 
      this.router.delete("/comment/:conversationId/:commentId/:contentId", (req, res) => {
//        if (this.getToken(req.headers)) {
          var conversationId = mongoose.Types.ObjectId(req.params.conversationId);
          var commentId = mongoose.Types.ObjectId(req.params.commentId);
          var varUserDataId = mongoose.Types.ObjectId(req.params.contentId);

          Conversation.findOneAndUpdate( {_id: conversationId}, {$pull:{comments:{_id:commentId}}}, {new: true} )
          .then(conversation=>{
            return VariableUserData.deleteOne({_id: varUserDataId})
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
