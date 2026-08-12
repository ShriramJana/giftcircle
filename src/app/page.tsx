import Link from 'next/link';
import { GiftCard } from '@/components/gift-card';
import { SiteHeader } from '@/components/site-header';
import { QuantityTicks } from '@/components/quantity-ticks';
import { Eyebrow } from '@/components/ui';
import { getStore } from '@/lib/data';
import { SEED_SHOWER_SLUG, SEED_WEDDING_SLUG } from '@/lib/data/memory-store';
import type { RegistryPayload } from '@/lib/types';

/** A miniature themed invitation card for the showcase strip. */
function MiniInvite({
  eyebrow,
  title,
  detail,
  band,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  band: 'shell' | 'butter' | 'leaf' | 'ink';
  href: string;
  cta: string;
}) {
  const bandStyles = {
    shell: { wrap: 'bg-shell', eyebrow: 'text-clay', title: 'text-ink' },
    butter: { wrap: 'bg-butter/45', eyebrow: 'text-clay', title: 'text-ink' },
    leaf: { wrap: 'bg-leaf-tint', eyebrow: 'text-leaf', title: 'text-ink' },
    ink: { wrap: 'bg-ink', eyebrow: 'text-butter', title: 'text-card' },
  }[band];

  return (
    <Link
      href={href}
      className="ticket-edge flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-t-2xl bg-card pb-6 shadow-[0_2px_12px_rgba(58,46,37,0.1)] transition-transform hover:-translate-y-1"
    >
      <div className={`${bandStyles.wrap} px-5 pb-5 pt-4 text-center`}>
        <p className={`text-[10px] font-bold tracking-[0.18em] uppercase ${bandStyles.eyebrow}`}>
          {eyebrow}
        </p>
        <p className={`font-display mt-2 text-lg leading-snug ${bandStyles.title}`}>{title}</p>
      </div>
      <div className="px-5 pt-4 text-center">
        <p className="text-xs text-ink-soft">{detail}</p>
        <span className="mt-3 inline-flex rounded-full bg-clay px-4 py-1.5 text-xs font-semibold text-card">
          {cta}
        </span>
      </div>
    </Link>
  );
}

export default async function LandingPage() {
  let registry: RegistryPayload | null = null;
  try {
    registry = await getStore().getRegistryBySlug(SEED_WEDDING_SLUG);
  } catch {
    // No sample event available; the live section hides itself.
  }
  const sampleGifts = registry?.gifts.filter((g) => g.image_url).slice(0, 3) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        {/* Hero */}
        <section className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Invitations + registry, one link</Eyebrow>
            <h1 className="font-display mt-4 text-4xl leading-[1.1] text-ink sm:text-5xl">
              The invitation that carries the gift list.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Send one beautiful link for the wedding, the shower, the big birthday. Guests read
              the invitation, pick a gift, and reserve it in seconds. No accounts, no
              spreadsheets, no duplicate toasters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-clay px-6 py-3 text-sm font-semibold text-card hover:bg-clay-deep"
              >
                Host an event
              </Link>
              <Link
                href={`/e/${SEED_WEDDING_SLUG}`}
                className="inline-flex items-center rounded-full border border-clay/30 bg-card px-6 py-3 text-sm font-semibold text-clay hover:border-clay/60"
              >
                See a sample registry
              </Link>
            </div>
          </div>

          <div aria-hidden className="rise-in-late">
            <div className="ticket-edge mx-auto max-w-sm rotate-1 bg-card px-8 pb-10 pt-8 text-center shadow-[0_8px_30px_rgba(58,46,37,0.12)]">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-clay">
                Wedding · You&rsquo;re invited
              </p>
              <p className="font-display mt-3 text-2xl leading-snug text-ink">
                Maya &amp; Jordan are getting married
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Saturday, November 14 · Hollis Farm, Petaluma
              </p>
              <div className="mt-6 rounded-xl border border-sand bg-paper p-4 text-left">
                <p className="text-sm font-semibold text-ink">Stoneware dinner plates</p>
                <div className="mt-2">
                  <QuantityTicks requested={8} claimed={4} isUnlimited={false} />
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  Amara is bringing 4, and four are still up for grabs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live registry sample */}
        {sampleGifts.length > 0 && registry ? (
          <section aria-labelledby="live-title" className="mt-24">
            <div className="text-center">
              <Eyebrow>Straight from a real registry</Eyebrow>
              <h2 id="live-title" className="font-display mt-3 text-2xl text-ink sm:text-3xl">
                This is what your guests see
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                These cards are live from the sample wedding below. Try one: reserving really
                works, and you can cancel right after.
              </p>
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sampleGifts.map((gift) => (
                <li key={gift.id} className="flex">
                  <div className="flex w-full">
                    <GiftCard gift={gift} slug={registry.event.slug} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center">
              <Link
                href={`/e/${SEED_WEDDING_SLUG}`}
                className="text-sm font-semibold text-clay underline decoration-butter decoration-2 underline-offset-4 hover:text-clay-deep"
              >
                Open the full sample registry
              </Link>
            </p>
          </section>
        ) : null}

        {/* Invitation showcase */}
        <section aria-labelledby="themes-title" className="mt-24">
          <div className="text-center">
            <Eyebrow>One structure, your occasion</Eyebrow>
            <h2 id="themes-title" className="font-display mt-3 text-2xl text-ink sm:text-3xl">
              An invitation for every kind of day
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              Your words on top, the gift list underneath. The card dresses for the occasion.
            </p>
          </div>
          {/* Inner w-max + mx-auto centers the strip when it fits and
              scrolls from the left edge when it does not (justify-center
              would clip the first card). */}
          <div className="mt-8 snap-x overflow-x-auto pb-4">
            <div className="mx-auto flex w-max gap-5 px-1">
              <MiniInvite
                band="shell"
                eyebrow="Wedding"
                title="Come stand with us in the orchard"
                detail="Saturday, May 9 · Healdsburg"
                href={`/e/${SEED_WEDDING_SLUG}`}
                cta="See the registry"
              />
              <MiniInvite
                band="butter"
                eyebrow="Birthday"
                title="Loud music, long table, bring an appetite"
                detail="Franco turns 40 · June 20"
                href="/signup"
                cta="Host one like it"
              />
              <MiniInvite
                band="leaf"
                eyebrow="Baby shower"
                title="A quiet morning of tea and small socks"
                detail="Sunday, March 1 · Portland"
                href={`/e/${SEED_SHOWER_SLUG}`}
                cta="See the registry"
              />
              <MiniInvite
                band="ink"
                eyebrow="Graduation"
                title="Four hard years, one good afternoon"
                detail="Class of 2027 · Ann Arbor"
                href="/signup"
                cta="Host one like it"
              />
            </div>
          </div>
        </section>

        {/* Surprise mode, shown */}
        <section aria-labelledby="surprise-title" className="mt-24">
          <div className="text-center">
            <Eyebrow>Surprise mode</Eyebrow>
            <h2 id="surprise-title" className="font-display mt-3 text-2xl text-ink sm:text-3xl">
              Guests see everything. You can choose not to.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              Turn on surprise mode and purchaser names stay hidden from you, and only you, until
              the event day.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-sand bg-card p-5">
              <p className="text-xs font-bold tracking-[0.14em] uppercase text-ink-faint">
                What guests see
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                <li className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-butter/40 text-[10px] font-bold text-clay"
                    aria-hidden
                  >
                    AO
                  </span>
                  <span className="font-medium">Amara Osei</span>
                  <span className="text-ink-soft">× 4</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-butter/40 text-[10px] font-bold text-clay"
                    aria-hidden
                  >
                    BC
                  </span>
                  <span className="font-medium">Ben Calloway</span>
                  <span className="text-ink-soft">× 1</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-sand bg-card p-5">
              <p className="text-xs font-bold tracking-[0.14em] uppercase text-ink-faint">
                What you see until the event day
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                <li className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-sand text-[10px] font-bold text-ink-faint"
                    aria-hidden
                  >
                    ?
                  </span>
                  <span className="italic text-ink-soft">A guest</span>
                  <span className="text-ink-soft">× 4</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-sand text-[10px] font-bold text-ink-faint"
                    aria-hidden
                  >
                    ?
                  </span>
                  <span className="italic text-ink-soft">A guest</span>
                  <span className="text-ink-soft">× 1</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-ink-soft">
                Quantities stay accurate the whole time, so nothing gets double-bought.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-title" className="mt-24">
          <h2 id="how-title" className="font-display text-center text-2xl text-ink">
            How it works
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-sand bg-card p-6">
              <p className="font-display text-lg text-clay">Write the invitation</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Title, date, place, and a message in your own voice. Add gifts with links, photos,
                and how many you&rsquo;d like.
              </p>
            </div>
            <div className="rounded-2xl border border-sand bg-card p-6">
              <p className="font-display text-lg text-clay">Share one link</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Guests open it, see who&rsquo;s bringing what, and reserve with just their name and
                email. Quantities can&rsquo;t be double-booked.
              </p>
            </div>
            <div className="rounded-2xl border border-sand bg-card p-6">
              <p className="font-display text-lg text-clay">Let plans change</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Every reservation comes with a private link to update or cancel later. No guest
                accounts, ever.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="mx-auto mt-24 max-w-2xl">
          <h2 id="faq-title" className="font-display text-center text-2xl text-ink">
            Questions hosts ask
          </h2>
          <div className="mt-8 space-y-3">
            {[
              {
                q: 'Do my guests need an account?',
                a: 'No. Guests reserve with just their name and email, and they get a private link to change or cancel their reservation later.',
              },
              {
                q: 'Can two guests buy the same gift?',
                a: 'Not by accident. Every gift has a set number of units, and the registry checks availability the moment someone reserves. When the last unit goes, the card says so.',
              },
              {
                q: 'What does surprise mode actually hide?',
                a: 'Only purchaser names, and only from you. Guests still see who is bringing what, and you still see quantities so you know how the list is going. Names appear for you on the event day.',
              },
              {
                q: 'Can I ask for more than one of something?',
                a: 'Yes. Set a quantity, like eight dinner plates, and guests claim as many units as they like. You can also mark a gift unlimited, like a bottle for the cellar.',
              },
              {
                q: 'What does it cost?',
                a: 'Hosting a registry is free right now, while GiftCircle is in early access.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-2xl border border-sand bg-card px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {q}
                    <span
                      aria-hidden
                      className="text-clay transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mt-24 text-center">
          <p className="font-display text-2xl text-ink">
            Weddings · birthdays · baby showers · graduations
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            Anywhere people ask &ldquo;what can I bring?&rdquo;, GiftCircle has the answer ready.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center rounded-full bg-clay px-6 py-3 text-sm font-semibold text-card hover:bg-clay-deep"
          >
            Create your event
          </Link>
        </section>
      </main>
      <footer className="border-t border-sand py-8 text-center text-xs text-ink-faint">
        GiftCircle, an MVP for collaborative gift registries.
      </footer>
    </>
  );
}
