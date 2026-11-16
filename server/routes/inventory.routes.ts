import { Router } from 'express';
import { 
  reserveInventory,
  createProduct,
  deleteProduct,
  clearAllProducts
} from '../controllers/inventory.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const inventoryRouter = Router();

// Inventory reservation restricted to Project Manager, Installation Team, and Super Admin
inventoryRouter.post('/reserve', authenticateToken, requireRole(['Project Manager', 'Installation Team']), reserveInventory);

// Product SKU management (Procurement, Admin)
inventoryRouter.post('/products', authenticateToken, createProduct);
inventoryRouter.delete('/products/all', authenticateToken, clearAllProducts);
inventoryRouter.delete('/products/:id', authenticateToken, deleteProduct);
