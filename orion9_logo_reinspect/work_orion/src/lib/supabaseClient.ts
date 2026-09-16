import { createClient, SupabaseClient } from '@supabase/supabase-js';

// TEMPORARY LOCAL AUTH MODE — replace with Supabase/enterprise IdP before production.
// admin / admin is development-only and must be replaced before production deployment.

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase configuration missing or invalid. Falling back to local mode.');
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
};
