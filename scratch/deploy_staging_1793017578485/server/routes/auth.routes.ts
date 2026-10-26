import { Router } from 'express';
import { login, getMe, logout } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', authenticateToken, getMe);
authRouter.post('/logout', logout);
