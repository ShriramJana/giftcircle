import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReservationManager } from '@/components/reservation-manager';
import { Eyebrow } from '@/components/ui';
import { getStore } from '@/lib/data';
import { formatEventDate, formatPrice } from '@/lib/format';
import { hashToken, isPlausibleToken } from '@/lib/token';

export const metadata: Metadata = {
  title: 'Your reservation',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ReservationPage({ params }: Props) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);
  if (!isPlausibleToken(token)) notFound();

  const detail = await getStore().getReservationByTokenHash(hashToken(token));
  if (!detail) notFound();

  const { reservation, gift, event } = detail;
  const price = formatPrice(gift.estimated_price_cents);

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 sm:px-6">
      <header className="mt-10 text-center">
        <Eyebrow>Your reservation</Eyebrow>
        <h1 className="font-display mt-3 text-2xl leading-snug text-ink sm:text-3xl">
          {reservation.guest_name}, you&rsquo;re bringing {reservation.quantity} ×{' '}
          {gift.name}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          For{' '}
          <Link
            href={`/e/${event.slug}`}
            className="font-semibold text-clay underline decoration-butter decoration-2 underline-offset-4"
          >
            {event.title}
          </Link>{' '}
          on {formatEventDate(event.event_date)} · hosted by {event.host_name}
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-sand bg-card p-6">
        <h2 className="font-display text-lg text-ink">{gift.name}</h2>
        {gift.description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{gift.description}</p>
        ) : null}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs font-bold tracking-[0.14em] uppercase text-ink-faint">
              Reserved under
            </dt>
            <dd className="mt-1 font-medium text-ink">{reservation.guest_name}</dd>
            <dd className="text-ink-soft">{reservation.guest_email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-[0.14em] uppercase text-ink-faint">
              Estimated price
            </dt>
            <dd className="mt-1 font-medium text-ink">{price ?? 'Host didn’t say'}</dd>
          </div>
        </dl>
        {gift.product_url ? (
          <a
            href={gift.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-clay underline decoration-butter decoration-2 underline-offset-4"
          >
            See the exact one ↗
          </a>
        ) : null}
      </section>

      <section className="mt-6" aria-label="Manage reservation">
        <ReservationManager detail={detail} token={token} />
      </section>

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
        This page is private to you. Anyone with this link can change your reservation, so
        don&rsquo;t share it.
      </p>
    </main>
  );
}
