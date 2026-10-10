import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity } from '@/lib/supabase';
import { getAuthenticatedAdmin, getClientIp } from '@/lib/auth';

/**
 * GET /api/admin/products
 * Lists all registered products
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

    const formatted = (products || []).map((p) => ({
      ...p,
      licenseCount: p.licenses ? p.licenses[0]?.count || 0 : 0,
    }));

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
 * Creates or updates a product
 */
export async function POST(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    let { id, name, description } = body;

    id = (id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    name = (name || '').trim();

    if (!id || !name) {
      return NextResponse.json({ success: false, message: 'ID dan Nama Produk wajib diisi.' }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('products')
      .upsert({
        id,
        name,
        description: description || '',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    await logActivity('PRODUCT_CREATED', `Product created/updated: ${name} (${id})`, {
      product_id: id,
      admin: admin.username,
    }, ip);

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil disimpan!',
      product: inserted,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products
 * Deletes a product
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
      return NextResponse.json({ success: false, message: 'ID produk diperlukan.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json({
          success: false,
          message: 'Produk tidak dapat dihapus karena masih memiliki lisensi terkait. Hapus atau pindahkan lisensi terlebih dahulu.',
        }, { status: 400 });
      }
      throw error;
    }

    await logActivity('PRODUCT_DELETED', `Product deleted: ${id}`, {
      product_id: id,
      admin: admin.username,
    }, ip);

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus.',
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
