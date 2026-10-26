import { Router } from 'express';
import { 
  getPurchaseOrders, 
  createPurchaseOrder, 
  createGoodsReceiptNote, 
  getPendingIndents,
  convertToEpcProject
} from '../controllers/procurement.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Purchase Team, Project Manager, and Super Admin can manage procurement
router.get('/orders', authenticateToken, getPurchaseOrders);
router.post('/orders', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), createPurchaseOrder);
router.post('/grn', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), createGoodsReceiptNote);
router.get('/pending-indents', authenticateToken, getPendingIndents);

// Convert to EPC Project: Allowed only when material receipt & customer signature are completed!
router.post('/convert-to-project', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), convertToEpcProject);

export default router;
