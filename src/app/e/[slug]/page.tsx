import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GiftCard } from '@/components/gift-card';
import { InvitationCard } from '@/components/invitation-card';
import { Reveal } from '@/components/reveal';
import { backgroundOf } from '@/lib/backgrounds';
import { getStore } from '@/lib/data';
import { formatEventDate } from '@/lib/format';

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
  const bg = backgroundOf(event.background);
  const dark = bg?.tone === 'dark';

  return (
    <div style={bg ? { background: bg.css } : undefined} className="min-h-screen">
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        {/* Invitation card */}
        <div className="rise-in">
          <InvitationCard event={event} />
        </div>

        {/* Registry */}
        <section aria-labelledby="registry-title" className="rise-in-late mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="registry-title" className={`font-display text-2xl ${dark ? 'text-[#FBF6ED]' : 'text-ink'}`}>
                The gift list
              </h2>
              <p className={`mt-1 text-sm ${dark ? 'text-[#F3E9DB]' : 'text-ink-soft'}`}>
                {event.visibility_mode === 'surprise_host'
                  ? 'Reserve freely. The host sees only quantities, never names, until the event day.'
                  : 'Reserve a gift and everyone can see who is bringing what.'}
              </p>
            </div>
            <p className={`text-xs ${dark ? 'text-[#E9DCC9]' : 'text-ink-faint'}`}>
              No account needed, just your name and email.
            </p>
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

        <footer className={`mt-16 text-center text-xs ${dark ? 'text-[#E9DCC9]' : 'text-ink-faint'}`}>
          <p>
            Made with{' '}
            <Link
              href="/"
              className={`font-semibold hover:underline ${dark ? 'text-butter' : 'text-clay'}`}
            >
              GiftCircle
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
