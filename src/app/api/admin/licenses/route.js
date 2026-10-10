import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity } from '@/lib/supabase';
import { getAuthenticatedAdmin, getClientIp } from '@/lib/auth';
import { generateLicenseKey, applyLicenseMask } from '@/lib/crypto';

/**
 * GET /api/admin/licenses
 * Lists licenses with optional filters & device count
 */
export async function GET(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const productId = url.searchParams.get('product_id') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let query = supabaseAdmin
      .from('licenses')
      .select('*, products(id, name), license_devices(id, hwid, ip_address, last_used_at)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (search) {
      query = query.or(`license_key.ilike.%${search}%,note.ilike.%${search}%`);
    }

    const { data: licenses, error } = await query;
    if (error) throw error;

    // Format list
    const formatted = (licenses || []).map((l) => ({
      ...l,
      devicesCount: l.license_devices ? l.license_devices.length : 0,
      devices: l.license_devices || [],
    }));

    return NextResponse.json({
      success: true,
      licenses: formatted,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/licenses
 * Generates single or bulk licenses
 */
export async function POST(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(parseInt(body.amount || body.count || '1', 10), 1), 100);
    const maxDevices = Math.max(parseInt(body.max_devices || '1', 10), 1);
    const note = body.note || null;
    const productId = body.product_id || 'panel-aimbot-xboy';

    // Mask parameters
    const mask = (body.mask || (body.prefix ? `${body.prefix}-****-****-****` : '*****-*****-*****-*****-*****')).trim();
    const lowercase = body.lowercase !== undefined ? Boolean(body.lowercase) : true;
    const capital = body.capital !== undefined ? Boolean(body.capital) : true;

    // Calculate duration in days
    const dur = parseFloat(body.duration ?? body.duration_days ?? 1);
    const unit = body.expiry_unit || 'Days';
    let durationDays = 30;

    if (unit === 'Lifetime' || dur === 0) {
      durationDays = 0;
    } else if (unit === 'Seconds') {
      durationDays = Math.max(1, Math.round(dur / 86400));
    } else if (unit === 'Minutes') {
      durationDays = Math.max(1, Math.round(dur / 1440));
    } else if (unit === 'Hours') {
      durationDays = Math.max(1, Math.round(dur / 24));
    } else if (unit === 'Days') {
      durationDays = Math.max(1, Math.round(dur));
    } else if (unit === 'Weeks') {
      durationDays = Math.max(1, Math.round(dur * 7));
    } else if (unit === 'Months') {
      durationDays = Math.max(1, Math.round(dur * 30));
    } else if (unit === 'Years') {
      durationDays = Math.max(1, Math.round(dur * 365));
    }

    // Verify product exists
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ success: false, message: 'Produk tidak ditemukan.' }, { status: 400 });
    }

    const newLicenses = [];
    for (let i = 0; i < count; i++) {
      const licenseKey = applyLicenseMask(mask, { lowercase, uppercase: capital });
      newLicenses.push({
        product_id: productId,
        license_key: licenseKey,
        duration_days: durationDays,
        status: 'unused',
        max_devices: maxDevices,
        note: note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('licenses')
      .insert(newLicenses)
      .select();

    if (error) throw error;

    await logActivity('LICENSE_GENERATED', `Generated ${count} license(s) by ${admin.username} [mask: ${mask}]`, {
      count,
      mask,
      durationDays,
      unit,
      productId,
    }, ip);

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${count} License Key baru!`,
      createdCount: count,
      licenses: inserted,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/licenses
 * Updates license (note, status, extend duration)
 */
export async function PATCH(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    const { id, status, note, extend_days } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID lisensi diperlukan.' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, message: 'Lisensi tidak ditemukan.' }, { status: 404 });
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updates.status = status;
    if (note !== undefined) updates.note = note;

    if (extend_days && parseInt(extend_days, 10) > 0) {
      const days = parseInt(extend_days, 10);
      updates.duration_days = (existing.duration_days || 0) + days;
      if (existing.expires_at) {
        const currentExp = new Date(existing.expires_at);
        const baseTime = currentExp > new Date() ? currentExp : new Date();
        updates.expires_at = new Date(baseTime.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
        if (existing.status === 'expired') {
          updates.status = 'active';
        }
      }
    }

    const { error: updErr } = await supabaseAdmin
      .from('licenses')
      .update(updates)
      .eq('id', id);

    if (updErr) throw updErr;

    await logActivity('LICENSE_UPDATED', `License updated: ${existing.license_key}`, {
      license_id: id,
      updates,
      admin: admin.username,
    }, ip);

    return NextResponse.json({
      success: true,
      message: 'Lisensi berhasil diperbarui.',
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/licenses
 * Deletes a license
 */
export async function DELETE(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const ip = getClientIp(req);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID lisensi diperlukan.' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('licenses')
      .select('license_key')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('licenses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity('LICENSE_DELETED', `Deleted license: ${existing?.license_key || id}`, {
      license_id: id,
      admin: admin.username,
    }, ip);

    return NextResponse.json({
      success: true,
      message: 'Lisensi berhasil dihapus.',
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
