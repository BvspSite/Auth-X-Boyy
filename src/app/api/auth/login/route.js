import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity } from '@/lib/supabase';
import { verifyPassword, signAdminToken } from '@/lib/crypto';
import { getClientIp } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Admin Login Endpoint
 */
export async function POST(req) {
  const ip = getClientIp(req);

  try {
    const { username, password } = await req.json().catch(() => ({}));

    const cleanUser = (username || '').toLowerCase().trim();
    const cleanPass = password || '';

    if (!cleanUser || !cleanPass) {
      return NextResponse.json({
        success: false,
        message: 'Username dan password wajib diisi.',
      }, { status: 400 });
    }

    // 1. Fetch admin user from Supabase
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('username', cleanUser)
      .maybeSingle();

    if (error) {
      console.error('[SUPABASE_LOGIN_ERROR]', error);
      const isMissingKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;
      return NextResponse.json({
        success: false,
        message: isMissingKey
          ? 'Environment Variable SUPABASE_SERVICE_ROLE_KEY belum diisi di Settings Vercel! Harap tambahkan di Project Settings -> Environment Variables, lalu Redeploy.'
          : 'Database Supabase Error: ' + (error.message || JSON.stringify(error)),
        details: error,
      }, { status: 500 });
    }

    if (!admin) {
      await logActivity('ADMIN_LOGIN_FAILED', `Login failed for: ${cleanUser}`, {}, ip);
      return NextResponse.json({
        success: false,
        message: 'Username admin tidak ditemukan di database.',
      }, { status: 401 });
    }

    // 2. Verify PBKDF2 hash
    const isValid = verifyPassword(cleanPass, admin.salt, admin.password_hash);
    if (!isValid) {
      await logActivity('ADMIN_LOGIN_FAILED', `Wrong password attempt for: ${cleanUser}`, {}, ip);
      return NextResponse.json({
        success: false,
        message: 'Username atau password salah.',
      }, { status: 401 });
    }

    // 3. Update last_login_at
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('admins')
      .update({ last_login_at: now })
      .eq('id', admin.id);

    // 4. Create signed session token
    const token = signAdminToken({
      id: admin.id,
      username: admin.username,
      role: 'admin',
    });

    await logActivity('ADMIN_LOGIN_SUCCESS', `Admin logged in: ${cleanUser}`, {}, ip);

    // 5. Build response and set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil! Mengalihkan ke dashboard...',
      user: {
        id: admin.id,
        username: admin.username,
      },
      token,
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    console.error('[LOGIN_ERROR]', err);
    return NextResponse.json({
      success: false,
      message: 'Server error: ' + (err.message || 'unknown'),
    }, { status: 500 });
  }
}
