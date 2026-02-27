import { createServerSupabase } from '$lib/supabase/server';

export async function requireUser() {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return null;
  }
  return data.user;
}
