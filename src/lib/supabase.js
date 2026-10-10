import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://hsxczuqxruswiaxemboz.supabase.co';
const PLACEHOLDER_KEY = 'sb_build_placeholder_key_not_for_runtime';

function createAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function createPublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
  return createClient(url, key);
}

let _adminClient = null;
export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    if (!_adminClient) {
      _adminClient = createAdmin();
    }
    const val = _adminClient[prop];
    return typeof val === 'function' ? val.bind(_adminClient) : val;
  },
});

let _publicClient = null;
export const supabaseClient = new Proxy({}, {
  get(target, prop) {
    if (!_publicClient) {
      _publicClient = createPublic();
    }
    const val = _publicClient[prop];
    return typeof val === 'function' ? val.bind(_publicClient) : val;
  },
});

/**
 * Log action into activity_logs table
 */
export async function logActivity(action, description, details = {}, ip = '127.0.0.1') {
  try {
    await supabaseAdmin.from('activity_logs').insert([
      {
        action,
        description,
        details,
        ip_address: ip,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error('[ACTIVITY_LOG_ERROR]', err);
  }
}

/**
 * Parses product metadata stored in description column
 */
export function parseProductMeta(product) {
  if (!product) return null;
  let meta = {
    desc: '',
    secret: '',
    seller_key: '',
    paused: false,
    version: '1.0',
  };

  const raw = product.description || '';
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      meta = { ...meta, ...parsed };
    } catch {
      meta.desc = raw;
    }
  } else {
    meta.desc = raw;
  }

  // Ensure deterministic fallback if not yet assigned
  if (!meta.secret) {
    const id = product.id || 'default_app';
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    meta.secret = `${hex}f4135dea2fc09ad383eaae4762eece4de`.slice(0, 32);
  }

  if (!meta.seller_key) {
    const id = product.id || 'default_seller';
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 7) - hash + id.charCodeAt(i)) | 0;
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    meta.seller_key = `${hex}896c1e9e30cfc98bc59ff1`.slice(0, 32);
  }

  return {
    ...product,
    description: meta.desc,
    secret: meta.secret,
    seller_key: meta.seller_key,
    paused: Boolean(meta.paused),
    version: meta.version || '1.0',
    metaRaw: meta,
  };
}

/**
 * Serializes product metadata into JSON string for description column
 */
export function serializeProductMeta({ desc = '', secret = '', seller_key = '', paused = false, version = '1.0' }) {
  return JSON.stringify({
    desc: desc || '',
    secret: secret || '',
    seller_key: seller_key || '',
    paused: Boolean(paused),
    version: version || '1.0',
  });
}
