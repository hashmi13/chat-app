import express from 'express';
import multer from 'multer';
import { routes } from '../middleWare/auth.js';
import { 
    createGroup, 
    getUserGroups, 
    getGroupDetails, 
    getGroupMessages, 
    sendGroupMessage, 
    addGroupMembers, 
    removeGroupMember, 
    leaveGroup,
    markGroupMessageSeen,
    updateGroup
} from '../controllers/groupCont.js';

const groupRoutes = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Apply auth middleware to all routes
groupRoutes.use(routes);

// Group routes
groupRoutes.post('/create', createGroup);
groupRoutes.get('/user-groups', getUserGroups);
groupRoutes.get('/:groupId', getGroupDetails);
groupRoutes.get('/:groupId/messages', getGroupMessages);
groupRoutes.post('/:groupId/send', sendGroupMessage);
groupRoutes.post('/:groupId/add-members', addGroupMembers);
groupRoutes.delete('/:groupId/members/:memberId', removeGroupMember);
groupRoutes.delete('/:groupId/leave', leaveGroup);
groupRoutes.put('/:groupId/messages/:messageId/seen', markGroupMessageSeen);
groupRoutes.put('/:groupId/update', upload.single('groupPic'), updateGroup);

export default groupRoutes; 