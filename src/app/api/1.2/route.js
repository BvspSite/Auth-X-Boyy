import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity } from '@/lib/supabase';
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

      // Forward to activation logic
      const { data: license } = await supabaseAdmin
        .from('licenses')
        .select('*, products(id, name)')
        .eq('license_key', key)
        .maybeSingle();

      if (!license) {
        return NextResponse.json({ success: false, message: 'Invalid license key' });
      }

      if (license.status === 'banned') {
        return NextResponse.json({ success: false, message: 'Key has been banned' });
      }

      const now = new Date();
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
          }]);
        }

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
