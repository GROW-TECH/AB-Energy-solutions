import { Request, Response } from 'express';
import { pool } from '../db.js';
import { verifyPassword, signJwt } from '../utils/security.js';

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

    if (!user || !user.password_hash || !user.password_salt) {
      // Record failed attempt
      const currentAttempts = limitRecord ? limitRecord.attempts + 1 : 1;
      loginRateLimitMap.set(ip, { attempts: currentAttempts, lastAttemptTime: now });

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

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your username and password.',
      });
    }

    // Login successful: reset rate limit for this IP
    loginRateLimitMap.delete(ip);

    // Issue signed JWT token valid for 24 hours
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employee_id,
      customerId: user.customer_id,
    };

    const token = signJwt(tokenPayload, 86400); // 24 hours

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

    res.json({
      success: true,
      user: req.user,
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
