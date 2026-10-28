import { Router } from 'express';
import {
  syncCallLog,
  getCallLogs,
  resolveMissedCall,
  updateCallDisposition,
  deleteCallLog
} from '../controllers/telephony.controller.js';
import { authenticateToken } from '../middleware/auth.js';

export const telephonyRouter = Router();

// Public / Token-authenticated call sync from Android devices & phone webhooks
telephonyRouter.post('/sync-call', syncCallLog);

// Authenticated CRM retrieval (RBAC handled inside controller)
telephonyRouter.get('/calls', authenticateToken, getCallLogs);

// Resolve missed call
telephonyRouter.post('/resolve-missed/:id', authenticateToken, resolveMissedCall);

// Update disposition / notes
telephonyRouter.patch('/calls/:id/disposition', authenticateToken, updateCallDisposition);

// Delete call log
telephonyRouter.delete('/calls/:id', authenticateToken, deleteCallLog);
