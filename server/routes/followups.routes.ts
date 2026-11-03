import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { pool } from '../db.js';

export const followupsRouter = Router();

// GET /api/follow-ups - Fetch all follow-ups with lead context
followupsRouter.get('/', authenticateToken, async (_req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        id, lead_id, lead_name, customer_id, customer_name,
        quotation_id, title, due_date, due_time, type,
        status, priority, assigned_to_id, assigned_to_name,
        notes, completed_at, is_struck_out, outcome, created_at
      FROM follow_ups 
      ORDER BY due_date DESC, id DESC
    `);

    const formatted = rows.map((f: any) => ({
      id: f.id,
      leadId: f.lead_id,
      leadName: f.lead_name,
      customerId: f.customer_id,
      customerName: f.customer_name,
      quotationId: f.quotation_id,
      title: f.title,
      dueDate: f.due_date,
      dueTime: f.due_time,
      type: f.type,
      status: f.status,
      priority: f.priority,
      assignedToId: f.assigned_to_id,
      assignedToName: f.assigned_to_name,
      notes: f.notes || '',
      completedAt: f.completed_at,
      isStruckOut: Boolean(f.is_struck_out),
      outcome: f.outcome || '',
      createdAt: f.created_at || '',
    }));

    res.json({ success: true, followUps: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/follow-ups - Create a new follow-up
followupsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      leadId,
      leadName,
      customerId,
      customerName,
      title,
      dueDate,
      dueTime,
      type,
      status,
      priority,
      assignedToId,
      assignedToName,
      notes,
      outcome
    } = req.body;

    const id = `FUP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const today = new Date().toISOString().split('T')[0];
    const actualDueDate = dueDate || today;
    const actualStatus = status || 'Pending';
    const isStruckOut = actualStatus === 'Completed';

    await pool.query(`
      INSERT INTO follow_ups (
        id, lead_id, lead_name, customer_id, customer_name,
        title, due_date, due_time, type, status, priority,
        assigned_to_id, assigned_to_name, notes, is_struck_out,
        outcome, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      leadId || null,
      leadName || null,
      customerId || null,
      customerName || null,
      title || 'Follow-up Call',
      actualDueDate,
      dueTime || '11:00 AM',
      type || 'Call',
      actualStatus,
      priority || 'Medium',
      assignedToId || req.user?.employeeId || 'EMP-001',
      assignedToName || req.user?.name || 'Sales Executive',
      notes || '',
      isStruckOut ? 1 : 0,
      outcome || null,
      today
    ]);

    // If linked to a lead, update lead's last_contacted_at and latest note
    if (leadId) {
      await pool.query(`
        UPDATE leads SET
          last_contacted_at = ?,
          notes = COALESCE(NULLIF(?, ''), notes)
        WHERE id = ?
      `, [today, notes || null, leadId]);
    }

    res.status(201).json({
      success: true,
      followUp: {
        id,
        leadId,
        leadName,
        customerId,
        customerName,
        title: title || 'Follow-up Call',
        dueDate: actualDueDate,
        dueTime: dueTime || '11:00 AM',
        type: type || 'Call',
        status: actualStatus,
        priority: priority || 'Medium',
        assignedToId: assignedToId || req.user?.employeeId || 'EMP-001',
        assignedToName: assignedToName || req.user?.name || 'Sales Executive',
        notes: notes || '',
        isStruckOut,
        outcome: outcome || '',
        createdAt: today
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/follow-ups/:id - Update an existing follow-up
followupsRouter.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dueDate, dueTime, type, status, priority, notes, isStruckOut, outcome } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (dueDate !== undefined) { updates.push('due_date = ?'); values.push(dueDate); }
    if (dueTime !== undefined) { updates.push('due_time = ?'); values.push(dueTime); }
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (isStruckOut !== undefined) {
      updates.push('is_struck_out = ?');
      values.push(isStruckOut ? 1 : 0);
      if (isStruckOut && status === undefined) {
        updates.push("status = 'Completed'");
        updates.push('completed_at = ?');
        values.push(new Date().toISOString().split('T')[0]);
      } else if (!isStruckOut && status === undefined) {
        updates.push("status = 'Pending'");
      }
    }
    if (outcome !== undefined) { updates.push('outcome = ?'); values.push(outcome); }

    if (updates.length === 0) {
      res.json({ success: true, message: 'No updates provided' });
      return;
    }

    values.push(id);
    await pool.query(`UPDATE follow_ups SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Follow-up updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/follow-ups/:id/toggle-strike - Toggle strike-out state
followupsRouter.put('/:id/toggle-strike', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT is_struck_out FROM follow_ups WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Follow-up not found' });
      return;
    }

    const currentStruck = Boolean(rows[0].is_struck_out);
    const nextStruck = !currentStruck;
    const nextStatus = nextStruck ? 'Completed' : 'Pending';
    const completedAt = nextStruck ? new Date().toISOString().split('T')[0] : null;

    await pool.query(
      'UPDATE follow_ups SET is_struck_out = ?, status = ?, completed_at = ? WHERE id = ?',
      [nextStruck ? 1 : 0, nextStatus, completedAt, id]
    );

    res.json({ success: true, isStruckOut: nextStruck, status: nextStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/follow-ups/:id - Delete a follow-up
followupsRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM follow_ups WHERE id = ?', [id]);
    res.json({ success: true, message: 'Follow-up deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

