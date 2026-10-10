import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedAdmin } from '@/lib/auth';

/**
 * GET /api/admin/stats
 * Overview dashboard metrics and stats
 */
export async function GET(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      { count: totalLicenses },
      { count: activeLicenses },
      { count: unusedLicenses },
      { count: expiredLicenses },
      { count: bannedLicenses },
      { count: totalDevices },
      { count: totalProducts },
      { data: recentLogs },
    ] = await Promise.all([
      supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'unused'),
      supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
      supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
      supabaseAdmin.from('license_devices').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalLicenses: totalLicenses || 0,
        activeLicenses: activeLicenses || 0,
        unusedLicenses: unusedLicenses || 0,
        expiredLicenses: expiredLicenses || 0,
        bannedLicenses: bannedLicenses || 0,
        totalDevices: totalDevices || 0,
        totalProducts: totalProducts || 0,
      },
      recentLogs: recentLogs || [],
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
