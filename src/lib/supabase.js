import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Backend Supabase client using Service Role / Secret key (Bypasses RLS safely on server)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Public client for client-side components if needed
 */
export const supabaseClient = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
