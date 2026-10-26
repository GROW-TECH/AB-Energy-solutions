import { Router } from 'express';
import { 
  getSurveys, 
  getSurveyById, 
  createSurvey, 
  updateSurvey, 
  uploadSurveyPhoto, 
  deleteSurveyPhoto, 
  submitSurveyForReview, 
  reviewSurvey, 
  rescheduleSurvey 
} from '../controllers/surveys.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const surveysRouter = Router();

// 1. List surveys (Isolated per customer role if customer, otherwise all)
surveysRouter.get('/', authenticateToken, getSurveys);

// 2. Get survey by ID with all photos and review history
surveysRouter.get('/:id', authenticateToken, getSurveyById);

// 3. Create survey (Sales, Survey Engineer, Project Manager, Super Admin)
surveysRouter.post('/', authenticateToken, requireRole(['Survey Engineer', 'Sales Executive', 'Sales Manager', 'Project Manager', 'Super Admin']), createSurvey);

// 4. Update survey / Save Draft (Survey Engineer, Project Manager, Super Admin)
surveysRouter.put('/:id', authenticateToken, requireRole(['Survey Engineer', 'Project Manager', 'Super Admin']), updateSurvey);
surveysRouter.put('/:id/draft', authenticateToken, requireRole(['Survey Engineer', 'Project Manager', 'Super Admin']), updateSurvey);

// 5. Upload photo for a specific survey
surveysRouter.post('/:id/photos', authenticateToken, requireRole(['Survey Engineer', 'Project Manager', 'Super Admin']), uploadSurveyPhoto);

// 6. Delete photo for a specific survey
surveysRouter.delete('/:id/photos/:photoId', authenticateToken, requireRole(['Survey Engineer', 'Project Manager', 'Super Admin']), deleteSurveyPhoto);

// 7. Submit survey for review (Survey Engineer, Super Admin)
surveysRouter.post('/:id/submit', authenticateToken, requireRole(['Survey Engineer', 'Super Admin']), submitSurveyForReview);

// 8. Review survey (Approve or Request Changes - Project Manager, Sales Manager, Super Admin)
surveysRouter.post('/:id/review', authenticateToken, requireRole(['Project Manager', 'Sales Manager', 'Super Admin']), reviewSurvey);

// 9. Reschedule survey visit
surveysRouter.post('/:id/reschedule', authenticateToken, requireRole(['Survey Engineer', 'Project Manager', 'Sales Manager', 'Super Admin']), rescheduleSurvey);
