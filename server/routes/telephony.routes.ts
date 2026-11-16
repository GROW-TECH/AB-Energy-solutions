import { Router } from 'express';
import {
  syncCallLog,
  getCallLogs,
  resolveMissedCall,
  updateCallDisposition,
  deleteCallLog,
  clearAllCallLogs
} from '../controllers/telephony.controller.js';
import { authenticateToken } from '../middleware/auth.js';

export const telephonyRouter = Router();

// Public / Token-authenticated call sync from Android devices & phone webhooks
telephonyRouter.post('/sync-call', syncCallLog);

// Authenticated CRM retrieval (RBAC handled inside controller)
telephonyRouter.get('/calls', authenticateToken, getCallLogs);

// Clear all call logs (Admin / reset) - supports both DELETE and POST for cPanel/Apache compatibility
telephonyRouter.delete('/clear-all', authenticateToken, clearAllCallLogs);
telephonyRouter.post('/clear-all', authenticateToken, clearAllCallLogs);

// Resolve missed call
telephonyRouter.post('/resolve-missed/:id', authenticateToken, resolveMissedCall);

// Update disposition / notes
telephonyRouter.patch('/calls/:id/disposition', authenticateToken, updateCallDisposition);

// Delete call log - supports both DELETE and POST for cPanel/Apache compatibility
telephonyRouter.delete('/calls/:id', authenticateToken, deleteCallLog);
telephonyRouter.post('/calls/:id/delete', authenticateToken, deleteCallLog);
