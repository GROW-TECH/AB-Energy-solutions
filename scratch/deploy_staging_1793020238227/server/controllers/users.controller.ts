import { Request, Response } from 'express';
import { pool } from '../db.js';
import { hashPassword } from '../utils/security.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Role-based visibility scoping
    let query = `
      SELECT u.id, u.username, u.email, u.role, u.name, u.is_active, u.created_at,
             e.department, e.phone, e.location, e.active_leads_count, e.completed_projects_count
      FROM user_accounts u
      LEFT JOIN employees e ON (u.employee_id = e.id OR u.username = e.username)
    `;
    const params: any[] = [];

    if (currentUser.role === 'Sales Manager') {
      // Sales Manager can only view and manage Sales Executives
      query += ` WHERE u.role = 'Sales Executive'`;
    } else if (currentUser.role === 'Project Manager') {
      // Project Manager can only view and manage Installation Team
      query += ` WHERE u.role = 'Installation Team'`;
    } else if (currentUser.role !== 'Super Admin') {
      // Other staff cannot view the user management directory
      query += ` WHERE 1 = 0`;
    }

    query += ` ORDER BY u.created_at DESC`;

    const [rows]: any = await pool.query(query, params);

    const formattedUsers = rows.map((r: any) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      phone: r.phone || '',
      name: r.name,
      role: r.role,
      department: r.department || '',
      location: r.location || '',
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      activeLeadsCount: r.active_leads_count || 0,
      completedProjectsCount: r.completed_projects_count || 0,
    }));

    res.json({
      success: true,
      data: formattedUsers,
      users: formattedUsers,
    });
  } catch (error: any) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { username, password, name, email, phone, role, department, location } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, error: 'Username, password, full name, and role are required' });
    }

    // Authorization checks:
    // Sales Manager can only create Sales Executive
    if (currentUser.role === 'Sales Manager' && role !== 'Sales Executive') {
      return res.status(403).json({ success: false, error: 'Sales Managers may only create Sales Executive accounts' });
    }
    // Project Manager can only create Installation Team
    if (currentUser.role === 'Project Manager' && role !== 'Installation Team') {
      return res.status(403).json({ success: false, error: 'Project Managers may only create Installation Team accounts' });
    }
    // Only Super Admin, Sales Manager, or Project Manager can create users
    if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Sales Manager' && currentUser.role !== 'Project Manager') {
      return res.status(403).json({ success: false, error: 'Unauthorized to create user accounts' });
    }

    // Check duplicate username
    const [existing]: any = await pool.query(
      'SELECT id FROM user_accounts WHERE username = ? OR (email = ? AND email != "") LIMIT 1',
      [username.trim(), (email || '').trim()]
    );
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Username or email already in use' });
    }

    const { hash, salt } = hashPassword(password);
    const userId = `USR-${Date.now().toString().slice(-6)}`;
    const empId = `EMP-${Date.now().toString().slice(-4)}`;

    // Insert into user_accounts (user_accounts table does not have a department column)
    await pool.query(
      `INSERT INTO user_accounts (id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, TRUE)`,
      [userId, username.trim(), (email || '').trim(), hash, salt, role, empId, name.trim()]
    );

    // If an employee role, also insert into employees table for CRM workflow consistency
    if (role !== 'Customer') {
      await pool.query(
        `INSERT INTO employees (id, name, email, phone, role, department, location, active_leads_count, completed_projects_count, username)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), department = VALUES(department), location = VALUES(location)`,
        [empId, name.trim(), (email || `${username.trim()}@abenergy.in`).trim(), phone || '+91 98000-00000', role, department || 'Solar Operations', location || 'Bengaluru', username.trim()]
      );
    }

    res.status(201).json({
      success: true,
      message: `User ${username} created successfully with role ${role}`,
      user: {
        id: userId,
        username,
        name,
        role,
        department: department || 'Solar Operations',
        isActive: true,
      },
    });
  } catch (error: any) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const { name, email, phone, role, department, location, password } = req.body;

    const [existing]: any = await pool.query('SELECT * FROM user_accounts WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }
    const target = existing[0];

    // RBAC: Sales Manager can only update Sales Executive; Project Manager only Installation Team
    if (currentUser.role === 'Sales Manager' && target.role !== 'Sales Executive') {
      return res.status(403).json({ success: false, error: 'Sales Manager can only update Sales Executive accounts' });
    }
    if (currentUser.role === 'Project Manager' && target.role !== 'Installation Team') {
      return res.status(403).json({ success: false, error: 'Project Manager can only update Installation Team accounts' });
    }
    if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Sales Manager' && currentUser.role !== 'Project Manager') {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify user accounts' });
    }

    // Role changes can only be performed by Super Admin
    let updatedRole = target.role;
    if (role && role !== target.role) {
      if (currentUser.role !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Only Super Admin can change account roles' });
      }
      updatedRole = role;
    }

    // Update user_accounts
    if (password && password.trim().length >= 6) {
      const { hash, salt } = hashPassword(password);
      await pool.query(
        `UPDATE user_accounts 
         SET name = COALESCE(?, name), email = COALESCE(?, email), role = ?, password_hash = ?, password_salt = ?
         WHERE id = ?`,
        [name, email, updatedRole, hash, salt, id]
      );
    } else {
      await pool.query(
        `UPDATE user_accounts 
         SET name = COALESCE(?, name), email = COALESCE(?, email), role = ?
         WHERE id = ?`,
        [name, email, updatedRole, id]
      );
    }

    // Update corresponding employee record if exists
    if (target.employee_id || target.username) {
      await pool.query(
        `UPDATE employees 
         SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = ?, department = COALESCE(?, department), location = COALESCE(?, location)
         WHERE id = ? OR username = ?`,
        [name, email, phone, updatedRole, department, location, target.employee_id, target.username]
      );
    }

    res.json({
      success: true,
      message: 'User account updated successfully',
    });
  } catch (error: any) {
    console.error('updateUser error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;
    const [existing]: any = await pool.query('SELECT * FROM user_accounts WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }
    const target = existing[0];

    // RBAC check
    if (currentUser.role === 'Sales Manager' && target.role !== 'Sales Executive') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    if (currentUser.role === 'Project Manager' && target.role !== 'Installation Team') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    if (currentUser.role !== 'Super Admin' && currentUser.role !== 'Sales Manager' && currentUser.role !== 'Project Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    // Super Admin cannot deactivate themselves
    if (target.id === currentUser.userId || target.username === currentUser.username) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own active session account' });
    }

    const newStatus = !target.is_active;
    await pool.query('UPDATE user_accounts SET is_active = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `User account ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus,
    });
  } catch (error: any) {
    console.error('toggleUserStatus error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle account status' });
  }
};
