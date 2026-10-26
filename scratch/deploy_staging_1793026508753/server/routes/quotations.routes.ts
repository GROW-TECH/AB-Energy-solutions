import { Router } from 'express';
import {
  calculateQuotationPreview,
  getQuotations,
  getQuotationById,
  createQuotation,
  createQuotationRevision,
  approveQuotationDiscount,
  updateQuotation,
  editQuotation,
  recordCustomerAcceptance,
  acceptQuotation,
  downloadProposalPdf
} from '../controllers/quotations.controller.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';

export const quotationsRouter = Router();

// 1. Preview / Authoritative Calculation Endpoint (Stateless)
quotationsRouter.post(
  '/calculate',
  authenticateToken,
  requireRole(['Sales Executive', 'Sales Manager', 'Survey Engineer', 'Project Manager', 'Super Admin']),
  calculateQuotationPreview
);

// 2. Quotation List (Scoped for Customer vs Internal Roles)
quotationsRouter.get('/', authenticateToken, getQuotations);

// 3. Get Single Quotation
quotationsRouter.get('/:id', authenticateToken, getQuotationById);

// 4. Create New Quotation (V1)
quotationsRouter.post(
  '/',
  authenticateToken,
  requireRole(['Sales Executive', 'Sales Manager', 'Project Manager', 'Super Admin']),
  createQuotation
);

// 5. Create Quotation Revision (V2, V3, ...)
quotationsRouter.post(
  '/:id/revisions',
  authenticateToken,
  requireRole(['Sales Executive', 'Sales Manager', 'Super Admin']),
  createQuotationRevision
);

// 6. Approve Commercial Discount (Manager / Super Admin Only)
quotationsRouter.put(
  '/:id/approve',
  authenticateToken,
  requireRole(['Sales Manager', 'Super Admin']),
  approveQuotationDiscount
);

// 7. Edit Quotation & Custom BOM Line Items (Real-Time Calculation & PDF Sync)
quotationsRouter.put(
  '/:id/edit',
  authenticateToken,
  requireRole(['Sales Executive', 'Sales Manager', 'Super Admin']),
  editQuotation
);

// 8. Record Customer Acceptance (Stage-Gate: Unlocks PM Handover)
quotationsRouter.put(
  '/:id/customer-accept',
  authenticateToken,
  requireRole(['Sales Executive', 'Sales Manager', 'Super Admin', 'Customer']),
  recordCustomerAcceptance
);

// 9. Update Quotation Metadata / Status
quotationsRouter.put(
  '/:id',
  authenticateToken,
  requireRole(['Sales Executive', 'Sales Manager', 'Survey Engineer', 'Project Manager', 'Super Admin']),
  updateQuotation
);

// 10. Authorized EPC Project Conversion (Strictly Project Manager & Super Admin)
quotationsRouter.post(
  '/:id/accept',
  authenticateToken,
  requireRole(['Project Manager', 'Super Admin']),
  acceptQuotation
);

// 11. Download Official PDF Proposal
quotationsRouter.get('/:id/pdf', optionalAuth, downloadProposalPdf);
