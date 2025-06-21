import express from 'express'
import { checkAuth, login, signup, UpdateProfile, validateSignup, validateLogin } from '../controllers/userCont.js';
import { routes } from '../middleWare/auth.js';
const userRoutes = express.Router();

// Auth routes
userRoutes.post("/signup", validateSignup, signup);
userRoutes.post("/login", validateLogin, login);
userRoutes.get("/check", routes, checkAuth);
userRoutes.put("/update-profile", routes, UpdateProfile);

export default userRoutes;