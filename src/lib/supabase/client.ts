import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicConfig } from "@/config/supabasePublicConfig";

const SUPABASE_PUBLIC_CONFIG = readSupabasePublicConfig();

export type SupabaseBrowserClient = SupabaseClient;

let cachedSupabaseBrowserClient: SupabaseBrowserClient | null = null;

export function isSupabaseConfigured(): boolean {
  return SUPABASE_PUBLIC_CONFIG !== null;
}

export function getSupabaseBrowserClient(): SupabaseBrowserClient | null {
  if (!SUPABASE_PUBLIC_CONFIG) {
    return null;
  }

  if (!cachedSupabaseBrowserClient) {
    cachedSupabaseBrowserClient = createClient(
      SUPABASE_PUBLIC_CONFIG.url,
      SUPABASE_PUBLIC_CONFIG.publishableKey,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: "pkce",
          persistSession: true,
        },
      },
    );
  }

  return cachedSupabaseBrowserClient;
}
