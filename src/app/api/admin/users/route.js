import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, logActivity, getUserRolesMap, setUserRole, removeUserRole } from '@/lib/supabase';
import { getAuthenticatedAdmin, getClientIp } from '@/lib/auth';
import { generateSalt, hashPassword } from '@/lib/crypto';

/**
 * GET /api/admin/users
 * Returns list of admin users and active device monitoring sessions
 */
export async function GET(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch Admin Accounts
    const { data: adminList, error: adminErr } = await supabaseAdmin
      .from('admins')
      .select('id, username, created_at, last_login_at')
      .order('created_at', { ascending: true });

    if (adminErr) throw adminErr;

    const rolesMap = await getUserRolesMap();
    const formattedUsers = (adminList || []).map((u) => {
      const uLower = u.username.toLowerCase();
      const role = rolesMap[uLower] || (uLower === 'admin' ? 'super_admin' : 'admin');
      return {
        id: u.id,
        username: u.username,
        role,
        isRoot: uLower === 'admin',
        created_at: u.created_at,
        last_login_at: u.last_login_at,
      };
    });

    // 2. Fetch Device Monitoring Sessions (loader / client devices)
    const { data: rawDevices, error: devErr } = await supabaseAdmin
      .from('license_devices')
      .select('id, hwid, ip_address, first_used_at, last_used_at, license_id, licenses(id, license_key, status, duration_days, expires_at, product_id, products(id, name))')
      .order('last_used_at', { ascending: false })
      .limit(200);

    if (devErr) throw devErr;

    const formattedDevices = (rawDevices || []).map((d) => ({
      id: d.id,
      hwid: d.hwid,
      ip_address: d.ip_address || 'Unknown',
      first_used_at: d.first_used_at,
      last_used_at: d.last_used_at,
      license_id: d.license_id,
      license_key: d.licenses?.license_key || '-',
      license_status: d.licenses?.status || 'active',
      duration_days: d.licenses?.duration_days ?? 0,
      expires_at: d.licenses?.expires_at || null,
      product_id: d.licenses?.product_id || '-',
      product_name: d.licenses?.products?.name || d.licenses?.product_id || '-',
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      devices: formattedDevices,
      currentRole: admin.role,
      currentUsername: admin.username,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Super Admin only: Creates a new admin or super admin user
 */
export async function POST(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Super Admin exclusivity check
  if (admin.role !== 'super_admin') {
    return NextResponse.json({
      success: false,
      message: 'Akses Ditolak: Hanya Super Admin yang berhak menambahkan pengguna baru!',
    }, { status: 403 });
  }

  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    let { username, password, role = 'admin' } = body;

    const cleanUser = (username || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = password || '';
    const cleanRole = role === 'super_admin' ? 'super_admin' : 'admin';

    if (!cleanUser || cleanUser.length < 3) {
      return NextResponse.json({
        success: false,
        message: 'Username minimal 3 karakter (hanya huruf, angka, garis bawah, strip).',
      }, { status: 400 });
    }

    if (!cleanPass || cleanPass.length < 4) {
      return NextResponse.json({
        success: false,
        message: 'Password minimal 4 karakter.',
      }, { status: 400 });
    }

    // Check if username already exists
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('username', cleanUser)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        message: `Username "${cleanUser}" sudah terdaftar di sistem.`,
      }, { status: 400 });
    }

    // Generate cryptographic hash
    const salt = generateSalt(16);
    const password_hash = hashPassword(cleanPass, salt);
    const newId = crypto.randomUUID();

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('admins')
      .insert({
        id: newId,
        username: cleanUser,
        password_hash,
        salt,
        created_at: new Date().toISOString(),
      })
      .select('id, username, created_at')
      .single();

    if (insertErr) throw insertErr;

    // Save assigned role
    await setUserRole(cleanUser, cleanRole);

    await logActivity('USER_CREATED', `New admin user created: ${cleanUser} (${cleanRole})`, {
      new_username: cleanUser,
      role: cleanRole,
      created_by: admin.username,
    }, ip);

    return NextResponse.json({
      success: true,
      message: `User "${cleanUser}" (${cleanRole === 'super_admin' ? 'Super Admin' : 'Admin Biasa'}) berhasil dibuat!`,
      user: {
        ...inserted,
        role: cleanRole,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users
 * Super Admin only: Deletes an admin or normal user
 */
export async function DELETE(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Super Admin exclusivity check
  if (admin.role !== 'super_admin') {
    return NextResponse.json({
      success: false,
      message: 'Akses Ditolak: Hanya Super Admin yang berhak menghapus user!',
    }, { status: 403 });
  }

  const ip = getClientIp(req);

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID user diperlukan.' }, { status: 400 });
    }

    const { data: targetUser, error: findErr } = await supabaseAdmin
      .from('admins')
      .select('id, username')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !targetUser) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Protection: Root admin cannot be deleted
    if (targetUser.username.toLowerCase() === 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Akun root "admin" dilindungi oleh sistem keamanan dan tidak boleh dihapus!',
      }, { status: 400 });
    }

    // Protection: Cannot delete self
    if (targetUser.id === admin.id || targetUser.username.toLowerCase() === admin.username.toLowerCase()) {
      return NextResponse.json({
        success: false,
        message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login!',
      }, { status: 400 });
    }

    const { error: delErr } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', targetUser.id);

    if (delErr) throw delErr;

    // Remove role mapping
    await removeUserRole(targetUser.username);

    await logActivity('USER_DELETED', `User removed: ${targetUser.username}`, {
      deleted_user: targetUser.username,
      deleted_by: admin.username,
    }, ip);

    return NextResponse.json({
      success: true,
      message: `User "${targetUser.username}" berhasil dihapus dari sistem.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Super Admin only: Updates user role or resets password
 */
export async function PATCH(req) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (admin.role !== 'super_admin') {
    return NextResponse.json({
      success: false,
      message: 'Akses Ditolak: Hanya Super Admin yang berhak memperbarui data user!',
    }, { status: 403 });
  }

  const ip = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    const { id, role, new_password } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID user diperlukan.' }, { status: 400 });
    }

    const { data: targetUser, error: findErr } = await supabaseAdmin
      .from('admins')
      .select('id, username')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !targetUser) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 });
    }

    // 1. Update Password if provided
    if (new_password) {
      if (new_password.length < 4) {
        return NextResponse.json({ success: false, message: 'Password minimal 4 karakter.' }, { status: 400 });
      }
      const salt = generateSalt(16);
      const password_hash = hashPassword(new_password, salt);

      const { error: updErr } = await supabaseAdmin
        .from('admins')
        .update({ password_hash, salt })
        .eq('id', targetUser.id);

      if (updErr) throw updErr;

      await logActivity('USER_PASSWORD_RESET', `Password reset for user: ${targetUser.username}`, {
        target: targetUser.username,
        by: admin.username,
      }, ip);
    }

    // 2. Update Role if provided (root admin cannot be demoted)
    if (role && targetUser.username.toLowerCase() !== 'admin') {
      const cleanRole = role === 'super_admin' ? 'super_admin' : 'admin';
      await setUserRole(targetUser.username, cleanRole);

      await logActivity('USER_ROLE_CHANGED', `Role changed for user: ${targetUser.username} -> ${cleanRole}`, {
        target: targetUser.username,
        new_role: cleanRole,
        by: admin.username,
      }, ip);
    }

    return NextResponse.json({
      success: true,
      message: `User "${targetUser.username}" berhasil diperbarui.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
