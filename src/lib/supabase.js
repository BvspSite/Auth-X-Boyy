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
