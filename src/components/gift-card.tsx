'use client';

import Image from 'next/image';
import { useActionState, useEffect, useRef, useState } from 'react';
import { reserveGiftAction, type ReserveState } from '@/app/e/[slug]/actions';
import { formatPrice } from '@/lib/format';
import { maxReservable } from '@/lib/registry';
import type { RegistryGift } from '@/lib/types';
import { CopyButton } from './copy-button';
import { QuantityTicks } from './quantity-ticks';
import { Button, Field, FormMessage, Input } from './ui';

const IDLE: ReserveState = { status: 'idle' };

function newManagementToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replaceAll('-', '');
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function GiftCard({ gift, slug }: { gift: RegistryGift; slug: string }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [state, formAction, isPending] = useActionState(reserveGiftAction, IDLE);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const remaining = maxReservable(gift, gift.claimed_quantity);
  const soldOut = remaining !== null && remaining <= 0;
  const price = formatPrice(gift.estimated_price_cents);

  // Fresh idempotency/management token each time the form opens.
  const openForm = () => {
    setToken(newManagementToken());
    setOpen(true);
  };

  // The form only renders after a click (post-hydration), so reading
  // localStorage for prefill during render is client-only and safe.
  const storedName = open ? (localStorage.getItem('gc_guest_name') ?? '') : '';
  const storedEmail = open ? (localStorage.getItem('gc_guest_email') ?? '') : '';

  useEffect(() => {
    if (state.status === 'success') {
      if (nameRef.current?.value) localStorage.setItem('gc_guest_name', nameRef.current.value);
      if (emailRef.current?.value) localStorage.setItem('gc_guest_email', emailRef.current.value);
    }
  }, [state.status]);

  const managementUrl =
    state.status === 'success' && state.managementPath && typeof window !== 'undefined'
      ? `${window.location.origin}${state.managementPath}`
      : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-sand bg-card shadow-[0_1px_2px_rgba(58,46,37,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(58,46,37,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {gift.image_url ? (
        <div className="relative h-44 w-full bg-shell">
          {/* Remote gift images come from arbitrary hosts, so use a plain img */}
          <Image
            src={gift.image_url}
            alt={gift.name}
            fill
            unoptimized
            className="object-cover"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug text-ink">{gift.name}</h3>
          {price ? (
            <span className="shrink-0 rounded-full bg-shell px-2.5 py-1 text-xs font-semibold text-clay">
              ~{price}
            </span>
          ) : null}
        </div>

        {gift.description ? (
          <p className="text-sm leading-relaxed text-ink-soft">{gift.description}</p>
        ) : null}

        {gift.product_url ? (
          <a
            href={gift.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-clay underline decoration-butter decoration-2 underline-offset-4 hover:text-clay-deep"
          >
            See the exact one ↗
          </a>
        ) : null}

        <QuantityTicks
          requested={gift.requested_quantity}
          claimed={gift.claimed_quantity}
          isUnlimited={gift.is_unlimited}
        />

        {gift.purchasers.length > 0 ? (
          <div className="rounded-xl bg-paper px-3.5 py-3">
            <p className="mb-2 text-xs font-bold tracking-[0.14em] uppercase text-ink-faint">
              Being brought by
            </p>
            <ul className="space-y-1.5">
              {gift.purchasers.slice(0, 4).map((p) => (
                <li key={p.reservation_id} className="flex items-center gap-2 text-sm text-ink">
                  <span
                    aria-hidden
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-butter/40 text-[10px] font-bold text-clay"
                  >
                    {initialsOf(p.name)}
                  </span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-ink-soft">× {p.quantity}</span>
                </li>
              ))}
            </ul>
            {gift.purchasers.length > 4 ? (
              <p className="mt-1.5 text-xs text-ink-soft">
                plus {gift.purchasers.length - 4} more
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          {state.status === 'success' && managementUrl ? (
            <div className="rise-in space-y-3 rounded-xl bg-leaf-tint p-4" role="status">
              <p className="text-sm font-semibold text-leaf">{state.message}</p>
              <p className="text-xs leading-relaxed text-ink-soft">
                Keep this private link. It lets you change or cancel your reservation later,
                no account needed.
              </p>
              <p
                data-testid="management-link"
                className="break-all rounded-lg border border-leaf/30 bg-card px-3 py-2 font-mono text-xs text-ink"
              >
                {managementUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={managementUrl} />
                <a
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-clay hover:bg-shell/50"
                  href={state.managementPath}
                >
                  Manage reservation
                </a>
              </div>
            </div>
          ) : soldOut ? (
            <p className="rounded-xl bg-paper px-4 py-2.5 text-center text-sm font-semibold text-ink-soft">
              Fully claimed
            </p>
          ) : open ? (
            <form action={formAction} className="rise-in space-y-3 rounded-xl bg-paper p-4">
              <input type="hidden" name="giftId" value={gift.id} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="managementToken" value={token} />

              <Field
                label="Your name"
                htmlFor={`name-${gift.id}`}
                error={state.fieldErrors?.guestName}
              >
                <Input
                  ref={nameRef}
                  id={`name-${gift.id}`}
                  name="guestName"
                  autoComplete="name"
                  defaultValue={storedName}
                  placeholder="Sam Rivera"
                  required
                />
              </Field>
              <Field
                label="Your email"
                htmlFor={`email-${gift.id}`}
                error={state.fieldErrors?.guestEmail}
                hint="Only the host's registry keeps this. It is never shown to other guests."
              >
                <Input
                  ref={emailRef}
                  id={`email-${gift.id}`}
                  name="guestEmail"
                  type="email"
                  autoComplete="email"
                  defaultValue={storedEmail}
                  placeholder="sam@example.com"
                  required
                />
              </Field>
              <Field
                label="How many are you bringing?"
                htmlFor={`qty-${gift.id}`}
                error={state.fieldErrors?.quantity}
              >
                <Input
                  id={`qty-${gift.id}`}
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={remaining ?? 1000}
                  defaultValue={1}
                  required
                  className="max-w-28"
                />
              </Field>

              {state.status === 'error' ? (
                <FormMessage status="error" message={state.message} />
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Reserving…' : 'Reserve this gift'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Never mind
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" className="w-full" onClick={openForm}>
              I&rsquo;ll bring this
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
