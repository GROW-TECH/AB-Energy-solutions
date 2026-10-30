import { Request, Response } from 'express';
import { pool } from '../db.js';

// Helper: Normalize phone numbers (strip spaces, symbols, and take last 10 digits for matching)
function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Sync call log from Android device or external telephony webhook
 * POST /api/telephony/sync-call
 */
export const syncCallLog = async (req: Request, res: Response) => {
  try {
    const {
      employee_id,
      employee_phone,
      customer_phone,
      customer_name,
      call_type,
      call_status,
      duration_seconds,
      call_time,
      sim_slot,
      notes,
      disposition
    } = req.body;

    if (!customer_phone || !call_type) {
      return res.status(400).json({
        success: false,
        message: 'customer_phone and call_type (INCOMING, OUTGOING, MISSED, REJECTED) are required.'
      });
    }

    const normCustomerPhone = normalizePhone(customer_phone);
    const normEmployeePhone = normalizePhone(employee_phone || '');

    // 1. Identify Employee by phone or employee_id
    let resolvedEmpId = employee_id || null;
    let resolvedEmpName = null;
    let resolvedEmpPhone = employee_phone || null;

    if (normEmployeePhone) {
      const [empRows]: any = await pool.query(
        `SELECT id, name, phone FROM employees WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ? LIMIT 1`,
        [`%${normEmployeePhone}`]
      );
      if (empRows && empRows.length > 0) {
        resolvedEmpId = empRows[0].id;
        resolvedEmpName = empRows[0].name;
        resolvedEmpPhone = empRows[0].phone;
      }
    } else if (resolvedEmpId) {
      const [empRows]: any = await pool.query(
        `SELECT id, name, phone FROM employees WHERE id = ? LIMIT 1`,
        [resolvedEmpId]
      );
      if (empRows && empRows.length > 0) {
        resolvedEmpName = empRows[0].name;
        resolvedEmpPhone = empRows[0].phone;
      }
    }

    // Fallback if not matched in employees
    if (!resolvedEmpName && (req as any).user) {
      resolvedEmpId = (req as any).user.id || resolvedEmpId;
      resolvedEmpName = (req as any).user.name || (req as any).user.username;
    }

    // 2. Identify Customer / Lead by customer_phone
    let resolvedLeadId = null;
    let resolvedCustName = customer_name || null;

    if (normCustomerPhone) {
      // Check in leads table
      const [leadRows]: any = await pool.query(
        `SELECT id, name FROM leads WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ? LIMIT 1`,
        [`%${normCustomerPhone}`]
      );
      if (leadRows && leadRows.length > 0) {
        resolvedLeadId = leadRows[0].id;
        resolvedCustName = leadRows[0].name;
      } else {
        // Check in customers table
        const [custRows]: any = await pool.query(
          `SELECT id, name FROM customers WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ? LIMIT 1`,
          [`%${normCustomerPhone}`]
        );
        if (custRows && custRows.length > 0) {
          resolvedCustName = custRows[0].name;
        }
      }
    }

    // 3. Format Call Date/Time
    const formattedCallTime = call_time ? new Date(call_time) : new Date();
    const callId = `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const isMissed = call_type === 'MISSED' || call_status === 'MISSED';
    const isResolved = !isMissed; // missed calls start as unresolved

    // 4. Insert or update call log
    await pool.query(
      `INSERT INTO call_logs (
        id, employee_id, employee_name, employee_phone,
        customer_phone, customer_name, lead_id,
        call_type, call_status, duration_seconds,
        call_time, sim_slot, disposition, notes, is_resolved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        duration_seconds = VALUES(duration_seconds),
        call_status = VALUES(call_status),
        disposition = COALESCE(VALUES(disposition), disposition),
        notes = COALESCE(VALUES(notes), notes)`,
      [
        callId,
        resolvedEmpId,
        resolvedEmpName || 'Sales Staff',
        resolvedEmpPhone || employee_phone || 'Device SIM',
        customer_phone,
        resolvedCustName || 'Unknown Caller',
        resolvedLeadId,
        call_type,
        call_status || (isMissed ? 'MISSED' : 'ANSWERED'),
        Number(duration_seconds) || 0,
        formattedCallTime,
        Number(sim_slot) || 1,
        disposition || null,
        notes || null,
        isResolved
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Call log synced successfully',
      call_id: callId,
      matched_lead: resolvedLeadId ? { id: resolvedLeadId, name: resolvedCustName } : null,
      is_missed: isMissed
    });
  } catch (error: any) {
    console.error('Error syncing call log:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync call log',
      error: error.message
    });
  }
};

/**
 * Fetch Call Logs with Role-Based Access Control (RBAC)
 * GET /api/telephony/calls
 */
export const getCallLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      type,
      status,
      unresolved_only,
      employee_id,
      search,
      start_date,
      end_date,
      page,
      limit = 15,
      offset
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 15));
    const offsetNum = offset !== undefined ? Number(offset) : (pageNum - 1) * limitNum;

    const userRole = (user?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
    const isManager = Boolean(
      !user ||
      userRole === 'admin' ||
      userRole === 'salesmanager' ||
      userRole === 'superadmin' ||
      userRole === 'management' ||
      userRole === 'managingdirector' ||
      userRole === 'ceo' ||
      userRole === 'manager' ||
      user.role === 'Sales Manager' ||
      user.role === 'Super Admin'
    );

    const baseConditions: string[] = ['1=1'];
    const baseParams: any[] = [];

    // RBAC: If executive, strictly isolate to their own employee ID, their name, or their registered phone
    if (!isManager && user) {
      const rawEmpId = user.employeeId || user.id || user.userId;
      let matchedEmpId = user.employeeId || null;
      let matchedEmpPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
      let matchedEmpName = user.name || '';

      // Look up current employee phone and name from database
      if (rawEmpId || user.email || user.username) {
        const [empRows]: any = await pool.query(
          `SELECT id, name, phone FROM employees WHERE id = ? OR username = ? OR email = ? LIMIT 1`,
          [rawEmpId, user.username || '', user.email || '']
        );
        if (empRows && empRows.length > 0) {
          matchedEmpId = empRows[0].id;
          matchedEmpName = empRows[0].name;
          const digits = (empRows[0].phone || '').replace(/\D/g, '').slice(-10);
          if (digits) matchedEmpPhone = digits;
        }
      }

      const orParts: string[] = [];
      const orParams: any[] = [];

      if (matchedEmpId) {
        orParts.push('employee_id = ?');
        orParams.push(matchedEmpId);
      }
      if (rawEmpId && rawEmpId !== matchedEmpId) {
        orParts.push('employee_id = ?');
        orParams.push(rawEmpId);
      }
      if (matchedEmpPhone) {
        orParts.push('(employee_phone IS NOT NULL AND employee_phone LIKE ?)');
        orParams.push(`%${matchedEmpPhone}%`);
      }
      if (matchedEmpName) {
        orParts.push('employee_name = ?');
        orParams.push(matchedEmpName);
      }

      if (orParts.length > 0) {
        baseConditions.push(`(${orParts.join(' OR ')})`);
        baseParams.push(...orParams);
      } else {
        baseConditions.push('employee_id = ?');
        baseParams.push(rawEmpId);
      }
    } else if (employee_id) {
      // Manager can filter by specific employee
      baseConditions.push('employee_id = ?');
      baseParams.push(employee_id);
    }

    const queryConditions: string[] = [...baseConditions];
    const queryParams: any[] = [...baseParams];

    if (type) {
      queryConditions.push('call_type = ?');
      queryParams.push(type);
    }

    if (status) {
      queryConditions.push('call_status = ?');
      queryParams.push(status);
    }

    if (unresolved_only === 'true') {
      queryConditions.push('call_type = "MISSED" AND is_resolved = FALSE');
    }

    if (search) {
      queryConditions.push('(customer_phone LIKE ? OR customer_name LIKE ? OR employee_name LIKE ? OR notes LIKE ?)');
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (start_date) {
      queryConditions.push('call_time >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      queryConditions.push('call_time <= ?');
      queryParams.push(end_date);
    }

    const whereClause = queryConditions.join(' AND ');

    // 1. Fetch Total Count for Pagination
    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM call_logs WHERE ${whereClause}`,
      queryParams
    );
    const totalCalls = countRows && countRows.length > 0 ? Number(countRows[0].total) : 0;

    // 2. Fetch Call Records for Current Page
    const [calls]: any = await pool.query(
      `SELECT * FROM call_logs 
       WHERE ${whereClause} 
       ORDER BY call_time DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offsetNum]
    );

    // 2. Fetch Aggregated Performance Metrics for Today (unaffected by tab filter so top stats stay consistent)
    const baseWhereClause = baseConditions.join(' AND ');
    const [summaryRows]: any = await pool.query(
      `SELECT 
         COUNT(*) as total_calls_today,
         COALESCE(SUM(CASE WHEN call_type = 'OUTGOING' THEN 1 ELSE 0 END), 0) as outgoing_count,
         COALESCE(SUM(CASE WHEN call_type = 'INCOMING' AND call_status = 'ANSWERED' THEN 1 ELSE 0 END), 0) as incoming_count,
         COALESCE(SUM(CASE WHEN call_type = 'MISSED' THEN 1 ELSE 0 END), 0) as missed_count,
         COALESCE(SUM(CASE WHEN call_type = 'MISSED' AND is_resolved = FALSE THEN 1 ELSE 0 END), 0) as unresolved_missed_count,
         COALESCE(SUM(duration_seconds), 0) as total_talk_time_seconds
       FROM call_logs 
       WHERE ${baseWhereClause} AND (DATE(call_time) = CURDATE() OR call_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR))`,
      baseParams
    );

    // 3. If Manager, fetch team performance breakdown
    let teamBreakdown = [];
    if (isManager) {
      const [teamRows]: any = await pool.query(
        `SELECT 
           COALESCE(employee_id, 'UNKNOWN') as employee_id,
           COALESCE(employee_name, 'Unassigned') as employee_name,
           COUNT(*) as total_calls,
           COALESCE(SUM(CASE WHEN call_type = 'OUTGOING' THEN 1 ELSE 0 END), 0) as outgoing_calls,
           COALESCE(SUM(CASE WHEN call_type = 'MISSED' AND is_resolved = FALSE THEN 1 ELSE 0 END), 0) as pending_missed,
           COALESCE(SUM(duration_seconds), 0) as talk_time_seconds
         FROM call_logs
         WHERE (DATE(call_time) = CURDATE() OR call_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR))
         GROUP BY employee_id, employee_name
         ORDER BY total_calls DESC`
      );
      teamBreakdown = teamRows;
    }

    return res.json({
      success: true,
      calls,
      pagination: {
        total: totalCalls,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(totalCalls / limitNum) || 1
      },
      metrics: summaryRows[0] || {
        total_calls_today: 0,
        outgoing_count: 0,
        incoming_count: 0,
        missed_count: 0,
        unresolved_missed_count: 0,
        total_talk_time_seconds: 0
      },
      team_breakdown: teamBreakdown,
      is_manager_view: isManager
    });
  } catch (error: any) {
    console.error('Error fetching call logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch call logs',
      error: error.message
    });
  }
};

/**
 * Mark a missed call as resolved (e.g. after calling back)
 * POST /api/telephony/resolve-missed/:id
 */
export const resolveMissedCall = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = (req as any).user;

    const resolvedBy = user ? user.name || user.username : 'Sales Staff';

    const [result]: any = await pool.query(
      `UPDATE call_logs 
       SET is_resolved = TRUE, 
           resolved_at = NOW(), 
           resolved_by = ?, 
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [resolvedBy, notes || 'Callback completed by sales staff', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Call record not found' });
    }

    return res.json({
      success: true,
      message: 'Missed call marked as resolved'
    });
  } catch (error: any) {
    console.error('Error resolving missed call:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve missed call',
      error: error.message
    });
  }
};

/**
 * Update call disposition & notes
 * PATCH /api/telephony/calls/:id/disposition
 */
export const updateCallDisposition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { disposition, notes } = req.body;

    const [result]: any = await pool.query(
      `UPDATE call_logs 
       SET disposition = ?, notes = ?
       WHERE id = ?`,
      [disposition, notes, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Call record not found' });
    }

    return res.json({
      success: true,
      message: 'Call disposition updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating call disposition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update call disposition',
      error: error.message
    });
  }
};

/**
 * Delete a Call Log entry
 * DELETE /api/telephony/calls/:id
 */
export const deleteCallLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.query(
      `DELETE FROM call_logs WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Call record not found' });
    }

    return res.json({
      success: true,
      message: 'Call record deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting call log:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete call log',
      error: error.message
    });
  }
};

