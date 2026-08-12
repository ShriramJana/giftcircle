'use server';

import { redirect } from 'next/navigation';
import { signInHost, signOutHost, signUpHost } from '@/lib/auth';
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

export async function signOutAction(): Promise<void> {
  await signOutHost();
  redirect('/');
}
