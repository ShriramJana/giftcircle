'use client';

import { useActionState } from 'react';
import { createEventAction, updateEventAction, type CrudState } from '@/app/dashboard/actions';
import { EVENT_TYPES, EVENT_TYPE_LABELS, type HostEvent } from '@/lib/types';
import { LocationInput } from './location-input';
import { Button, Field, FormMessage, Input, Select, Textarea } from './ui';

const IDLE: CrudState = { status: 'idle' };

export function EventForm({ event }: { event?: HostEvent }) {
  const isEdit = Boolean(event);
  const [state, action, pending] = useActionState(
    isEdit ? updateEventAction : createEventAction,
    IDLE,
  );

  return (
    <form action={action} className="space-y-4">
      {event ? <input type="hidden" name="eventId" value={event.id} /> : null}

      <Field label="Event title" htmlFor="ev-title" error={state.fieldErrors?.title}>
        <Input
          id="ev-title"
          name="title"
          placeholder="Maya & Jordan are getting married"
          defaultValue={state.values?.title ?? event?.title}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event type" htmlFor="ev-type" error={state.fieldErrors?.eventType}>
          <Select id="ev-type" name="eventType" defaultValue={state.values?.eventType ?? event?.event_type ?? 'wedding'}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="ev-date" error={state.fieldErrors?.eventDate}>
          <Input id="ev-date" name="eventDate" type="date" defaultValue={state.values?.eventDate ?? event?.event_date} required />
        </Field>
      </div>

      <Field
        label="Host name(s)"
        htmlFor="ev-host"
        error={state.fieldErrors?.hostName}
        hint="Shown on the invitation, e.g. “Maya & Jordan”."
      >
        <Input id="ev-host" name="hostName" defaultValue={state.values?.hostName ?? event?.host_name} required />
      </Field>

      <Field
        label="Location"
        htmlFor="ev-location"
        error={state.fieldErrors?.location}
        hint="Pick a suggestion or write it your own way."
      >
        <LocationInput
          id="ev-location"
          name="location"
          defaultValue={state.values?.location ?? event?.location}
          required
        />
      </Field>

      <Field
        label="Invitation message"
        htmlFor="ev-message"
        error={state.fieldErrors?.message}
        hint="Set the scene. Guests read this at the top of the invitation."
      >
        <Textarea id="ev-message" name="message" rows={5} defaultValue={state.values?.message ?? event?.message} />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Who can see purchaser names?</legend>
        {state.fieldErrors?.visibilityMode ? (
          <p className="text-xs font-medium text-danger" role="alert">
            {state.fieldErrors.visibilityMode}
          </p>
        ) : null}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-card p-3.5 has-checked:border-clay/50 has-checked:bg-shell/30">
          <input
            type="radio"
            name="visibilityMode"
            value="public"
            defaultChecked={(state.values?.visibilityMode ?? event?.visibility_mode ?? 'public') === 'public'}
            className="mt-1 accent-(--color-clay)"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">Everyone</span>
            <span className="block text-xs leading-relaxed text-ink-soft">
              You and your guests see who reserved each gift.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-card p-3.5 has-checked:border-clay/50 has-checked:bg-shell/30">
          <input
            type="radio"
            name="visibilityMode"
            value="surprise_host"
            defaultChecked={(state.values?.visibilityMode ?? event?.visibility_mode) === 'surprise_host'}
            className="mt-1 accent-(--color-clay)"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">Keep it a surprise for me</span>
            <span className="block text-xs leading-relaxed text-ink-soft">
              Guests see each other&rsquo;s names, but you only see quantities until the event day.
            </span>
          </span>
        </label>
      </fieldset>

      <FormMessage
        status={state.status === 'error' ? 'error' : state.status === 'success' ? 'success' : null}
        message={state.message}
      />

      <Button type="submit" disabled={pending}>
        {pending
          ? isEdit
            ? 'Saving…'
            : 'Creating…'
          : isEdit
            ? 'Save event details'
            : 'Create event'}
      </Button>
    </form>
  );
}
