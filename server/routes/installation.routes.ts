import { Router } from 'express';
import { 
  recordAttendance, 
  getProjectAttendance, 
  logProgress, 
  getProjectCommandCentre,
  scheduleInstallation 
} from '../controllers/installation.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Installation Scheduling & Crew Assignment (Step 4 of EPC Lifecycle)
router.post('/schedule', authenticateToken, scheduleInstallation);

// Field team attendance
router.post('/attendance', authenticateToken, recordAttendance);
router.get('/attendance/:projectId', authenticateToken, getProjectAttendance);

// Field milestone logging
router.post('/progress', authenticateToken, logProgress);

// Project Manager Master Consolidated Command Centre
router.get('/command-centre/:projectId', authenticateToken, getProjectCommandCentre);

export default router;
