'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import {
  cancelReservationAction,
  updateReservationAction,
  type ManageState,
} from '@/app/reservation/[token]/actions';
import { maxReservable } from '@/lib/registry';
import type { ReservationDetail } from '@/lib/types';
import { Button, Field, FormMessage, Input } from './ui';

const IDLE: ManageState = { status: 'idle' };

export function ReservationManager({
  detail,
  token,
}: {
  detail: ReservationDetail;
  token: string;
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateReservationAction, IDLE);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelReservationAction, IDLE);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const { reservation, gift, event } = detail;

  if (cancelState.status === 'cancelled') {
    return (
      <div className="space-y-4 rounded-2xl border border-sand bg-card p-6 text-center">
        <p className="font-display text-xl text-ink">Reservation cancelled</p>
        <p className="text-sm leading-relaxed text-ink-soft" role="status">
          {cancelState.message}
        </p>
        <Link
          href={`/e/${event.slug}`}
          className="inline-flex items-center rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-card hover:bg-clay-deep"
        >
          Back to the registry
        </Link>
      </div>
    );
  }

  // Cap for increases: what others have claimed leaves this much for us.
  const othersClaimed = gift.claimed_quantity - reservation.quantity;
  const cap = maxReservable(gift, othersClaimed);

  return (
    <div className="space-y-5">
      <form action={updateAction} className="space-y-4 rounded-2xl border border-sand bg-card p-6">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="slug" value={event.slug} />
        <h2 className="font-display text-lg text-ink">Change how many you&rsquo;re bringing</h2>
        <Field
          label="Quantity"
          htmlFor="manage-quantity"
          error={updateState.fieldErrors?.quantity}
          hint={cap !== null ? `Up to ${cap} available for you.` : 'This gift has no limit.'}
        >
          <Input
            id="manage-quantity"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={cap ?? 1000}
            defaultValue={reservation.quantity}
            required
            className="max-w-28"
          />
        </Field>
        <FormMessage
          status={updateState.status === 'error' ? 'error' : updateState.status === 'updated' ? 'success' : null}
          message={updateState.message}
        />
        <Button type="submit" disabled={updatePending}>
          {updatePending ? 'Saving…' : 'Save change'}
        </Button>
      </form>

      <div className="rounded-2xl border border-danger/20 bg-card p-6">
        <h2 className="font-display text-lg text-ink">Can&rsquo;t bring it after all?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Cancelling frees the gift up for other guests right away.
        </p>
        <FormMessage
          status={cancelState.status === 'error' ? 'error' : null}
          message={cancelState.message}
        />
        {confirmingCancel ? (
          <form action={cancelAction} className="mt-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="slug" value={event.slug} />
            <Button type="submit" variant="danger" disabled={cancelPending}>
              {cancelPending ? 'Cancelling…' : 'Yes, cancel my reservation'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmingCancel(false)}>
              Keep it
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="danger"
            className="mt-4"
            onClick={() => setConfirmingCancel(true)}
          >
            Cancel reservation
          </Button>
        )}
      </div>
    </div>
  );
}
