import { Request, Response } from 'express';
import { pool } from '../db.js';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const inv = req.body;
    const invId = inv.id || `INV-${Date.now()}`;
    const issueDate = inv.issueDate || new Date().toISOString().split('T')[0];
    const dueDate = inv.dueDate || issueDate;
    const items = JSON.stringify(inv.items || []);

    await pool.query(
      `INSERT INTO invoices (id, invoice_number, project_id, customer_id, customer_name, customer_phone, customer_gstin, issue_date, due_date, items, subtotal, cgst, sgst, igst, total_amount, paid_amount, balance_due, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invId, inv.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`, inv.projectId || null, inv.customerId || null,
        inv.customerName || 'Customer', inv.customerPhone || '', inv.customerGstin || null,
        issueDate, dueDate, items, inv.subtotal || 0, inv.cgst || 0, inv.sgst || 0, inv.igst || 0,
        inv.totalAmount || inv.amount || 0, inv.paidAmount || 0, inv.balanceDue || inv.totalAmount || 0, inv.status || 'Draft'
      ]
    );
    res.status(201).json({ success: true, invoice: { ...inv, id: invId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.paidAmount !== undefined) { fields.push('paid_amount = ?'); values.push(updates.paidAmount); }
    if (updates.balanceDue !== undefined) { fields.push('balance_due = ?'); values.push(updates.balanceDue); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const pay = req.body;
    const payId = pay.id || `PAY-${Date.now()}`;
    const paymentDate = pay.paymentDate || new Date().toISOString().split('T')[0];
    const transRef = pay.transactionReference || pay.transactionRef || `TXN-${Date.now().toString().slice(-6)}`;
    const recordedBy = pay.recordedBy || (req as any).user?.name || 'Accounts Team';

    await pool.query(
      `INSERT INTO payments (id, payment_number, invoice_id, project_id, customer_id, customer_name, amount, payment_date, payment_mode, transaction_reference, bank_name, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payId, pay.paymentNumber || `PAY-${Date.now().toString().slice(-6)}`, pay.invoiceId || null, pay.projectId || null,
        pay.customerId || null, pay.customerName || 'Customer', pay.amount || 0,
        paymentDate, pay.paymentMode || 'NEFT', transRef, pay.bankName || null, pay.status || 'Success', recordedBy
      ]
    );
    res.status(201).json({ success: true, payment: { ...pay, id: payId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
