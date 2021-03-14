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
    //this.authenticate(Roles.ANY, 'Update UserData'), 
    // {userId:'', conversation:{topic:'', comment:{author:'', content: ''}}}
    this.router.post("/create", (req, res) => {
//      if (this.getToken(req.headers)) {
        var userId = mongoose.Types.ObjectId(req.body.userId);

        VariableUserData.create({owner:userId, content: req.body.conversation.comment.content})
        .then(data=>{
          return Conversation.create({
            owner: userId,
            topic: req.body.conversation.topic,
            comment:[{author: userId, content: data._id}]
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

    return this.router;
  }
}
