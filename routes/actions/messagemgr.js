import BaseAction from './baseaction'
import Roles from '../../models/workflowroles'
import MessageSrvc from '../../services/message'
import {fail} from "../../js/utils"
import mongoose, { Mongoose } from 'mongoose';

export class MessageMgr extends BaseAction {
  constructor(){
    super();
    this.setRoles(Roles.SysAdmin, Roles.User);
  }

  route() {
    // 
    // {userId:'', updates:[{name: '', content:''}, ...]}
    this.get({path:"/gettree"}, (req, res) => {
      MessageSrvc.getUserFolderTree( this.authData.user._id )
      .then((folders)=>{
        res.json(folders)
      })
      .then(null, fail(res));
    });

    // {recipients:[{type:'', email:''}...], subject, message}
    this.post({path:"/usersendmsg"}, (req, res) => {
      MessageSrvc.userCreateMsg( req.body.sender, req.body.recipients, "Inbox",  req.body.subject, req.body.message )
      .then(newMsg =>{
        res.json({success: true, msg: newMsg});
      })
      .catch(err =>{
        res.json({sucess:false, errMsg: 'Failed to create message'});
      })
    });

    this.get({path:"/getfoldermsgs/:folderId/:isSentFolder"}, (req, res) =>{
      MessageSrvc.getFolderMsgs( this.authData.user._id, req.params.folderId, req.params.isSentFolder=='true' )
      .then(messages =>{
        res.json(messages || []);
      })
      .catch(err =>{
        res.json({sucess:false, errMsg: 'Failed to create message'});
      })
    });
    return this.router;
  }
}
