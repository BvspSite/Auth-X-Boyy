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
    const isSuperAdmin = admin.role === 'super_admin';
    const currentUsername = (admin.username || '').toLowerCase();

    if (!isSuperAdmin) {
      const { data: allProds } = await supabaseAdmin.from('products').select('*');
      const { parseProductMeta } = await import('@/lib/supabase');
      const ownedProductIds = (allProds || [])
        .map((p) => parseProductMeta(p))
        .filter((p) => p.owner && p.owner.toLowerCase() === currentUsername)
        .map((p) => p.id);

      if (ownedProductIds.length === 0) {
        return NextResponse.json({
          success: true,
          stats: {
            totalLicenses: 0,
            activeLicenses: 0,
            unusedLicenses: 0,
            expiredLicenses: 0,
            bannedLicenses: 0,
            totalDevices: 0,
            totalProducts: 0,
          },
          recentLogs: [],
        });
      }

      const [
        { count: totalLicenses },
        { count: activeLicenses },
        { count: unusedLicenses },
        { count: expiredLicenses },
        { count: bannedLicenses },
        { data: userLicenses },
        { data: recentLogs },
      ] = await Promise.all([
        supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).in('product_id', ownedProductIds),
        supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).in('product_id', ownedProductIds).eq('status', 'active'),
        supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).in('product_id', ownedProductIds).eq('status', 'unused'),
        supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).in('product_id', ownedProductIds).eq('status', 'expired'),
        supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).in('product_id', ownedProductIds).eq('status', 'banned'),
        supabaseAdmin.from('licenses').select('id').in('product_id', ownedProductIds),
        supabaseAdmin.from('activity_logs').select('*').ilike('description', `%${admin.username}%`).order('created_at', { ascending: false }).limit(10),
      ]);

      const licIds = (userLicenses || []).map((l) => l.id);
      let totalDevices = 0;
      if (licIds.length > 0) {
        const { count: devCount } = await supabaseAdmin
          .from('license_devices')
          .select('*', { count: 'exact', head: true })
          .in('license_id', licIds);
        totalDevices = devCount || 0;
      }

      return NextResponse.json({
        success: true,
        stats: {
          totalLicenses: totalLicenses || 0,
          activeLicenses: activeLicenses || 0,
          unusedLicenses: unusedLicenses || 0,
          expiredLicenses: expiredLicenses || 0,
          bannedLicenses: bannedLicenses || 0,
          totalDevices,
          totalProducts: ownedProductIds.length,
        },
        recentLogs: recentLogs || [],
      });
    }

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
