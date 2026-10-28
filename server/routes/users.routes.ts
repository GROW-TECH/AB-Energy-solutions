import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getUsers, createUser, updateUser, toggleUserStatus, importUsers } from '../controllers/users.controller.js';

export const usersRouter = Router();

usersRouter.use(authenticateToken);

usersRouter.get('/', getUsers);
usersRouter.post('/', createUser);
usersRouter.post('/import', importUsers);
usersRouter.put('/:id', updateUser);
usersRouter.post('/:id/toggle-status', toggleUserStatus);
