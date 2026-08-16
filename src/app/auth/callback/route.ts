import { NextResponse } from 'next/server';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

/** OAuth return leg: exchange the provider's code for a session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // Optional post-auth destination (e.g. /reset-password); same-origin only.
  const next = url.searchParams.get('next');
  const destination = next && /^\/[a-z0-9\-/]*$/i.test(next) ? next : '/dashboard';
  return NextResponse.redirect(new URL(error ? '/login?error=oauth' : destination, url.origin));
}
