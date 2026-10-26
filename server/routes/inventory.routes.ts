import { Router } from 'express';
import { reserveInventory } from '../controllers/inventory.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const inventoryRouter = Router();

// Inventory reservation restricted to Project Manager, Installation Team, and Super Admin
inventoryRouter.post('/reserve', authenticateToken, requireRole(['Project Manager', 'Installation Team']), reserveInventory);
