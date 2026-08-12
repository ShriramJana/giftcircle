'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signInAction, signUpAction, type AuthFormState } from '@/app/(auth)/actions';
import { Button, Field, FormMessage, Input } from './ui';

const IDLE: AuthFormState = { status: 'idle' };

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, IDLE);

  return (
    <form action={action} className="space-y-4">
      <Field label="Email" htmlFor="signin-email" error={state.fieldErrors?.email}>
        <Input id="signin-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="signin-password" error={state.fieldErrors?.password}>
        <Input
          id="signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <FormMessage status={state.status === 'error' ? 'error' : null} message={state.message} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        New here?{' '}
        <Link href="/signup" className="font-semibold text-clay hover:underline">
          Create a host account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, IDLE);

  return (
    <form action={action} className="space-y-4">
      <Field label="Your name" htmlFor="signup-name" error={state.fieldErrors?.displayName}>
        <Input id="signup-name" name="displayName" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="signup-email" error={state.fieldErrors?.email}>
        <Input id="signup-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label="Password"
        htmlFor="signup-password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters."
      >
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      <FormMessage
        status={state.status === 'error' ? 'error' : state.status === 'info' ? 'success' : null}
        message={state.message}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        Already hosting?{' '}
        <Link href="/login" className="font-semibold text-clay hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
