import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity, parseProductMeta } from '@/lib/supabase';
import { getAuthenticatedAdmin, getClientIp } from '@/lib/auth';
import { generateLicenseKey, applyLicenseMask } from '@/lib/crypto';
import { calculateDuration, encodeLicenseNote, parseLicenseNote } from '@/lib/license-expiry';

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
    const isSuperAdmin = admin.role === 'super_admin';
    const currentUsername = (admin.username || '').toLowerCase();

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const productId = url.searchParams.get('product_id') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // If regular user, get their owned product IDs
    let ownedProductIds = null;
    if (!isSuperAdmin) {
      const { data: allProds } = await supabaseAdmin.from('products').select('*');
      ownedProductIds = (allProds || [])
        .map((p) => parseProductMeta(p))
        .filter((p) => p.owner && p.owner.toLowerCase() === currentUsername)
        .map((p) => p.id);

      // If user has 0 products, return empty list immediately!
      if (ownedProductIds.length === 0) {
        return NextResponse.json({ success: true, licenses: [] });
      }
    }

    let query = supabaseAdmin
      .from('licenses')
      .select('*, products(id, name, description), license_devices(id, hwid, ip_address, last_used_at)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (productId) {
      if (!isSuperAdmin && !ownedProductIds.includes(productId)) {
        return NextResponse.json({ success: true, licenses: [] });
      }
      query = query.eq('product_id', productId);
    } else if (!isSuperAdmin) {
      query = query.in('product_id', ownedProductIds);
    }

    if (search) {
      query = query.or(`license_key.ilike.%${search}%,note.ilike.%${search}%`);
    }

    const { data: licenses, error } = await query;
    if (error) throw error;

    // Format list with accurate duration parsing and clean note
    const formatted = (licenses || []).map((l) => {
      const parsedNote = parseLicenseNote(l.note, l.duration_days);
      return {
        ...l,
        note: parsedNote.cleanNote,
        duration_display: parsedNote.displayDuration,
        expiry_unit: parsedNote.unit,
        duration_val: parsedNote.duration,
        duration_seconds: parsedNote.durationSeconds,
        is_lifetime: parsedNote.isLifetime,
        devicesCount: l.license_devices ? l.license_devices.length : 0,
        devices: l.license_devices || [],
      };
    });

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
  const isSuperAdmin = admin.role === 'super_admin';
  const currentUsername = (admin.username || '').toLowerCase();

  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(parseInt(body.amount || body.count || '1', 10), 1), 100);
    const maxDevices = Math.max(parseInt(body.max_devices || '1', 10), 1);
    const userNote = (body.note || '').trim();
    const productId = body.product_id;

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Harap pilih aplikasi tujuan.' }, { status: 400 });
    }

    // Verify product exists and ownership
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ success: false, message: 'Produk/Aplikasi tidak ditemukan.' }, { status: 400 });
    }

    const prodMeta = parseProductMeta(product);
    if (!isSuperAdmin && prodMeta.owner && prodMeta.owner.toLowerCase() !== currentUsername) {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Anda tidak memiliki akses ke aplikasi ini.' }, { status: 403 });
    }

    // Mask parameters
    const mask = (body.mask || (body.prefix ? `${body.prefix}-****-****-****` : '*****-*****-*****-*****-*****')).trim();
    const lowercase = body.lowercase !== undefined ? Boolean(body.lowercase) : true;
    const capital = body.capital !== undefined ? Boolean(body.capital) : true;

    // Calculate duration accurately across all units
    const durCalc = calculateDuration(body.expiry_unit || 'Days', body.duration ?? body.duration_days ?? 1);
    const encodedNote = encodeLicenseNote(userNote, durCalc);

    const newLicenses = [];
    for (let i = 0; i < count; i++) {
      const licenseKey = applyLicenseMask(mask, { lowercase, uppercase: capital });
      newLicenses.push({
        product_id: productId,
        license_key: licenseKey,
        duration_days: durCalc.durationDays,
        status: 'unused',
        max_devices: maxDevices,
        note: encodedNote,
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
      durationDays: durCalc.durationDays,
      durationSeconds: durCalc.durationSeconds,
      unit: durCalc.unit,
      productId,
    }, ip);

    const formattedInserted = (inserted || []).map((l) => ({
      ...l,
      note: userNote,
      duration_display: durCalc.displayDuration,
      expiry_unit: durCalc.unit,
      duration_seconds: durCalc.durationSeconds,
      is_lifetime: durCalc.isLifetime,
    }));

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${count} License Key baru! (${durCalc.displayDuration})`,
      createdCount: count,
      licenses: formattedInserted,
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
