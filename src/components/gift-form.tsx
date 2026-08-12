'use client';

import { useActionState, useState } from 'react';
import { createGiftAction, updateGiftAction, type CrudState } from '@/app/dashboard/actions';
import type { Gift } from '@/lib/types';
import { Button, Field, FormMessage, Input, Textarea } from './ui';

const IDLE: CrudState = { status: 'idle' };

export function GiftForm({ eventId, gift }: { eventId: string; gift?: Gift }) {
  const isEdit = Boolean(gift);
  const [state, action, pending] = useActionState(
    isEdit ? updateGiftAction : createGiftAction,
    IDLE,
  );
  const [unlimited, setUnlimited] = useState(gift?.is_unlimited ?? false);
  const idp = gift ? `gift-${gift.id}` : 'gift-new';

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      {gift ? <input type="hidden" name="giftId" value={gift.id} /> : null}

      <Field label="Gift name" htmlFor={`${idp}-name`} error={state.fieldErrors?.name}>
        <Input
          id={`${idp}-name`}
          name="name"
          placeholder="Dutch oven, 5.5 qt"
          defaultValue={state.values?.name ?? gift?.name}
          required
        />
      </Field>

      <Field
        label="Description"
        htmlFor={`${idp}-desc`}
        error={state.fieldErrors?.description}
        hint="Why this gift? Guests love the story."
      >
        <Textarea id={`${idp}-desc`} name="description" rows={3} defaultValue={state.values?.description ?? gift?.description} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Product link (optional)"
          htmlFor={`${idp}-url`}
          error={state.fieldErrors?.productUrl}
        >
          <Input
            id={`${idp}-url`}
            name="productUrl"
            type="url"
            placeholder="https://…"
            defaultValue={state.values?.productUrl ?? gift?.product_url ?? ''}
          />
        </Field>
        <Field
          label="Image link (optional)"
          htmlFor={`${idp}-img`}
          error={state.fieldErrors?.imageUrl}
        >
          <Input
            id={`${idp}-img`}
            name="imageUrl"
            type="url"
            placeholder="https://…"
            defaultValue={state.values?.imageUrl ?? gift?.image_url ?? ''}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Estimated price (optional)"
          htmlFor={`${idp}-price`}
          error={state.fieldErrors?.estimatedPrice}
          hint="In dollars, e.g. 49.99"
        >
          <Input
            id={`${idp}-price`}
            name="estimatedPrice"
            inputMode="decimal"
            placeholder="49.99"
            defaultValue={
              state.values?.estimatedPrice ??
              (gift?.estimated_price_cents != null
                ? (gift.estimated_price_cents / 100).toString()
                : '')
            }
          />
        </Field>
        <Field
          label="How many would you like?"
          htmlFor={`${idp}-qty`}
          error={state.fieldErrors?.requestedQuantity}
        >
          <Input
            id={`${idp}-qty`}
            name="requestedQuantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            defaultValue={state.values?.requestedQuantity ?? gift?.requested_quantity ?? 1}
            disabled={unlimited}
            required={!unlimited}
          />
          {unlimited ? <input type="hidden" name="requestedQuantity" value={gift?.requested_quantity ?? 1} /> : null}
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="isUnlimited"
          checked={unlimited}
          onChange={(e) => setUnlimited(e.target.checked)}
          className="h-4 w-4 accent-(--color-clay)"
        />
        No limit: any number of guests can bring this
      </label>

      <FormMessage
        status={state.status === 'error' ? 'error' : state.status === 'success' ? 'success' : null}
        message={state.message}
      />

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : isEdit ? 'Save gift' : 'Add gift to the list'}
      </Button>
    </form>
  );
}
