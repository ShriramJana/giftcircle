import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { Eyebrow } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';
import { getStore } from '@/lib/data';
import { formatShortDate } from '@/lib/format';
import { EVENT_TYPE_LABELS } from '@/lib/types';

export const metadata: Metadata = { title: 'Your events' };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const events = await getStore().listHostEvents(user.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Your events</Eyebrow>
            <h1 className="font-display mt-2 text-3xl text-ink">
              Hello, {user.displayName || 'host'}
            </h1>
          </div>
          <Link
            href="/events/new"
            className="inline-flex items-center rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-card hover:bg-clay-deep"
          >
            + New event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-sand bg-card/60 px-6 py-16 text-center">
            <p className="font-display text-xl text-ink">No events yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              Create your first event to get an invitation page with a gift registry you can share
              with one link.
            </p>
            <Link
              href="/events/new"
              className="mt-6 inline-flex items-center rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-card hover:bg-clay-deep"
            >
              Create your first event
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="block rounded-2xl border border-sand bg-card p-5 transition-colors hover:border-clay/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold tracking-[0.14em] uppercase text-clay">
                        {EVENT_TYPE_LABELS[event.event_type]}
                        {event.visibility_mode === 'surprise_host' ? ' · surprise mode' : ''}
                      </p>
                      <h2 className="font-display mt-1 text-xl text-ink">{event.title}</h2>
                      <p className="mt-1 text-sm text-ink-soft">
                        {formatShortDate(event.event_date)} · {event.location}
                      </p>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <p className="font-display text-2xl text-clay">{event.gift_count}</p>
                        <p className="text-xs text-ink-soft">gifts</p>
                      </div>
                      <div>
                        <p className="font-display text-2xl text-clay">{event.reservation_count}</p>
                        <p className="text-xs text-ink-soft">reservations</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
