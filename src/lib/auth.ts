import 'server-only';
import { cookies } from 'next/headers';
import { dataMode } from './data';
import { getMemoryStore } from './data/memory-store';
import { createSupabaseServerClient } from './supabase/server';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export type AuthResult = { ok: true; message?: string } | { ok: false; message: string };

/**
 * Host authentication. Supabase Auth in supabase mode; in credential-free
 * memory mode, a plain demo-session cookie against the seeded fixture users
 * (development convenience only — documented in the README).
 */

const DEMO_COOKIE = 'gc_demo_session';

export async function getSessionUser(): Promise<SessionUser | null> {
  if (dataMode() === 'memory') {
    const cookieStore = await cookies();
    const userId = cookieStore.get(DEMO_COOKIE)?.value;
    if (!userId) return null;
    const user = getMemoryStore().getUserById(userId);
    if (!user) return null;
    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? '',
    displayName:
      (meta.display_name as string | undefined) ??
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      user.email ??
      'Host',
  };
}

export async function signUpHost(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  if (dataMode() === 'memory') {
    const store = getMemoryStore();
    const created = store.createUser(email, password, displayName);
    if (!created.ok) return { ok: false, message: 'An account with that email already exists.' };
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE, created.data.id, { httpOnly: true, sameSite: 'lax', path: '/' });
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) return { ok: false, message: error.message };
  if (!data.session) {
    return { ok: true, message: 'Check your email to confirm your account, then sign in.' };
  }
  return { ok: true };
}

export async function signInHost(email: string, password: string): Promise<AuthResult> {
  if (dataMode() === 'memory') {
    const store = getMemoryStore();
    const user = store.findUserByEmail(email);
    if (!user || !store.verifyPassword(user, password)) {
      return { ok: false, message: 'Email or password is incorrect.' };
    }
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE, user.id, { httpOnly: true, sameSite: 'lax', path: '/' });
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: 'Email or password is incorrect.' };
  return { ok: true };
}

export async function signOutHost(): Promise<void> {
  if (dataMode() === 'memory') {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_COOKIE);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
