import { Router } from 'express';
import { 
  getBom, 
  getAllBoms,
  saveBom, 
  submitBomForReview, 
  reviewBom 
} from '../controllers/bom.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const bomRouter = Router();

// 1. Get all BOMs
bomRouter.get('/all', authenticateToken, getAllBoms);

// 2. Get BOM for project or survey
bomRouter.get('/', authenticateToken, getBom);

// 2. Save or update BOM draft / items (Survey Engineer, Project Manager, Super Admin)
bomRouter.post(
  '/',
  authenticateToken,
  requireRole(['Survey Engineer', 'Project Manager', 'Super Admin']),
  saveBom
);

// 3. Submit BOM for review (Survey Engineer, Super Admin)
bomRouter.post(
  '/:id/submit',
  authenticateToken,
  requireRole(['Survey Engineer', 'Super Admin']),
  submitBomForReview
);

// 4. Review BOM - Approve or Request Changes (Project Manager, Super Admin)
bomRouter.post(
  '/:id/review',
  authenticateToken,
  requireRole(['Project Manager', 'Super Admin']),
  reviewBom
);
