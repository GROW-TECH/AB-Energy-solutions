import { Request, Response } from 'express';
import { pool } from '../db.js';

export const createWarranty = async (req: Request, res: Response) => {
  try {
    const w = req.body;
    await pool.query(
      `INSERT INTO warranties (id, project_id, customer_id, customer_name, equipment_type, make_model, serial_number, warranty_period_years, start_date, end_date, days_remaining, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        w.id, w.projectId, w.customerId, w.customerName,
        w.equipmentType, w.makeModel, w.serialNumber,
        w.warrantyPeriodYears || 10, w.startDate, w.endDate,
        w.daysRemaining || 9125, w.status || 'Active'
      ]
    );
    res.json({ success: true, warranty: w });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateWarranty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.daysRemaining !== undefined) { fields.push('days_remaining = ?'); values.push(updates.daysRemaining); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE warranties SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createServiceTicket = async (req: Request, res: Response) => {
  try {
    const t = req.body;
    await pool.query(
      `INSERT INTO service_tickets (id, ticket_number, customer_id, customer_name, phone, customer_address, project_id, issue_category, severity, status, technician_id, technician_name, description, created_at, scheduled_date, resolved_at, resolution_notes, customer_feedback_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.ticketNumber, t.customerId, t.customerName, t.customerPhone, t.customerAddress, t.projectId || null, t.issueCategory, t.severity, t.status, t.technicianId || null, t.technicianName || null, t.description, t.createdAt, t.scheduledDate || null, t.resolvedAt || null, t.resolutionNotes || null, t.customerFeedbackScore || 5]
    );
    res.json({ success: true, ticket: t });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateServiceTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.resolvedAt !== undefined) { fields.push('resolved_at = ?'); values.push(updates.resolvedAt); }
    if (updates.resolutionNotes !== undefined) { fields.push('resolution_notes = ?'); values.push(updates.resolutionNotes); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE service_tickets SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
