import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Retrieves current admin profile
 */
export async function GET(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: {
      id: admin.id,
      username: admin.username,
      role: admin.role || (admin.username?.toLowerCase() === 'admin' ? 'super_admin' : 'admin'),
    },
  });
}
