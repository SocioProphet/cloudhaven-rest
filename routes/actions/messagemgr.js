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

    return this.router;
  }
}
