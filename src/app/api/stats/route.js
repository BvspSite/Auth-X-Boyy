import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/stats
 * Public System Stats (Mirrors legacy stats.php functionality)
 */
export async function GET() {
  try {
    const [
      { count: totalLicenses, error: errLicenses },
      { count: totalProducts },
      { count: activeUsers },
      { count: totalLogs },
    ] = await Promise.all([
      supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('activity_logs').select('*', { count: 'exact', head: true }),
    ]);

    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
      success: true,
      databaseConnected: !errLicenses,
      hasServiceRoleKey: hasServiceKey,
      dbError: errLicenses ? errLicenses.message : null,
      accounts: totalProducts || 1,
      applications: totalProducts || 1,
      licenses: totalLicenses || 0,
      activeUsers: activeUsers || 0,
      totalActivityLogs: totalLogs || 0,
      system: 'AUTH-X-BOY Next.js + Supabase Engine',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
