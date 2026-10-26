import { Request, Response } from 'express';
import { pool } from '../db.js';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const search = ((req.query.search as string) || '').trim();
    const category = ((req.query.category as string) || 'all').trim();
    const status = ((req.query.status as string) || 'all').trim();
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(action LIKE ? OR user_name LIKE ? OR details LIKE ? OR target_entity_id LIKE ? OR ip_address LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }

    if (status && status !== 'all') {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching records
    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch page records
    const [rows]: any = await pool.query(
      `SELECT id, user_id, user_name, user_role, action, category, details, target_entity_id, target_entity_type, ip_address, status, metadata, created_at 
       FROM audit_logs 
       ${whereSql} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const logs = rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userRole: r.user_role,
      action: r.action,
      category: r.category,
      details: r.details,
      targetEntityId: r.target_entity_id,
      targetEntityType: r.target_entity_type,
      ipAddress: r.ip_address,
      status: r.status,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : null,
      createdAt: r.created_at,
    }));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs from database',
      details: err?.message,
    });
  }
};

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const { action, category, details, targetEntityId, targetEntityType, status, metadata } = req.body;
    const user = (req as any).user;

    const id = `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

    await pool.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, category, details, target_entity_id, target_entity_type, ip_address, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user?.userId || user?.id || 'SYSTEM',
        user?.name || 'System User',
        user?.role || 'Super Admin',
        action || 'SYSTEM_ACTION',
        category || 'Security',
        details || '',
        targetEntityId || null,
        targetEntityType || null,
        ipAddress,
        status || 'Success',
        metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      ]
    );

    res.status(201).json({
      success: true,
      data: { id },
    });
  } catch (err: any) {
    console.error('Error creating audit log:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record audit log',
    });
  }
};

// Helper for internal controller calls
export const recordAuditLogDirect = async (options: {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  category: string;
  details: string;
  targetEntityId?: string;
  targetEntityType?: string;
  ipAddress?: string;
  status?: string;
  metadata?: any;
}) => {
  try {
    const id = `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, category, details, target_entity_id, target_entity_type, ip_address, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        options.userId || 'SYSTEM',
        options.userName || 'System User',
        options.userRole || 'Super Admin',
        options.action,
        options.category,
        options.details,
        options.targetEntityId || null,
        options.targetEntityType || null,
        options.ipAddress || '127.0.0.1',
        options.status || 'Success',
        options.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );
  } catch (e) {
    console.warn('Non-fatal: Failed to record audit log directly:', e);
  }
};
