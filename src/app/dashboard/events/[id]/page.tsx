import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { deleteEventAction, deleteGiftAction } from '@/app/dashboard/actions';
import { ConfirmButton } from '@/components/confirm-button';
import { GiftForm } from '@/components/gift-form';
import { QuantityTicks } from '@/components/quantity-ticks';
import { ShareLink } from '@/components/share-link';
import { SiteHeader } from '@/components/site-header';
import { Eyebrow } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';
import { getStore } from '@/lib/data';
import { formatEventDate, formatPrice, formatShortDate } from '@/lib/format';
import { EVENT_TYPE_LABELS } from '@/lib/types';

export const metadata: Metadata = { title: 'Manage event' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageEventPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const detail = await getStore().getHostEventDetail(user.id, id);
  if (!detail) notFound();

  const { event, gifts, reservations } = detail;
  const masked = reservations.some((r) => r.masked);
  const reservationsByGift = new Map<string, typeof reservations>();
  for (const r of reservations) {
    const list = reservationsByGift.get(r.gift_id) ?? [];
    list.push(r);
    reservationsByGift.set(r.gift_id, list);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <header className="mt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Eyebrow>
                {EVENT_TYPE_LABELS[event.event_type]}
                {event.visibility_mode === 'surprise_host' ? ' · surprise mode' : ''}
              </Eyebrow>
              <h1 className="font-display mt-2 text-3xl text-ink">{event.title}</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {formatEventDate(event.event_date)} · {event.location}
              </p>
            </div>
            <Link
              href={`/e/${event.slug}`}
              className="inline-flex items-center rounded-full border border-clay/30 bg-card px-4 py-2 text-sm font-semibold text-clay hover:border-clay/60"
            >
              View as guest ↗
            </Link>
          </div>
          <div className="mt-5 rounded-2xl border border-sand bg-card p-4">
            <p className="mb-2 text-xs font-bold tracking-[0.14em] uppercase text-ink-faint">
              Share with guests
            </p>
            <ShareLink path={`/e/${event.slug}`} />
          </div>
        </header>

        {/* Reservations */}
        <section aria-labelledby="reservations-title" className="mt-10">
          <h2 id="reservations-title" className="font-display text-2xl text-ink">
            Reservations
          </h2>
          {masked ? (
            <p className="mt-2 rounded-xl bg-shell/60 px-4 py-3 text-sm leading-relaxed text-ink-soft">
              Surprise mode is on. You&rsquo;ll see who reserved each gift on{' '}
              <span className="font-semibold text-ink">{formatShortDate(event.event_date)}</span>.
              Until then, only quantities are shown. Guests can see each other&rsquo;s names.
            </p>
          ) : null}
          {reservations.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-sand bg-card/60 px-6 py-10 text-center text-sm text-ink-soft">
              No reservations yet. Share the guest link above to get the list going.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {reservations.map((r) => {
                const gift = gifts.find((g) => g.id === r.gift_id);
                return (
                  <li
                    key={r.reservation_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sand bg-card px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-ink">
                      {r.name ?? <span className="italic text-ink-soft">A guest (surprise!)</span>}
                    </span>
                    <span className="text-ink-soft">
                      {r.quantity} × {gift?.name ?? 'gift'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Gifts */}
        <section aria-labelledby="gifts-title" className="mt-10">
          <h2 id="gifts-title" className="font-display text-2xl text-ink">
            Gift list
          </h2>
          {gifts.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-sand bg-card/60 px-6 py-10 text-center text-sm text-ink-soft">
              Your list is empty. Add the first gift below.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {gifts.map((gift) => {
                const price = formatPrice(gift.estimated_price_cents);
                return (
                  <li key={gift.id} className="rounded-2xl border border-sand bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg text-ink">{gift.name}</h3>
                        {price ? <p className="text-sm text-ink-soft">~{price}</p> : null}
                      </div>
                      <form action={deleteGiftAction}>
                        <input type="hidden" name="giftId" value={gift.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <ConfirmButton
                          confirmMessage={`Remove “${gift.name}”? Any guest reservations for it will be removed too.`}
                          className="rounded-full px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger-tint"
                        >
                          Remove
                        </ConfirmButton>
                      </form>
                    </div>
                    <div className="mt-3">
                      <QuantityTicks
                        requested={gift.requested_quantity}
                        claimed={gift.claimed_quantity}
                        isUnlimited={gift.is_unlimited}
                      />
                    </div>
                    {(reservationsByGift.get(gift.id) ?? []).length > 0 ? (
                      <p className="mt-2 text-xs text-ink-soft">
                        Reserved by{' '}
                        {(reservationsByGift.get(gift.id) ?? [])
                          .map((r) => (r.name ? `${r.name} (×${r.quantity})` : `a guest (×${r.quantity})`))
                          .join(', ')}
                      </p>
                    ) : null}
                    <details className="group mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-clay hover:underline">
                        Edit gift
                      </summary>
                      <div className="mt-4 border-t border-sand pt-4">
                        <GiftForm eventId={event.id} gift={gift} />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 rounded-2xl border border-sand bg-card p-6">
            <h3 className="font-display text-lg text-ink">Add a gift</h3>
            <div className="mt-4">
              <GiftForm eventId={event.id} />
            </div>
          </div>
        </section>

        {/* Settings */}
        <section aria-labelledby="settings-title" className="mt-10">
          <h2 id="settings-title" className="font-display text-2xl text-ink">
            Event settings
          </h2>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-sand bg-card p-6">
            <div>
              <h3 className="text-sm font-semibold text-ink">Invitation design</h3>
              <p className="mt-1 text-sm text-ink-soft">
                Edit the title, date, location, backdrop, and extra sections in the invitation editor.
              </p>
            </div>
            <Link
              href={`/dashboard/events/${event.id}/design`}
              className="shrink-0 rounded-full border border-clay/30 bg-card px-5 py-2.5 text-sm font-semibold text-clay hover:border-clay/60 hover:bg-shell/40"
            >
              Edit invitation
            </Link>
          </div>
          <div className="mt-4 rounded-2xl border border-danger/25 bg-card p-6">
            <h3 className="text-sm font-semibold text-danger">Danger zone</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Deleting the event removes its invitation page, gifts, and all guest reservations.
            </p>
            <form action={deleteEventAction} className="mt-3">
              <input type="hidden" name="eventId" value={event.id} />
              <ConfirmButton
                confirmMessage={`Delete “${event.title}” and all of its reservations? This cannot be undone.`}
                className="rounded-full border border-danger/40 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-tint"
              >
                Delete this event
              </ConfirmButton>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
