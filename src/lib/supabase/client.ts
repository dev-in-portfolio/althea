import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key';
  client = createClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
  return client;
}
