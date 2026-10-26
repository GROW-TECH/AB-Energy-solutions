import { Router } from 'express';
import { createProject, updateProject, confirmSiteReadiness } from '../controllers/projects.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const projectsRouter = Router();

// Project creation restricted to Project Manager and Super Admin
projectsRouter.post('/', authenticateToken, requireRole(['Project Manager', 'Super Admin']), createProject);

// Project updates (stage milestones, installation checklists) restricted to Project Manager, Installation Team, and Super Admin
projectsRouter.put('/:id', authenticateToken, requireRole(['Project Manager', 'Installation Team', 'Super Admin']), updateProject);

// Step 6: PM Site Readiness Confirmation before installation starts
projectsRouter.post('/:id/confirm-readiness', authenticateToken, requireRole(['Project Manager', 'Super Admin']), confirmSiteReadiness);
