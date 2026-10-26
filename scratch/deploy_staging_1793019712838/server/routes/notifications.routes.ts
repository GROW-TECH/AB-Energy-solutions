import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notifications.controller.js';
import { authenticateToken } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticateToken, getNotifications);
notificationsRouter.put('/:id/read', authenticateToken, markNotificationRead);
