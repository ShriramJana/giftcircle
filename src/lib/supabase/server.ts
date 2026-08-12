import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = supabaseEnv();
  return Boolean(url && key);
}

/**
 * Request-scoped Supabase client carrying the caller's session cookie, so
 * every query runs under RLS as that user (or anon).
 */
export async function createSupabaseServerClient() {
  const { url, key } = supabaseEnv();
  if (!url || !key) throw new Error('Supabase environment variables are not set');
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component; middleware refreshes sessions.
        }
      },
    },
  });
}
