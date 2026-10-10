import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, logActivity, parseProductMeta, serializeProductMeta } from '@/lib/supabase';
import { getAuthenticatedAdmin, getClientIp } from '@/lib/auth';

/**
 * GET /api/admin/products
 * Lists all registered products with full credentials & status
 */
export async function GET(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*, licenses(count)')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const isSuperAdmin = admin.role === 'super_admin';
    const currentUsername = (admin.username || '').toLowerCase();

    const formatted = (products || [])
      .map((p) => {
        const parsed = parseProductMeta(p);
        return {
          ...parsed,
          licenseCount: p.licenses ? p.licenses[0]?.count || 0 : 0,
        };
      })
      .filter((p) => isSuperAdmin || (p.owner && p.owner.toLowerCase() === currentUsername));

    return NextResponse.json({
      success: true,
      products: formatted,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/products
 * Handles Create, Rename, Pause/Unpause, Refresh Secret, Refresh Seller Key
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
    const { action = 'create' } = body;

    // 1. CREATE APP
    if (action === 'create' || !body.action) {
      let { id, name, description } = body;
      id = (id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      name = (name || '').trim();

      if (!id || !name) {
        return NextResponse.json({ success: false, message: 'ID dan Nama Aplikasi wajib diisi.' }, { status: 400 });
      }

      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: false, message: 'Aplikasi dengan ID ini sudah ada!' }, { status: 400 });
      }

      const secret = crypto.randomBytes(16).toString('hex');
      const seller_key = crypto.randomBytes(16).toString('hex');

      const jsonDesc = serializeProductMeta({
        desc: description || 'Application created via Auth-X-Boy',
        secret,
        seller_key,
        paused: false,
        version: '1.0',
        owner: currentUsername,
      });

      const { data: inserted, error } = await supabaseAdmin
        .from('products')
        .insert({
          id,
          name,
          description: jsonDesc,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await logActivity('APP_CREATED', `Application created: ${name} (${id})`, {
        app_id: id,
        admin: admin.username,
        owner: currentUsername,
      }, ip);

      return NextResponse.json({
        success: true,
        message: 'Aplikasi berhasil dibuat!',
        product: parseProductMeta(inserted),
      });
    }

    // 2. RENAME APP
    if (action === 'rename') {
      const { id, name } = body;
      if (!id || !name) {
        return NextResponse.json({ success: false, message: 'ID dan nama baru diperlukan.' }, { status: 400 });
      }

      const { data: current, error: getErr } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (getErr || !current) {
        return NextResponse.json({ success: false, message: 'Aplikasi tidak ditemukan.' }, { status: 404 });
      }

      const parsed = parseProductMeta(current);
      if (!isSuperAdmin && parsed.owner && parsed.owner.toLowerCase() !== currentUsername) {
        return NextResponse.json({ success: false, message: 'Akses ditolak: Anda bukan pemilik aplikasi ini.' }, { status: 403 });
      }

      const updatedJson = serializeProductMeta({
        desc: parsed.description,
        secret: parsed.secret,
        seller_key: parsed.seller_key,
        paused: parsed.paused,
        version: parsed.version,
        owner: parsed.owner,
      });

      const { data: updated, error } = await supabaseAdmin
        .from('products')
        .update({
          name: name.trim(),
          description: updatedJson,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logActivity('APP_RENAMED', `Application renamed to: ${name.trim()} (${id})`, {
        app_id: id,
        newName: name.trim(),
        admin: admin.username,
      }, ip);

      return NextResponse.json({
        success: true,
        message: 'Nama aplikasi berhasil diubah!',
        product: parseProductMeta(updated),
      });
    }

    // 3. PAUSE / UNPAUSE APP
    if (action === 'pause') {
      const { id, paused } = body;
      if (!id) {
        return NextResponse.json({ success: false, message: 'ID aplikasi diperlukan.' }, { status: 400 });
      }

      const { data: current, error: getErr } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (getErr || !current) {
        return NextResponse.json({ success: false, message: 'Aplikasi tidak ditemukan.' }, { status: 404 });
      }

      const parsed = parseProductMeta(current);
      if (!isSuperAdmin && parsed.owner && parsed.owner.toLowerCase() !== currentUsername) {
        return NextResponse.json({ success: false, message: 'Akses ditolak: Anda bukan pemilik aplikasi ini.' }, { status: 403 });
      }

      const isPaused = paused !== undefined ? Boolean(paused) : !parsed.paused;

      const updatedJson = serializeProductMeta({
        desc: parsed.description,
        secret: parsed.secret,
        seller_key: parsed.seller_key,
        paused: isPaused,
        version: parsed.version,
        owner: parsed.owner,
      });

      const { data: updated, error } = await supabaseAdmin
        .from('products')
        .update({ description: updatedJson })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logActivity(
        isPaused ? 'APP_PAUSED' : 'APP_UNPAUSED',
        `Application ${isPaused ? 'paused' : 'unpaused'}: ${current.name} (${id})`,
        { app_id: id, paused: isPaused, admin: admin.username },
        ip
      );

      return NextResponse.json({
        success: true,
        message: isPaused
          ? 'Aplikasi & semua pengguna berhasil di-pause!'
          : 'Aplikasi berhasil di-unpause dan kembali aktif!',
        product: parseProductMeta(updated),
      });
    }

    // 4. REFRESH APP SECRET
    if (action === 'refresh_secret') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, message: 'ID aplikasi diperlukan.' }, { status: 400 });
      }

      const { data: current, error: getErr } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (getErr || !current) {
        return NextResponse.json({ success: false, message: 'Aplikasi tidak ditemukan.' }, { status: 404 });
      }

      const parsed = parseProductMeta(current);
      if (!isSuperAdmin && parsed.owner && parsed.owner.toLowerCase() !== currentUsername) {
        return NextResponse.json({ success: false, message: 'Akses ditolak: Anda bukan pemilik aplikasi ini.' }, { status: 403 });
      }

      const newSecret = crypto.randomBytes(16).toString('hex');

      const updatedJson = serializeProductMeta({
        desc: parsed.description,
        secret: newSecret,
        seller_key: parsed.seller_key,
        paused: parsed.paused,
        version: parsed.version,
        owner: parsed.owner,
      });

      const { data: updated, error } = await supabaseAdmin
        .from('products')
        .update({ description: updatedJson })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logActivity('APP_SECRET_REFRESHED', `App secret refreshed: ${current.name} (${id})`, {
        app_id: id,
        admin: admin.username,
      }, ip);

      return NextResponse.json({
        success: true,
        message: 'Application Secret berhasil diperbarui!',
        product: parseProductMeta(updated),
      });
    }

    // 5. REFRESH SELLER KEY
    if (action === 'refresh_seller_key') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, message: 'ID aplikasi diperlukan.' }, { status: 400 });
      }

      const { data: current, error: getErr } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (getErr || !current) {
        return NextResponse.json({ success: false, message: 'Aplikasi tidak ditemukan.' }, { status: 404 });
      }

      const parsed = parseProductMeta(current);
      if (!isSuperAdmin && parsed.owner && parsed.owner.toLowerCase() !== currentUsername) {
        return NextResponse.json({ success: false, message: 'Akses ditolak: Anda bukan pemilik aplikasi ini.' }, { status: 403 });
      }

      const newSellerKey = crypto.randomBytes(16).toString('hex');

      const updatedJson = serializeProductMeta({
        desc: parsed.description,
        secret: parsed.secret,
        seller_key: newSellerKey,
        paused: parsed.paused,
        version: parsed.version,
        owner: parsed.owner,
      });

      const { data: updated, error } = await supabaseAdmin
        .from('products')
        .update({ description: updatedJson })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logActivity('SELLER_KEY_REFRESHED', `Seller key refreshed: ${current.name} (${id})`, {
        app_id: id,
        admin: admin.username,
      }, ip);

      return NextResponse.json({
        success: true,
        message: 'Seller Key berhasil diperbarui!',
        product: parseProductMeta(updated),
      });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products
 * Deletes an application
 */
export async function DELETE(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Privilege restriction: Only super_admin can delete applications
  if (admin.role !== 'super_admin') {
    return NextResponse.json({
      success: false,
      message: 'Akses Ditolak: Hanya akun dengan role Super Admin yang berhak menghapus aplikasi!',
    }, { status: 403 });
  }

  const ip = getClientIp(req);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID produk diperlukan.' }, { status: 400 });
    }

    // Optional cascade delete licenses
    await supabaseAdmin.from('licenses').delete().eq('product_id', id);

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity('APP_DELETED', `Application deleted: ${id}`, {
      app_id: id,
      admin: admin.username,
    }, ip);

    return NextResponse.json({
      success: true,
      message: 'Aplikasi dan data terkait berhasil dihapus.',
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
