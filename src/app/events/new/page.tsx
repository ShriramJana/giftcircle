import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EventForm } from '@/components/event-form';
import { SiteHeader } from '@/components/site-header';
import { Eyebrow } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'New event' };

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <header className="mt-10">
          <Eyebrow>New event</Eyebrow>
          <h1 className="font-display mt-2 text-3xl text-ink">Set up your invitation</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            This becomes a shareable page with your invitation on top and the gift registry
            below. You&rsquo;ll add gifts in the next step.
          </p>
        </header>
        <div className="mt-8 rounded-2xl border border-sand bg-card p-6 sm:p-8">
          <EventForm />
        </div>
      </main>
    </>
  );
}
