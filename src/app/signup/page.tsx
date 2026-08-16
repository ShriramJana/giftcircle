import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth-forms';
import { AuthDivider, GoogleSignInButton } from '@/components/google-signin-button';
import { SiteHeader } from '@/components/site-header';
import { Eyebrow } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';
import { dataMode } from '@/lib/data';

export const metadata: Metadata = { title: 'Create an account' };

export default async function SignUpPage() {
  if (await getSessionUser()) redirect('/dashboard');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-20 sm:px-6">
        <div className="mt-12 rounded-2xl border border-sand bg-card p-6 sm:p-8">
          <Eyebrow>Hosts</Eyebrow>
          <h1 className="font-display mt-3 text-2xl text-ink">Host your first event</h1>
          <p className="mt-1 mb-6 text-sm text-ink-soft">
            Create an account to send invitations with a built-in gift registry. Your guests will
            never need one.
          </p>
          {dataMode() === 'supabase' ? (
            <div className="mb-5 space-y-5">
              <GoogleSignInButton />
              <AuthDivider label="or create with email" />
            </div>
          ) : null}
          <SignUpForm />
        </div>
      </main>
    </>
  );
}
