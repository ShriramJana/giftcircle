import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth-forms';
import { SiteHeader } from '@/components/site-header';
import { Eyebrow } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Set a new password' };

/** Landed on from the emailed reset link, which signs the user in first. */
export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect('/forgot-password');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-20 sm:px-6">
        <div className="mt-12 rounded-2xl border border-sand bg-card p-6 sm:p-8">
          <Eyebrow>Hosts</Eyebrow>
          <h1 className="font-display mt-3 text-2xl text-ink">Set a new password</h1>
          <p className="mt-1 mb-6 text-sm text-ink-soft">
            You&rsquo;re signed in as {user.email}. Choose a new password below.
          </p>
          <ResetPasswordForm />
        </div>
      </main>
    </>
  );
}
