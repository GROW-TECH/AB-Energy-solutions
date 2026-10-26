import { Router } from 'express';
import { 
  createCustomer, 
  updateCustomer, 
  createOrUpdateCustomerPortalAccount, 
  getCustomerPortalAccount 
} from '../controllers/customers.controller.js';
import { authenticateToken, requireRole, requireCustomerOwnership } from '../middleware/auth.js';

export const customersRouter = Router();

// Customer creation during deal-won conversion
customersRouter.post('/', authenticateToken, requireRole(['Sales Manager', 'Sales Executive', 'Project Manager', 'Accounts']), createCustomer);

// Portal account provisioning for customer
customersRouter.post('/:id/portal-account', authenticateToken, requireRole(['Sales Manager', 'Sales Executive', 'Project Manager', 'Accounts']), createOrUpdateCustomerPortalAccount);
customersRouter.get('/:id/portal-account', authenticateToken, getCustomerPortalAccount);

// Customer updates: staff can update, customer can only update their own profile
customersRouter.put('/:id', authenticateToken, requireCustomerOwnership(), updateCustomer);

