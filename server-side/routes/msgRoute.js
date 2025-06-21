import express from 'express';
import { routes } from '../middleWare/auth.js';
import { getMessgaes, getUsersidBar, markmessageSeen, sendMessage } from '../controllers/msgCont.js';

const messageRoutes = express.Router();

// Apply auth middleware to all routes
messageRoutes.use(routes);

// Message routes
messageRoutes.get('/users', getUsersidBar);
messageRoutes.get('/:id', getMessgaes);
messageRoutes.get('/mark/:id', markmessageSeen);
messageRoutes.post('/send/:id', sendMessage);

export default messageRoutes;