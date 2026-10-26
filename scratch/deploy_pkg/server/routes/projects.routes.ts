import { Router } from 'express';
import { createProject, updateProject } from '../controllers/projects.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const projectsRouter = Router();

// Project creation restricted to Project Manager and Super Admin
projectsRouter.post('/', authenticateToken, requireRole(['Project Manager']), createProject);

// Project updates (stage milestones, installation checklists) restricted to Project Manager, Installation Team, and Super Admin
projectsRouter.put('/:id', authenticateToken, requireRole(['Project Manager', 'Installation Team']), updateProject);
