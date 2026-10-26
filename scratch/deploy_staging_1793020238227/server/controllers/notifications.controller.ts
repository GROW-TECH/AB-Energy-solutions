import { Request, Response } from 'express';
import { pool } from '../db.js';

export async function createNotification(params: {
  recipientRole?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'urgent';
  link?: string;
}): Promise<void> {
  try {
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const role = params.recipientRole || 'All';
    await pool.query(
      `INSERT INTO notifications (id, recipient_role, target_role, title, message, type, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        id,
        role,
        role,
        params.title,
        params.message,
        params.type || 'info',
        params.link || null,
      ]
    );
  } catch (err: any) {
    console.error('Error creating notification:', err.message);
  }
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userRole = (req as any).user?.role || 'All';
    const [rows]: any = await pool.query(
      `SELECT * FROM notifications 
       WHERE (recipient_role IN ('All', ?) OR target_role IN ('All', ?)) 
       ORDER BY created_at DESC LIMIT 60`,
      [userRole, userRole]
    );
    res.json({ success: true, notifications: rows });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
