import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export type SupabaseBrowserClient = SupabaseClient<Database>;

let browserClient: SupabaseBrowserClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseBrowserClient(): SupabaseBrowserClient | null {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        persistSession: true,
      },
    });
  }

  return browserClient;
}
