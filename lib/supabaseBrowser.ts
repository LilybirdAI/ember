import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedSupabaseBrowser: SupabaseClient | null = null;

function getSupabaseBrowserEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

export function getSupabaseBrowser() {
  if (cachedSupabaseBrowser) {
    return cachedSupabaseBrowser;
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseBrowserEnv();

  cachedSupabaseBrowser = createClient(supabaseUrl, supabasePublishableKey);

  return cachedSupabaseBrowser;
}

export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseBrowser() as any;
    const value = client[prop as keyof SupabaseClient];

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
