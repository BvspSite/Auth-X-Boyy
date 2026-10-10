import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity } from '@/lib/supabase';
import { getAuthenticatedAdmin, getClientIp } from '@/lib/auth';

/**
 * GET /api/admin/logs
 * Fetches recent activity logs
 */
export async function GET(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const { data: logs, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/logs
 * Clears activity logs
 */
export async function DELETE(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const ip = getClientIp(req);

  try {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) throw error;

    await logActivity('LOGS_CLEARED', `Activity logs purged by ${admin.username}`, {}, ip);

    return NextResponse.json({
      success: true,
      message: 'Log aktivitas berhasil dibersihkan.',
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
