import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ForgotPasswordForm } from '@/components/auth-forms';
import { SiteHeader } from '@/components/site-header';
import { Eyebrow } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';
import { dataMode } from '@/lib/data';
import { DEMO_HOST } from '@/lib/data/memory-store';

export const metadata: Metadata = { title: 'Forgot password' };

export default async function ForgotPasswordPage() {
  if (await getSessionUser()) redirect('/dashboard');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-20 sm:px-6">
        <div className="mt-12 rounded-2xl border border-sand bg-card p-6 sm:p-8">
          <Eyebrow>Hosts</Eyebrow>
          <h1 className="font-display mt-3 text-2xl text-ink">Reset your password</h1>
          <p className="mt-1 mb-6 text-sm text-ink-soft">
            Enter your email and we&rsquo;ll send you a link to set a new one.
          </p>
          {dataMode() === 'memory' ? (
            <p className="rounded-xl bg-shell/60 px-4 py-3 text-sm leading-relaxed text-ink-soft">
              Password reset emails need the Supabase setup. In demo mode, sign in with{' '}
              <span className="font-mono font-semibold">{DEMO_HOST.email}</span> /{' '}
              <span className="font-mono font-semibold">{DEMO_HOST.password}</span>.
            </p>
          ) : (
            <ForgotPasswordForm />
          )}
        </div>
      </main>
    </>
  );
}
