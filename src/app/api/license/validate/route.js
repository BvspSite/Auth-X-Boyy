import { NextResponse } from 'next/server';
import { supabaseAdmin, parseProductMeta } from '@/lib/supabase';
import { getClientIp } from '@/lib/auth';

/**
 * POST /api/license/validate
 * Validates active status and device binding without modifying registration
 */
export async function POST(req) {
  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    let { license_key, hwid } = body;

    license_key = (license_key || '').trim();
    hwid = (hwid || '').trim();

    if (!license_key) {
      return NextResponse.json({ success: false, message: 'License key required.' }, { status: 400 });
    }

    const { data: license, error } = await supabaseAdmin
      .from('licenses')
      .select('*, products(id, name, description), license_devices(hwid)')
      .eq('license_key', license_key)
      .maybeSingle();

    if (error || !license) {
      return NextResponse.json({ success: false, message: 'License tidak valid.' }, { status: 404 });
    }

    // Check if app is paused
    const appMeta = parseProductMeta(license.products);
    if (appMeta && appMeta.paused) {
      return NextResponse.json({
        success: false,
        message: 'Application is currently paused by admin.',
      }, { status: 403 });
    }

    if (license.status === 'banned') {
      return NextResponse.json({ success: false, message: 'License diblokir.' }, { status: 403 });
    }

    const now = new Date();
    if (license.expires_at && new Date(license.expires_at) < now) {
      return NextResponse.json({ success: false, message: 'License sudah kedaluwarsa.' }, { status: 403 });
    }

    if (hwid) {
      const boundHwids = (license.license_devices || []).map((d) => d.hwid);
      if (boundHwids.length > 0 && !boundHwids.includes(hwid)) {
        return NextResponse.json({ success: false, message: 'HWID tidak cocok.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      valid: true,
      status: license.status,
      product_id: license.product_id,
      product_name: license.products?.name,
      expires_at: license.expires_at,
      duration_days: license.duration_days,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
