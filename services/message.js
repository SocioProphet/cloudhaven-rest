import mongoose, { Mongoose } from 'mongoose';
import Folder from '../models/folder';
import _ from 'lodash'

var obj = {};

obj.getUserFolderTree = function( userId ) {
    return Folder.find( {user:userId} );
};

export default obj;