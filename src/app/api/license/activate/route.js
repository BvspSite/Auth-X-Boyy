import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity, parseProductMeta } from '@/lib/supabase';
import { getClientIp } from '@/lib/auth';

/**
 * POST /api/license/activate
 * Main endpoint used by C++ Loaders and Client Applications
 * Activates or validates a license key with client HWID
 */
export async function POST(req) {
  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    let { license_key, hwid } = body;

    license_key = (license_key || '').trim();
    hwid = (hwid || '').trim();

    if (!license_key) {
      return NextResponse.json({
        success: false,
        message: 'Harap masukkan License Key.',
      }, { status: 400 });
    }

    if (!hwid) {
      return NextResponse.json({
        success: false,
        message: 'HWID perangkat tidak valid atau tidak terdeteksi.',
      }, { status: 400 });
    }

    // 1. Fetch license details from Supabase
    const { data: license, error: fetchErr } = await supabaseAdmin
      .from('licenses')
      .select('*, products(id, name, description)')
      .eq('license_key', license_key)
      .maybeSingle();

    if (fetchErr) {
      console.error('[LICENSE_FETCH_ERR]', fetchErr);
      return NextResponse.json({
        success: false,
        message: 'Database error saat membaca lisensi.',
      }, { status: 500 });
    }

    if (!license) {
      await logActivity('LICENSE_FAIL', `Invalid key attempt: ${license_key}`, { hwid }, ip);
      return NextResponse.json({
        success: false,
        message: 'License Key tidak ditemukan atau tidak valid.',
      }, { status: 404 });
    }

    // Check if application is paused by admin
    const appMeta = parseProductMeta(license.products);
    if (appMeta && appMeta.paused) {
      await logActivity('LICENSE_APP_PAUSED', `Attempt on paused app: ${appMeta.name}`, { hwid, license_key }, ip);
      return NextResponse.json({
        success: false,
        message: 'Application is currently paused by admin.',
      }, { status: 403 });
    }

    // 2. Check if banned
    if (license.status === 'banned') {
      await logActivity('LICENSE_BANNED_ATTEMPT', `Banned key attempt: ${license_key}`, { hwid }, ip);
      return NextResponse.json({
        success: false,
        message: 'License Key ini telah diblokir / banned oleh administrator.',
      }, { status: 403 });
    }

    // 3. Check if expired
    const now = new Date();
    if (license.status === 'expired' || (license.expires_at && new Date(license.expires_at) < now)) {
      if (license.status !== 'expired') {
        await supabaseAdmin
          .from('licenses')
          .update({ status: 'expired' })
          .eq('id', license.id);
      }
      return NextResponse.json({
        success: false,
        message: 'License Key telah kedaluwarsa (Expired).',
      }, { status: 403 });
    }

    // 4. Handle activation logic
    let updatedExpiresAt = license.expires_at;
    let newStatus = license.status;

    // A. If license is UNUSED: First time activation
    if (license.status === 'unused') {
      newStatus = 'active';
      const activatedAt = now.toISOString();

      if (license.duration_days > 0) {
        const expDate = new Date(now.getTime() + license.duration_days * 24 * 60 * 60 * 1000);
        updatedExpiresAt = expDate.toISOString();
      } else {
        // Lifetime
        updatedExpiresAt = null;
      }

      // Update license status
      await supabaseAdmin
        .from('licenses')
        .update({
          status: newStatus,
          activated_at: activatedAt,
          expires_at: updatedExpiresAt,
          updated_at: now.toISOString(),
        })
        .eq('id', license.id);

      // Register device
      await supabaseAdmin
        .from('license_devices')
        .insert([
          {
            license_id: license.id,
            hwid: hwid,
            ip_address: ip,
            first_used_at: activatedAt,
            last_used_at: activatedAt,
          },
        ]);

      await logActivity('LICENSE_ACTIVATED', `Key activated: ${license_key}`, {
        license_id: license.id,
        product: license.product_id,
        hwid,
        duration: license.duration_days,
      }, ip);

      return NextResponse.json({
        success: true,
        message: 'License berhasil diaktivasi!',
        product_id: license.product_id || 'EXTERNAL TRICK',
        product_name: license.products?.name || license.product_id,
        duration_days: license.duration_days,
        expires_at: updatedExpiresAt,
        status: newStatus,
      });
    }

    // B. If license is ACTIVE: Verify HWID & Devices limit
    const { data: devices, error: devErr } = await supabaseAdmin
      .from('license_devices')
      .select('*')
      .eq('license_id', license.id);

    if (devErr) throw devErr;

    const currentDevices = devices || [];
    const matchedDevice = currentDevices.find((d) => d.hwid === hwid);

    if (matchedDevice) {
      // Existing device: update last_used_at & IP
      await supabaseAdmin
        .from('license_devices')
        .update({
          last_used_at: now.toISOString(),
          ip_address: ip,
        })
        .eq('id', matchedDevice.id);

      return NextResponse.json({
        success: true,
        message: 'Login successful!',
        product_id: license.product_id || 'EXTERNAL TRICK',
        product_name: license.products?.name || license.product_id,
        duration_days: license.duration_days,
        expires_at: license.expires_at,
        status: license.status,
      });
    }

    // If device not found, check max_devices limit
    const maxDevices = license.max_devices || 1;
    if (currentDevices.length >= maxDevices) {
      await logActivity('HWID_MISMATCH', `HWID mismatch on key: ${license_key}`, {
        hwid,
        registeredDevices: currentDevices.length,
        maxDevices,
      }, ip);

      return NextResponse.json({
        success: false,
        message: `HWID mismatch! Kunci ini sudah terikat ke perangkat lain (Maksimal ${maxDevices} perangkat). Hubungi admin untuk reset HWID.`,
      }, { status: 403 });
    }

    // Add new device within limit
    await supabaseAdmin
      .from('license_devices')
      .insert([
        {
          license_id: license.id,
          hwid: hwid,
          ip_address: ip,
          first_used_at: now.toISOString(),
          last_used_at: now.toISOString(),
        },
      ]);

    await logActivity('DEVICE_ADDED', `New device added to key: ${license_key}`, {
      license_id: license.id,
      hwid,
    }, ip);

    return NextResponse.json({
      success: true,
      message: 'Perangkat baru berhasil didaftarkan!',
      product_id: license.product_id || 'EXTERNAL TRICK',
      product_name: license.products?.name || license.product_id,
      duration_days: license.duration_days,
      expires_at: license.expires_at,
      status: license.status,
    });
  } catch (err) {
    console.error('[LICENSE_ACTIVATE_EXCEPTION]', err);
    return NextResponse.json({
      success: false,
      message: 'Internal server error: ' + (err.message || 'unknown error'),
    }, { status: 500 });
  }
}
