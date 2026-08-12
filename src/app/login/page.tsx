import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth-forms';
import { SiteHeader } from '@/components/site-header';
import { Eyebrow } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';
import { dataMode } from '@/lib/data';
import { DEMO_HOST } from '@/lib/data/memory-store';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await getSessionUser()) redirect('/dashboard');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-20 sm:px-6">
        <div className="mt-12 rounded-2xl border border-sand bg-card p-6 sm:p-8">
          <Eyebrow>Hosts</Eyebrow>
          <h1 className="font-display mt-3 text-2xl text-ink">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-ink-soft">
            Sign in to manage your events and gift lists.
          </p>
          <SignInForm />
        </div>
        {dataMode() === 'memory' ? (
          <p className="mt-4 rounded-xl bg-shell/60 px-4 py-3 text-center text-xs leading-relaxed text-ink-soft">
            Running without Supabase. Use the demo host:{' '}
            <span className="font-mono font-semibold">{DEMO_HOST.email}</span> /{' '}
            <span className="font-mono font-semibold">{DEMO_HOST.password}</span>
          </p>
        ) : null}
      </main>
    </>
  );
}
