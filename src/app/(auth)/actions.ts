'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInHost, signOutHost, signUpHost } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fieldErrorsOf, signInSchema, signUpSchema } from '@/lib/validation';
import type { FieldErrors } from '@/lib/validation';

export interface AuthFormState {
  status: 'idle' | 'error' | 'info';
  message?: string;
  fieldErrors?: FieldErrors;
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const result = await signUpHost(parsed.data.email, parsed.data.password, parsed.data.displayName);
  if (!result.ok) return { status: 'error', message: result.message };
  if (result.message) return { status: 'info', message: result.message };
  redirect('/dashboard');
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const result = await signInHost(parsed.data.email, parsed.data.password);
  if (!result.ok) return { status: 'error', message: result.message };
  redirect('/dashboard');
}

export async function signInWithGoogleAction(): Promise<void> {
  const headerList = await headers();
  const origin =
    headerList.get('origin') ??
    `https://${headerList.get('x-forwarded-host') ?? headerList.get('host') ?? ''}`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data?.url) redirect('/login?error=oauth');
  redirect(data.url);
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }

  const headerList = await headers();
  const origin =
    headerList.get('origin') ??
    `https://${headerList.get('x-forwarded-host') ?? headerList.get('host') ?? ''}`;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  // Same reply either way, so the form can't be used to probe for accounts.
  return {
    status: 'info',
    message: 'If that email has an account, a reset link is on its way. Check your inbox.',
  };
}

export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8 || password.length > 72) {
    return { status: 'error', message: 'Password must be at least 8 characters.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: 'error', message: 'Could not update the password. Request a new reset link.' };
  }
  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  await signOutHost();
  redirect('/');
}
