import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity } from '@/lib/supabase';
import { getAuthenticatedAdmin, getClientIp } from '@/lib/auth';

/**
 * POST /api/license/reset-hwid
 * Resets HWID devices attached to a license key
 */
export async function POST(req) {
  const ip = getClientIp(req);
  const admin = await getAuthenticatedAdmin(req);

  try {
    const body = await req.json().catch(() => ({}));
    const { license_key, license_id, device_id, hwid } = body;

    // Reset single device by device ID
    if (device_id) {
      const { data: dev } = await supabaseAdmin
        .from('license_devices')
        .select('*, licenses(license_key)')
        .eq('id', device_id)
        .maybeSingle();

      const { error: delErr } = await supabaseAdmin
        .from('license_devices')
        .delete()
        .eq('id', device_id);

      if (delErr) throw delErr;

      await logActivity('HWID_DEVICE_RESET', `Device HWID removed: ${dev?.hwid || device_id}`, {
        device_id,
        hwid: dev?.hwid,
        license_key: dev?.licenses?.license_key,
        resetBy: admin ? admin.username : 'API/User',
      }, ip);

      return NextResponse.json({
        success: true,
        message: `Perangkat HWID (${dev?.hwid?.slice(0, 12)}...) berhasil di-reset.`,
      });
    }

    // Reset device by HWID string
    if (hwid && !license_id && !license_key) {
      const { error: delErr } = await supabaseAdmin
        .from('license_devices')
        .delete()
        .eq('hwid', hwid.trim());

      if (delErr) throw delErr;

      await logActivity('HWID_STRING_RESET', `All devices with HWID ${hwid} reset`, {
        hwid,
        resetBy: admin ? admin.username : 'API/User',
      }, ip);

      return NextResponse.json({
        success: true,
        message: `Semua binding untuk HWID ${hwid} berhasil di-reset.`,
      });
    }

    let query = supabaseAdmin.from('licenses').select('id, license_key');
    if (license_id) {
      query = query.eq('id', license_id);
    } else if (license_key) {
      query = query.eq('license_key', license_key.trim());
    } else {
      return NextResponse.json({ success: false, message: 'Harap tentukan license_key, license_id, device_id, atau hwid.' }, { status: 400 });
    }

    const { data: license, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !license) {
      return NextResponse.json({ success: false, message: 'Lisensi tidak ditemukan.' }, { status: 404 });
    }

    // Delete all devices registered to this license
    const { error: delErr } = await supabaseAdmin
      .from('license_devices')
      .delete()
      .eq('license_id', license.id);

    if (delErr) throw delErr;

    await logActivity('HWID_RESET', `HWID reset for license: ${license.license_key}`, {
      license_id: license.id,
      resetBy: admin ? admin.username : 'API/User',
    }, ip);

    return NextResponse.json({
      success: true,
      message: `HWID untuk lisensi ${license.license_key} berhasil di-reset. Pengguna kini dapat login di perangkat baru.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
