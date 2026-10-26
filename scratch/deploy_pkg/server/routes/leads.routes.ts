import { Router } from 'express';
import { createLead, updateLead, deleteLead, recommendLeadPriority } from '../controllers/leads.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { pool } from '../db.js';

export const leadsRouter = Router();

// Only Sales roles and Super Admin can view the CRM sales leads
leadsRouter.get('/', authenticateToken, requireRole(['Sales Executive', 'Sales Manager']), async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json({ success: true, leads: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Backend-driven lead priority recommendation evaluation
leadsRouter.post('/recommend-priority', authenticateToken, requireRole(['Sales Executive', 'Sales Manager']), recommendLeadPriority);

// Sales Executive & Sales Manager can create leads
leadsRouter.post('/', authenticateToken, requireRole(['Sales Executive', 'Sales Manager']), createLead);

// Sales, Survey Engineer, and Project Manager can update leads (e.g. stage progression, survey linkage)
leadsRouter.put('/:id', authenticateToken, requireRole(['Sales Executive', 'Sales Manager', 'Survey Engineer', 'Project Manager']), updateLead);

// Lead deletion is strictly restricted to Sales Manager and Super Admin
leadsRouter.delete('/:id', authenticateToken, requireRole(['Sales Manager']), deleteLead);
