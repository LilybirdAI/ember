import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedSupabaseAdmin: SupabaseClient | null = null;

function getSupabaseEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }

  if (!supabaseSecretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    supabaseUrl,
    supabaseSecretKey,
  };
}

export function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) {
    return cachedSupabaseAdmin;
  }

  const { supabaseUrl, supabaseSecretKey } = getSupabaseEnv();

  cachedSupabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedSupabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin() as any;
    const value = client[prop as keyof SupabaseClient];

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
