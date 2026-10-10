import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity, parseProductMeta } from '@/lib/supabase';
import { getClientIp } from '@/lib/auth';

/**
 * /api/1.2
 * Legacy KeyAuth Protocol Compatibility Endpoint
 * Handles requests from standard KeyAuth C++/C#/Python wrappers
 */
export async function POST(req) {
  const ip = getClientIp(req);

  try {
    const url = new URL(req.url);
    const contentType = req.headers.get('content-type') || '';
    let body = {};

    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        formData.forEach((val, key) => { body[key] = val; });
      }
    }

    const type = body.type || url.searchParams.get('type') || '';

    // Handle INIT request
    if (type === 'init') {
      return NextResponse.json({
        success: true,
        message: 'Initialized',
        sessionid: 'xboy-sess-' + Date.now(),
        appinfo: {
          version: '1.0',
          customer_panel: 'https://auth-x-boy.vercel.app',
        },
      });
    }

    // Handle LICENSE request
    if (type === 'license') {
      const key = (body.key || url.searchParams.get('key') || '').trim();
      const hwid = (body.hwid || url.searchParams.get('hwid') || '').trim();

      if (!key) {
        return NextResponse.json({ success: false, message: 'Key is empty' });
      }

      // 1. Fetch license and product
      const { data: license } = await supabaseAdmin
        .from('licenses')
        .select('*, products(id, name, description)')
        .eq('license_key', key)
        .maybeSingle();

      if (!license) {
        return NextResponse.json({ success: false, message: 'Invalid license key' });
      }

      // Check if application is paused by admin
      const appMeta = parseProductMeta(license.products);
      if (appMeta && appMeta.paused) {
        return NextResponse.json({ success: false, message: 'Application is currently paused by admin.' });
      }

      if (license.status === 'banned') {
        return NextResponse.json({ success: false, message: 'Key has been banned' });
      }

      const now = new Date();

      // Check if expired
      if (license.status === 'expired' || (license.expires_at && new Date(license.expires_at) < now)) {
        if (license.status !== 'expired') {
          await supabaseAdmin.from('licenses').update({ status: 'expired' }).eq('id', license.id);
        }
        return NextResponse.json({ success: false, message: 'Key has expired' });
      }

      // A. UNUSED KEY -> First time activation
      if (license.status === 'unused') {
        let updatedExpiresAt = null;
        if (license.duration_days > 0) {
          updatedExpiresAt = new Date(now.getTime() + license.duration_days * 24 * 60 * 60 * 1000).toISOString();
        }
        await supabaseAdmin.from('licenses').update({
          status: 'active',
          activated_at: now.toISOString(),
          expires_at: updatedExpiresAt,
          updated_at: now.toISOString(),
        }).eq('id', license.id);

        if (hwid) {
          await supabaseAdmin.from('license_devices').insert([{
            license_id: license.id,
            hwid,
            ip_address: ip,
            first_used_at: now.toISOString(),
            last_used_at: now.toISOString(),
          }]);
        }

        await logActivity('KEYAUTH_ACTIVATED', `Key activated via KeyAuth loader: ${key}`, {
          hwid,
          product: license.product_id,
        }, ip);

        return NextResponse.json({
          success: true,
          message: 'Logged in successfully',
          info: {
            username: key,
            subscriptions: [{
              subscription: license.product_id || 'Default',
              key: key,
              expiry: updatedExpiresAt ? Math.floor(new Date(updatedExpiresAt).getTime() / 1000) : 'Lifetime',
            }],
          },
        });
      }

      // B. ACTIVE KEY -> HWID Verification & Re-binding if HWID was reset
      const { data: devices } = await supabaseAdmin
        .from('license_devices')
        .select('*')
        .eq('license_id', license.id);

      const currentDevices = devices || [];
      const matchedDevice = currentDevices.find((d) => d.hwid === hwid);

      if (matchedDevice) {
        // Same registered PC: update last_used_at & IP
        await supabaseAdmin
          .from('license_devices')
          .update({
            last_used_at: now.toISOString(),
            ip_address: ip,
          })
          .eq('id', matchedDevice.id);
      } else {
        // HWID not registered yet
        const maxDevices = license.max_devices || 1;
        if (currentDevices.length >= maxDevices) {
          // Already bound to other device(s)
          await logActivity('KEYAUTH_HWID_MISMATCH', `HWID mismatch on KeyAuth login: ${key}`, {
            hwid,
            maxDevices,
          }, ip);

          return NextResponse.json({
            success: false,
            message: 'HWID mismatch! Key is registered to another device. Hubungi admin untuk reset HWID.',
          });
        }

        // HWID was reset (currentDevices.length < maxDevices) -> Re-bind this new HWID!
        if (hwid) {
          await supabaseAdmin.from('license_devices').insert([{
            license_id: license.id,
            hwid,
            ip_address: ip,
            first_used_at: now.toISOString(),
            last_used_at: now.toISOString(),
          }]);

          await logActivity('KEYAUTH_HWID_REBOUND', `Key rebound to new HWID: ${key}`, {
            hwid,
          }, ip);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Logged in successfully',
        info: {
          username: key,
          subscriptions: [{
            subscription: license.product_id || 'Default',
            key: key,
            expiry: license.expires_at ? Math.floor(new Date(license.expires_at).getTime() / 1000) : 'Lifetime',
          }],
        },
      });
    }

    // Handle CHECK request
    if (type === 'check') {
      return NextResponse.json({ success: true, message: 'Session is valid' });
    }

    return NextResponse.json({ success: true, message: 'OK' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  return POST(req);
}
