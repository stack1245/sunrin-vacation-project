export interface SupabasePublicEnvironment {
  url?: string;
  publishableKey?: string;
  legacyAnonKey?: string;
}

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

function normalizeEnvironmentValue(value: string | undefined): string | null {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export function resolveSupabasePublicConfig(
  environment: SupabasePublicEnvironment,
): SupabasePublicConfig | null {
  const url = normalizeEnvironmentValue(environment.url);
  const publishableKey =
    normalizeEnvironmentValue(environment.publishableKey) ??
    normalizeEnvironmentValue(environment.legacyAnonKey);

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function readSupabasePublicConfig(): SupabasePublicConfig | null {
  return resolveSupabasePublicConfig({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    legacyAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
