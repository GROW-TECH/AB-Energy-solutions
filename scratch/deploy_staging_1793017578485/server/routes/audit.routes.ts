import { Router } from 'express';
import { getAuditLogs, createAuditLog } from '../controllers/audit.controller.js';
import { authenticateToken } from '../middleware/auth.js';

export const auditRouter = Router();

// Retrieve audit logs with server-side pagination, search, and category filters
auditRouter.get('/', authenticateToken, getAuditLogs);

// Record a new audit log
auditRouter.post('/', authenticateToken, createAuditLog);
