import { cookies } from 'next/headers';
import { verifyAdminToken } from './crypto';

/**
 * Extract Client IP from Request Headers
 */
export function getClientIp(req) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
    if (realIp) return realIp.trim();
  } catch (e) {}
  return '127.0.0.1';
}

/**
 * Verify admin session from request cookies or Authorization header
 */
export async function getAuthenticatedAdmin(req) {
  let token = null;

  // 1. Check Authorization header
  if (req && req.headers) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Check cookies
  if (!token) {
    try {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('auth_token');
      if (authCookie) {
        token = authCookie.value;
      }
    } catch (e) {}
  }

  if (!token) return null;
  return verifyAdminToken(token);
}
