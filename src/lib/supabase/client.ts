import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const url = supabaseUrl || 'http://localhost:54321';
  const key = supabaseAnon || 'anon-key';
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
  return client;
}
