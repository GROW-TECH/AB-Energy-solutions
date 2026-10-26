import { Request, Response, NextFunction } from 'express';
import { verifyJwt, UserTokenPayload } from '../utils/security.js';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using an HMAC-SHA256 Bearer JWT token.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid session token.',
      code: 'AUTH_REQUIRED',
    });
  }

  const payload = verifyJwt<UserTokenPayload>(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.',
      code: 'TOKEN_INVALID_OR_EXPIRED',
    });
  }

  req.user = payload;
  next();
}

/**
 * Optional authentication: if token is provided, attach req.user, else proceed as unauthenticated.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    const payload = verifyJwt<UserTokenPayload>(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

/**
 * RBAC authorization middleware.
 * Verifies that the authenticated user's role is in the list of allowed roles.
 * Super Admin is always granted administrative access.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before permission evaluation.',
        code: 'UNAUTHENTICATED',
      });
    }

    const userRole = req.user.role;
    const isSuperAdmin = userRole === 'Super Admin';
    const isPermitted = isSuperAdmin || allowedRoles.includes(userRole);

    if (!isPermitted) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${userRole}' does not possess permissions for this operation. Permitted roles: ${allowedRoles.join(', ')}.`,
        code: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
}

/**
 * Customer ownership guard: ensures a user with role 'Customer' can only access their own records.
 */
export function requireCustomerOwnership(entityCustomerIdExtractor?: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // Super Admin and internal staff can inspect customer records for business operations
    if (req.user.role !== 'Customer') {
      return next();
    }

    const requestedCustomerId = entityCustomerIdExtractor 
      ? entityCustomerIdExtractor(req)
      : (req.params.customerId || req.params.id || req.query.customerId || req.body.customerId);

    if (requestedCustomerId && requestedCustomerId !== req.user.customerId) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You are not authorized to access another customer\'s solar plant records.',
        code: 'CUSTOMER_ISOLATION_VIOLATION',
      });
    }

    next();
  };
}
