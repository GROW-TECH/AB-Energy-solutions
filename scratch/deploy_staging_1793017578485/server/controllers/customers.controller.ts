import { Request, Response } from 'express';
import { pool } from '../db.js';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const c = req.body;
    await pool.query(
      `INSERT INTO customers (id, name, email, phone, alternate_phone, address, city, state, pincode, consumer_number_discom, discom_name, gstin, converted_from_lead_id, total_system_kw, total_order_value, paid_amount, balance_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id, c.name, c.email || '', c.phone, c.alternatePhone || null, c.address, c.city || 'Bengaluru',
        c.state || 'Karnataka', c.pincode || '560001', c.consumerNumberDiscom || null, c.discomName || 'BESCOM',
        c.gstin || null, c.convertedFromLeadId || null, c.totalSystemKw || 0, c.totalOrderValue || 0,
        c.paidAmount || 0, c.balanceAmount || 0, c.status || 'Active', c.createdAt || new Date().toISOString()
      ]
    );
    res.json({ success: true, customer: c });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

import { hashPassword } from '../utils/security.js';

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.paidAmount !== undefined) { fields.push('paid_amount = ?'); values.push(updates.paidAmount); }
    if (updates.balanceAmount !== undefined) { fields.push('balance_amount = ?'); values.push(updates.balanceAmount); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.address !== undefined) { fields.push('address = ?'); values.push(updates.address); }
    if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
    if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createOrUpdateCustomerPortalAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Please provide both username and password.' });
    }

    // Verify customer exists
    const [custRows]: any = await pool.query('SELECT id, name, email, phone FROM customers WHERE id = ?', [id]);
    if (!custRows || custRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }
    const customer = custRows[0];
    const cleanUsername = username.trim().toLowerCase();

    // Check if username taken by another account
    const [existingUsers]: any = await pool.query(
      'SELECT id, customer_id FROM user_accounts WHERE username = ? LIMIT 1',
      [cleanUsername]
    );
    if (existingUsers && existingUsers.length > 0 && existingUsers[0].customer_id !== id) {
      return res.status(400).json({ success: false, error: `Username "${cleanUsername}" is already in use.` });
    }

    const { hash, salt } = hashPassword(password);

    // Check if account already exists for this customer
    const [userByCust]: any = await pool.query(
      'SELECT id FROM user_accounts WHERE customer_id = ? AND role = "Customer" LIMIT 1',
      [id]
    );

    let userId: string;
    if (userByCust && userByCust.length > 0) {
      userId = userByCust[0].id;
      await pool.query(
        `UPDATE user_accounts 
         SET username = ?, password_hash = ?, password_salt = ?, is_active = TRUE, name = ?, email = ?
         WHERE id = ?`,
        [cleanUsername, hash, salt, customer.name, customer.email || `${cleanUsername}@customer.abenergy.in`, userId]
      );
    } else {
      userId = `USR-CUST-${Date.now().toString().slice(-6)}`;
      await pool.query(
        `INSERT INTO user_accounts (id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active)
         VALUES (?, ?, ?, ?, ?, 'Customer', NULL, ?, ?, TRUE)`,
        [userId, cleanUsername, customer.email || `${cleanUsername}@customer.abenergy.in`, hash, salt, id, customer.name]
      );
    }

    res.json({
      success: true,
      message: 'Customer portal access configured successfully.',
      portalAccount: {
        customerId: id,
        username: cleanUsername,
        customerName: customer.name,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getCustomerPortalAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query(
      'SELECT username, is_active, created_at FROM user_accounts WHERE customer_id = ? AND role = "Customer" LIMIT 1',
      [id]
    );

    if (rows && rows.length > 0) {
      res.json({
        success: true,
        hasAccount: true,
        username: rows[0].username,
        isActive: Boolean(rows[0].is_active),
        createdAt: rows[0].created_at,
      });
    } else {
      res.json({
        success: true,
        hasAccount: false,
        username: null,
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

