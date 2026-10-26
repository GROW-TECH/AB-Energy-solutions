import { Router } from 'express';
import { 
  uploadCustomerDocument, 
  getDocumentBySurveyOrProject, 
  streamSecureDocumentFile 
} from '../controllers/documents.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const documentsRouter = Router();

// 1. Upload customer photo & identity proof (Survey Engineer, Project Manager, Super Admin)
documentsRouter.post(
  '/',
  authenticateToken,
  requireRole(['Survey Engineer', 'Project Manager', 'Super Admin']),
  uploadCustomerDocument
);

// 2. Fetch document metadata (All authenticated internal staff)
documentsRouter.get(
  '/',
  authenticateToken,
  getDocumentBySurveyOrProject
);

// 3. Securely stream sensitive identity file (Strictly Project Manager and Super Admin only)
documentsRouter.get(
  '/:id/file/:fileType',
  authenticateToken,
  requireRole(['Project Manager', 'Super Admin']),
  streamSecureDocumentFile
);
