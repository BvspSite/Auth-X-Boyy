import { NextResponse } from 'next/server';
import { supabaseAdmin, logActivity, parseProductMeta } from '@/lib/supabase';
import { getClientIp } from '@/lib/auth';

/**
 * Mask generator supporting KeyAuth mask character modes:
 * character 1: uppercase alphanumeric
 * character 2: lowercase alphanumeric
 * character 3: digits only
 * character 4: uppercase letters only
 */
function generateKeyFromMask(mask = '******-******-******-******-******-******', charType = 1) {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const c = parseInt(charType || '1', 10);
  if (c === 2) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  else if (c === 3) chars = '0123456789';
  else if (c === 4) chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return mask.replace(/\*/g, () => chars[Math.floor(Math.random() * chars.length)]);
}

/**
 * Helper to extract parameters from GET query or POST JSON/form
 */
async function parseSellerParams(req) {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  let bodyParams = {};
  if (req.method === 'POST') {
    try {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        bodyParams = await req.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        bodyParams = Object.fromEntries(formData.entries());
      }
    } catch {}
  }

  return { ...queryParams, ...bodyParams };
}

async function handleSellerRequest(req) {
  const ip = getClientIp(req);
  const params = await parseSellerParams(req);

  const sellerKey = (params.sellerkey || params.seller_key || '').trim();
  const type = (params.type || 'add').toLowerCase();
  const format = (params.format || 'json').toLowerCase();

  const sendResponse = (data, status = 200) => {
    if (format === 'text') {
      if (!data.success) {
        return new Response(data.message || 'Error', {
          status,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      const textOutput = data.keys && data.keys.length > 0
        ? data.keys.join('\n')
        : (data.key || data.message || 'SUCCESS');
      return new Response(textOutput, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json(data, { status });
  };

  if (!sellerKey) {
    return sendResponse({ success: false, message: 'Seller key is missing.' }, 400);
  }

  // 1. Find product matching seller_key
  const { data: allProducts, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('*');

  if (prodErr || !allProducts) {
    return sendResponse({ success: false, message: 'Database error reading applications.' }, 500);
  }

  let matchedProduct = null;
  for (const p of allProducts) {
    const meta = parseProductMeta(p);
    if (meta.seller_key && meta.seller_key.toLowerCase() === sellerKey.toLowerCase()) {
      matchedProduct = meta;
      break;
    }
  }

  if (!matchedProduct) {
    return sendResponse({ success: false, message: 'Invalid seller key.' }, 403);
  }

  if (matchedProduct.paused) {
    return sendResponse({ success: false, message: 'Application is currently paused by admin.' }, 403);
  }

  // 2. Action: ADD / CREATE LICENSES
  if (type === 'add' || type === 'create') {
    const amount = Math.min(Math.max(parseInt(params.amount || '1', 10), 1), 50);
    const expiry = parseInt(params.expiry ?? '30', 10);
    const mask = params.mask || '******-******-******-******-******-******';
    const character = parseInt(params.character || '1', 10);
    const note = params.note || `Seller API (${matchedProduct.name})`;

    const newLicenses = [];
    const createdKeys = [];

    for (let i = 0; i < amount; i++) {
      const key = generateKeyFromMask(mask, character);
      createdKeys.push(key);
      newLicenses.push({
        product_id: matchedProduct.id,
        license_key: key,
        duration_days: expiry,
        status: 'unused',
        max_devices: 1,
        note: note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const { error: insErr } = await supabaseAdmin
      .from('licenses')
      .insert(newLicenses);

    if (insErr) {
      console.error('[SELLER_ADD_ERROR]', insErr);
      return sendResponse({ success: false, message: 'Failed to insert licenses.' }, 500);
    }

    await logActivity('SELLER_API_GENERATE', `Seller generated ${amount} key(s) for ${matchedProduct.name}`, {
      app_id: matchedProduct.id,
      amount,
      expiry,
      keys: createdKeys,
    }, ip);

    return sendResponse({
      success: true,
      message: `Successfully created ${amount} license(s)`,
      key: createdKeys[0],
      keys: createdKeys,
      app: matchedProduct.name,
    });
  }

  // 3. Action: DEL / DELETE LICENSE
  if (type === 'del' || type === 'delete') {
    const key = (params.key || '').trim();
    if (!key) {
      return sendResponse({ success: false, message: 'License key is required.' }, 400);
    }

    const { data: lic } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('product_id', matchedProduct.id)
      .eq('license_key', key)
      .maybeSingle();

    if (!lic) {
      return sendResponse({ success: false, message: 'License key not found.' }, 404);
    }

    await supabaseAdmin.from('licenses').delete().eq('id', lic.id);

    await logActivity('SELLER_API_DELETE', `Seller deleted key: ${key}`, { app_id: matchedProduct.id }, ip);

    return sendResponse({ success: true, message: 'Successfully deleted license.' });
  }

  // 4. Action: RESET HWID
  if (type === 'resetuser' || type === 'resethwid') {
    const key = (params.key || '').trim();
    if (!key) {
      return sendResponse({ success: false, message: 'License key is required.' }, 400);
    }

    const { data: lic } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('product_id', matchedProduct.id)
      .eq('license_key', key)
      .maybeSingle();

    if (!lic) {
      return sendResponse({ success: false, message: 'License key not found.' }, 404);
    }

    await supabaseAdmin.from('license_devices').delete().eq('license_id', lic.id);

    await logActivity('SELLER_API_HWID_RESET', `Seller reset HWID for key: ${key}`, { app_id: matchedProduct.id }, ip);

    return sendResponse({ success: true, message: 'Successfully reset HWID.' });
  }

  // 5. Action: VERIFY LICENSE
  if (type === 'verify') {
    const key = (params.key || '').trim();
    if (!key) {
      return sendResponse({ success: false, message: 'License key is required.' }, 400);
    }

    const { data: lic } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('product_id', matchedProduct.id)
      .eq('license_key', key)
      .maybeSingle();

    if (!lic) {
      return sendResponse({ success: false, message: 'License key not found.' }, 404);
    }

    return sendResponse({
      success: true,
      message: 'License found',
      license: {
        key: lic.license_key,
        status: lic.status,
        duration_days: lic.duration_days,
        expires_at: lic.expires_at,
        created_at: lic.created_at,
      },
    });
  }

  // 6. Action: STATS
  if (type === 'stats') {
    const { data: licList } = await supabaseAdmin
      .from('licenses')
      .select('status')
      .eq('product_id', matchedProduct.id);

    const total = (licList || []).length;
    const active = (licList || []).filter((l) => l.status === 'active').length;
    const unused = (licList || []).filter((l) => l.status === 'unused').length;
    const banned = (licList || []).filter((l) => l.status === 'banned').length;
    const expired = (licList || []).filter((l) => l.status === 'expired').length;

    return sendResponse({
      success: true,
      app: matchedProduct.name,
      total,
      active,
      unused,
      banned,
      expired,
    });
  }

  return sendResponse({ success: false, message: `Unknown type action: ${type}` }, 400);
}

export async function GET(req) {
  return handleSellerRequest(req);
}

export async function POST(req) {
  return handleSellerRequest(req);
}
