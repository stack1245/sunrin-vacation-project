import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicConfig } from "@/config/supabasePublicConfig";
import type { Database } from "@/types/database";

const supabasePublicConfig = readSupabasePublicConfig();

export type SupabaseBrowserClient = SupabaseClient<Database>;

let cachedSupabaseBrowserClient: SupabaseBrowserClient | null = null;

export function isSupabaseConfigured(): boolean {
  return supabasePublicConfig !== null;
}

export function getSupabaseBrowserClient(): SupabaseBrowserClient | null {
  if (!supabasePublicConfig) {
    return null;
  }

  if (!cachedSupabaseBrowserClient) {
    cachedSupabaseBrowserClient = createClient<Database>(
      supabasePublicConfig.url,
      supabasePublicConfig.publishableKey,
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
