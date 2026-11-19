import { Request, Response } from 'express';
import { pool } from '../db.js';
import { verifyPassword, signJwt } from '../utils/security.js';
import { DEMO_ACCOUNTS } from '../migrations/init-auth.js';
import { recordAuditLogDirect } from './audit.controller.js';

// Simple in-memory rate limiting for login attempts
interface RateLimitRecord {
  attempts: number;
  lastAttemptTime: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const login = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = (req.body.username || req.body.email || req.body.identifier || '').trim();
    const password = req.body.password || '';

    // Check rate limit
    const now = Date.now();
    const limitRecord = loginRateLimitMap.get(ip);
    if (limitRecord) {
      if (now - limitRecord.lastAttemptTime < WINDOW_MS) {
        if (limitRecord.attempts >= MAX_ATTEMPTS) {
          return res.status(429).json({
            success: false,
            error: 'Too many failed login attempts. Please wait 5 minutes before trying again.',
            code: 'RATE_LIMIT_EXCEEDED',
          });
        }
      } else {
        // Reset window
        loginRateLimitMap.delete(ip);
      }
    }

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both username/email and password.',
      });
    }

    // Lookup user in user_accounts
    const [rows]: any = await pool.query(
      `SELECT id, username, email, password_hash, password_salt, role, employee_id, customer_id, name, is_active 
       FROM user_accounts 
       WHERE (username = ? OR email = ?) AND is_active = TRUE
       LIMIT 1`,
      [identifier, identifier]
    );

    let user = rows && rows.length > 0 ? rows[0] : null;

    // Fallback lookup in employees table if not found in user_accounts
    if (!user) {
      const [empRows]: any = await pool.query(
        `SELECT id, username, email, password_hash, password_salt, role, name 
         FROM employees 
         WHERE (username = ? OR email = ?) AND password_hash IS NOT NULL
         LIMIT 1`,
        [identifier, identifier]
      );
      if (empRows && empRows.length > 0) {
        user = {
          ...empRows[0],
          employee_id: empRows[0].id,
          customer_id: null,
          is_active: true,
        };
      }
    }

    // Fallback lookup in customers table if not found
    if (!user) {
      const [custRows]: any = await pool.query(
        `SELECT id, username, email, password_hash, password_salt, name 
         FROM customers 
         WHERE (username = ? OR email = ?) AND password_hash IS NOT NULL
         LIMIT 1`,
        [identifier, identifier]
      );
      if (custRows && custRows.length > 0) {
        user = {
          ...custRows[0],
          role: 'Customer',
          employee_id: null,
          customer_id: custRows[0].id,
          is_active: true,
        };
      }
    }

    // Fallback check against DEMO_ACCOUNTS
    if (!user) {
      const demoMatch = DEMO_ACCOUNTS.find(
        d => (d.username.toLowerCase() === identifier.toLowerCase() || d.email.toLowerCase() === identifier.toLowerCase())
      );
      if (demoMatch && (password === demoMatch.defaultPassword || (demoMatch.username === 'auditor' && (password === 'Auditor@123' || password === 'auditor123')))) {
        let dynamicName = demoMatch.name;
        try {
          const [dbEmps]: any = await pool.query(
            `SELECT name FROM employees WHERE username = ? OR role = ? LIMIT 1`,
            [demoMatch.username, demoMatch.role]
          );
          if (dbEmps && dbEmps.length > 0 && dbEmps[0].name) {
            dynamicName = dbEmps[0].name;
          }
        } catch (_) {}

        const tokenPayload = {
          userId: demoMatch.employeeId || `USER-${demoMatch.username}`,
          username: demoMatch.username,
          email: demoMatch.email,
          name: dynamicName,
          role: demoMatch.role,
          phone: demoMatch.phone,
          employeeId: demoMatch.employeeId || null,
          customerId: demoMatch.customerId || null,
        };
        const token = signJwt(tokenPayload, 86400);
        return res.json({
          success: true,
          token,
          user: tokenPayload,
          message: 'Login successful.',
        });
      }
    }

    if (!user || !user.password_hash || !user.password_salt) {
      // Record failed attempt
      const currentAttempts = limitRecord ? limitRecord.attempts + 1 : 1;
      loginRateLimitMap.set(ip, { attempts: currentAttempts, lastAttemptTime: now });

      recordAuditLogDirect({
        userId: 'ANONYMOUS',
        userName: identifier || 'Unknown User',
        userRole: 'Guest',
        action: 'LOGIN_FAILED',
        category: 'Security',
        details: `Failed login attempt for identifier "${identifier}" (User not found).`,
        ipAddress: ip,
        status: 'Failed',
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your username and password.',
      });
    }

    // Verify password securely using constant-time comparison
    const isValid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      const currentAttempts = limitRecord ? limitRecord.attempts + 1 : 1;
      loginRateLimitMap.set(ip, { attempts: currentAttempts, lastAttemptTime: now });

      recordAuditLogDirect({
        userId: user.id || 'ANONYMOUS',
        userName: user.name || identifier,
        userRole: user.role || 'Guest',
        action: 'LOGIN_FAILED',
        category: 'Security',
        details: `Failed login attempt for username "${user.username || identifier}" (Incorrect password).`,
        ipAddress: ip,
        status: 'Failed',
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your username and password.',
      });
    }

    // Login successful: reset rate limit for this IP
    loginRateLimitMap.delete(ip);

    // Issue signed JWT token valid for 24 hours
    let userPhone = null;
    let userName = user.name;
    const targetEmpId = user.employee_id || user.id;
    if (targetEmpId) {
      const [empP]: any = await pool.query(
        `SELECT phone, name FROM employees WHERE id = ? OR username = ? OR email = ? OR (role = 'Super Admin' AND ? = 'Super Admin') LIMIT 1`,
        [targetEmpId, user.username || '', user.email || '', user.role]
      );
      if (empP && empP.length > 0) {
        if (empP[0].phone) userPhone = empP[0].phone;
        if (empP[0].name && (!userName || userName === 'Super Admin')) {
          userName = empP[0].name;
        }
      }
    }

    const tokenPayload = {
      id: user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      name: userName || user.name,
      role: user.role,
      phone: userPhone,
      employeeId: user.employee_id || (user.role !== 'Customer' ? user.id : null),
      customerId: user.customer_id,
    };

    const token = signJwt(tokenPayload, 86400); // 24 hours

    recordAuditLogDirect({
      userId: tokenPayload.userId || tokenPayload.id,
      userName: tokenPayload.name,
      userRole: tokenPayload.role,
      action: 'USER_LOGIN',
      category: 'Security',
      details: `User "${tokenPayload.name}" (${tokenPayload.username}) successfully authenticated as ${tokenPayload.role}.`,
      ipAddress: ip,
      status: 'Success',
      metadata: { username: tokenPayload.username, role: tokenPayload.role },
    });

    res.json({
      success: true,
      token,
      user: tokenPayload,
      message: 'Login successful.',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthenticated.' });
    }

    let userObj: any = { ...req.user };

    // Fetch latest user details from user_accounts to always reflect updated name, email, role
    try {
      const [accs]: any = await pool.query(
        `SELECT id, username, name, email, role, employee_id, customer_id FROM user_accounts WHERE id = ? OR username = ? OR (role = 'Super Admin' AND ? = 'Super Admin') LIMIT 1`,
        [req.user.userId || req.user.id, req.user.username, req.user.role]
      );
      if (accs && accs.length > 0) {
        const acc = accs[0];
        userObj = {
          ...userObj,
          id: acc.id,
          userId: acc.id,
          username: acc.username,
          name: acc.name || userObj.name,
          email: acc.email || userObj.email,
          role: acc.role || userObj.role,
          employeeId: acc.employee_id || userObj.employeeId,
          customerId: acc.customer_id || userObj.customerId,
        };
      }
    } catch (_) {}

    // Also check employees table for fresh name and phone if available
    try {
      const [empP]: any = await pool.query(
        `SELECT phone, name FROM employees WHERE id = ? OR username = ? OR email = ? OR (role = 'Super Admin' AND ? = 'Super Admin') LIMIT 1`,
        [userObj.employeeId || userObj.userId, userObj.username, userObj.email || '', userObj.role]
      );
      if (empP && empP.length > 0) {
        if (empP[0].name) {
          userObj.name = empP[0].name;
        }
        if (empP[0].phone) {
          userObj.phone = empP[0].phone;
        }
      }
    } catch (_) {}

    res.json({
      success: true,
      user: userObj,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};
