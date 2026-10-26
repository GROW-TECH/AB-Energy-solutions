import { Router } from 'express';
import { 
  createWarranty, 
  updateWarranty, 
  createServiceTicket, 
  updateServiceTicket 
} from '../controllers/service.controller.js';
import { authenticateToken, requireRole, requireCustomerOwnership } from '../middleware/auth.js';

export const serviceRouter = Router();

// Warranties restricted to Service Team, Project Manager, and Super Admin
serviceRouter.post('/warranties', authenticateToken, requireRole(['Service Team', 'Project Manager']), createWarranty);
serviceRouter.put('/warranties/:id', authenticateToken, requireRole(['Service Team']), updateWarranty);

// Service Tickets: Customers can create tickets for their own customerId; staff can also create
serviceRouter.post('/service-tickets', authenticateToken, requireCustomerOwnership(req => req.body.customerId), createServiceTicket);

// Service ticket resolution and dispatch restricted to Service Team and Super Admin
serviceRouter.put('/service-tickets/:id', authenticateToken, requireRole(['Service Team']), updateServiceTicket);
