import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GiftCard } from '@/components/gift-card';
import { Reveal } from '@/components/reveal';
import { Eyebrow } from '@/components/ui';
import { getStore } from '@/lib/data';
import { formatEventDate } from '@/lib/format';
import { EVENT_TYPE_LABELS } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const registry = await getStore().getRegistryBySlug(slug);
  if (!registry) return { title: 'Invitation not found' };
  return {
    title: registry.event.title,
    description: `You're invited! ${formatEventDate(registry.event.event_date)} at ${registry.event.location}. Browse the gift registry.`,
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const registry = await getStore().getRegistryBySlug(slug);
  if (!registry) notFound();

  const { event, gifts } = registry;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
      {/* Invitation card */}
      <section
        aria-labelledby="event-title"
        className="rise-in ticket-edge mx-auto mt-8 max-w-2xl bg-card px-6 pb-12 pt-10 text-center shadow-[0_2px_16px_rgba(58,46,37,0.08)] sm:px-12"
      >
        <Eyebrow>{EVENT_TYPE_LABELS[event.event_type]} · You&rsquo;re invited</Eyebrow>
        <h1 id="event-title" className="font-display mt-4 text-3xl leading-tight text-ink sm:text-4xl">
          {event.title}
        </h1>
        <p className="mt-3 text-sm font-semibold tracking-wide text-clay">
          Hosted by {event.host_name}
        </p>
        <dl className="mt-5 space-y-1 text-sm text-ink-soft">
          <div>
            <dt className="sr-only">Date</dt>
            <dd className="font-semibold text-ink">{formatEventDate(event.event_date)}</dd>
          </div>
          <div>
            <dt className="sr-only">Location</dt>
            <dd>{event.location}</dd>
          </div>
        </dl>
        {event.message ? (
          <p className="mx-auto mt-6 max-w-prose border-t border-sand pt-6 text-left text-[15px] leading-relaxed text-ink-soft">
            {event.message}
          </p>
        ) : null}
      </section>

      {/* Registry */}
      <section aria-labelledby="registry-title" className="rise-in-late mt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="registry-title" className="font-display text-2xl text-ink">
              The gift list
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {event.visibility_mode === 'surprise_host'
                ? 'Reserve freely. The host sees only quantities, never names, until the event day.'
                : 'Reserve a gift and everyone can see who is bringing what.'}
            </p>
          </div>
          <p className="text-xs text-ink-faint">No account needed, just your name and email.</p>
        </div>

        {gifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand bg-card/60 px-6 py-16 text-center">
            <p className="font-display text-lg text-ink">The gift list is still being wrapped.</p>
            <p className="mt-2 text-sm text-ink-soft">
              The host hasn&rsquo;t added gifts yet. Check back soon.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift, index) => (
              <li key={gift.id} className="flex">
                <Reveal delay={Math.min(index, 5) * 70} className="flex w-full">
                  <div className="flex w-full">
                    <GiftCard gift={gift} slug={event.slug} />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-16 text-center text-xs text-ink-faint">
        <p>
          Made with <Link href="/" className="font-semibold text-clay hover:underline">GiftCircle</Link>
        </p>
      </footer>
    </main>
  );
}
