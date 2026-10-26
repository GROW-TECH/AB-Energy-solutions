import { Router } from 'express';
import { createInvoice, updateInvoice, createPayment } from '../controllers/finance.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { pool } from '../db.js';

export const financeRouter = Router();

// Invoices: Strictly restricted to Accounts and Super Admin
financeRouter.get('/invoices', authenticateToken, requireRole(['Accounts']), async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices ORDER BY issue_date DESC');
    res.json({ success: true, invoices: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
financeRouter.post('/invoices', authenticateToken, requireRole(['Accounts']), createInvoice);
financeRouter.put('/invoices/:id', authenticateToken, requireRole(['Accounts']), updateInvoice);

// Payments: Payment recording and bank UTR verification strictly restricted to Accounts and Super Admin
financeRouter.get('/payments', authenticateToken, requireRole(['Accounts']), async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    res.json({ success: true, payments: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
financeRouter.post('/payments', authenticateToken, requireRole(['Accounts']), createPayment);
