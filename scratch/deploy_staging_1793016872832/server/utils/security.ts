import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ab_energy_solutions_default_dev_secret_2026_solar_crm';

export interface UserTokenPayload {
  userId: string;
  username: string;
  email: string;
  name: string;
  role: string;
  employeeId?: string;
  customerId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using Node.js native scrypt with a cryptographic salt.
 */
export function hashPassword(password: string, providedSalt?: string): { hash: string; salt: string } {
  const salt = providedSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verify a candidate password against an existing scrypt hash in constant time.
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, storedSalt, 64);
    const hashBuffer = Buffer.from(storedHash, 'hex');
    const derivedBuffer = derivedKey;
    if (hashBuffer.length !== derivedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * URL-safe Base64 encoding.
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * URL-safe Base64 decoding.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Sign an RFC 7519 compliant JSON Web Token (JWT) with HMAC-SHA256.
 */
export function signJwt(payload: Record<string, any>, expiresInSeconds: number = 86400): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(signatureInput);
  const encodedSignature = base64UrlEncode(hmac.digest('binary'));

  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Verify and decode an RFC 7519 JWT signed with HMAC-SHA256.
 */
export function verifyJwt<T = UserTokenPayload>(token: string): T | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Verify signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(signatureInput);
    const expectedSignature = base64UrlEncode(hmac.digest('binary'));

    const signatureBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    // Verify payload & expiration
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Expired token
      return null;
    }

    return payload as T;
  } catch (err) {
    return null;
  }
}
