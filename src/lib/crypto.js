import crypto from 'crypto';

/**
 * Generate cryptographically secure random salt
 */
export function generateSalt(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash password with PBKDF2-SHA512 (100,000 iterations)
 */
export function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
}

/**
 * Securely verify password with constant-time equality check
 */
export function verifyPassword(password, salt, expectedHash) {
  try {
    const computedHash = hashPassword(password, salt);
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

/**
 * Applies KeyAuth-style masking where each '*' is replaced by a random character
 * from the selected character space (lowercase, capital, digits).
 * Non-asterisk characters (e.g. 'caxs-', 'XBOY-', '-') remain exactly as typed.
 */
export function applyLicenseMask(mask = '*****-*****-*****-*****-*****', { lowercase = true, uppercase = true } = {}) {
  let keyspace = '';
  if (lowercase && uppercase) {
    keyspace = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  } else if (uppercase) {
    keyspace = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  } else if (lowercase) {
    keyspace = '0123456789abcdefghijklmnopqrstuvwxyz';
  } else {
    keyspace = '0123456789';
  }

  if (!mask || !mask.includes('*')) {
    return mask || 'CAXS-KEY-AUTH';
  }

  const bytes = crypto.randomBytes(mask.length * 4);
  let byteIndex = 0;

  return mask.replace(/\*/g, () => {
    const rand = bytes[byteIndex++ % bytes.length];
    return keyspace[rand % keyspace.length];
  });
}

/**
 * Generate secure random license key (Format: PREFIX-XXXX-XXXX-XXXX)
 * Uses unambiguous characters (A-Z, 2-9)
 */
export function generateLicenseKey(prefix = 'XBOY') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const getChunk = (len) => {
    let chunk = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      chunk += chars[bytes[i] % chars.length];
    }
    return chunk;
  };

  const cleanPrefix = (prefix || 'XBOY').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${cleanPrefix}-${getChunk(4)}-${getChunk(4)}-${getChunk(4)}`;
}

/**
 * HMAC token creation & verification for Admin Sessions (Zero dependencies)
 */
const SECRET = process.env.JWT_SECRET || 'auth-x-boy-security-key-production-2026-v1';

export function signAdminToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyAdminToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}
