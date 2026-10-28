import { Router } from 'express';
import { 
  getPurchaseOrders, 
  createPurchaseOrder, 
  createGoodsReceiptNote, 
  getPendingIndents,
  convertToEpcProject,
  getGoodsReceiptNotes,
  getPublicSigningGrn,
  submitPublicCustomerSignature,
  resendSigningLink,
  revokeSigningLink,
  deletePurchaseOrder,
  deleteIndent,
  clearClosedIndents
} from '../controllers/procurement.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// ==========================================
// PUBLIC CUSTOMER E-SIGNING PORTAL ROUTES
// No CRM account or auth token required!
// ==========================================
router.get('/sign-grn/:token', getPublicSigningGrn);
router.post('/sign-grn/:token', submitPublicCustomerSignature);

// ==========================================
// AUTHENTICATED PROCUREMENT ROUTES
// ==========================================
router.get('/orders', authenticateToken, getPurchaseOrders);
router.post('/orders', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), createPurchaseOrder);
router.delete('/orders/:id', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin', 'Sales Manager']), deletePurchaseOrder);

// GRN Generation & Management
router.get('/grns', authenticateToken, getGoodsReceiptNotes);
router.post('/grn', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), createGoodsReceiptNote);
router.post('/grn/:id/resend-link', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), resendSigningLink);
router.post('/grn/:id/revoke-link', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), revokeSigningLink);

router.get('/pending-indents', authenticateToken, getPendingIndents);
router.get('/indents', authenticateToken, getPendingIndents);
router.delete('/indents-closed/all', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin', 'Sales Manager']), clearClosedIndents);
router.delete('/indents/:id', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin', 'Sales Manager']), deleteIndent);

// Convert to EPC Project: Allowed only when material receipt & customer signature are completed!
router.post('/convert-to-project', authenticateToken, requireRole(['Purchase Team', 'Project Manager', 'Super Admin']), convertToEpcProject);

export default router;
