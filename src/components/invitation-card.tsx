import type { ReactNode } from 'react';
import { CopyButton } from './copy-button';
import { Eyebrow } from './ui';
import { formatEventDateTime, formatPrice } from '@/lib/format';
import { EVENT_TYPE_LABELS, type PublicEvent } from '@/lib/types';

export type InvitationData = Pick<
  PublicEvent,
  | 'title' | 'event_type' | 'host_name' | 'event_date' | 'start_time' | 'end_time'
  | 'location' | 'message' | 'host_note' | 'cost_mode' | 'cost_amount_cents'
  | 'cost_memo' | 'venmo_handle' | 'zelle_handle' | 'cashapp_handle'
>;

export interface InvitationSlots {
  eyebrow?: ReactNode;
  title?: ReactNode;
  host?: ReactNode;
  date?: ReactNode;
  location?: ReactNode;
  message?: ReactNode;
  hostNote?: ReactNode;
  costs?: ReactNode;
}

/**
 * The invitation itself. The guest page renders it bare; the canvas editor
 * passes `slots` to wrap each region in an editable affordance, so the two
 * views can never drift apart.
 */
export function InvitationCard({
  event,
  slots = {},
}: {
  event: InvitationData;
  slots?: InvitationSlots;
}) {
  return (
    <section
      aria-labelledby="event-title"
      className="ticket-edge mx-auto max-w-2xl bg-card px-6 pb-12 pt-10 text-center shadow-[0_2px_16px_rgba(58,46,37,0.08)] sm:px-12"
    >
      {slots.eyebrow !== undefined ? (
        slots.eyebrow
      ) : (
        <Eyebrow>{EVENT_TYPE_LABELS[event.event_type]} · You&rsquo;re invited</Eyebrow>
      )}
      {slots.title !== undefined ? (
        slots.title
      ) : (
        <h1 id="event-title" className="font-display mt-4 text-3xl leading-tight text-ink sm:text-4xl">
          {event.title}
        </h1>
      )}
      {slots.host !== undefined ? (
        slots.host
      ) : (
        <p className="mt-3 text-sm font-semibold tracking-wide text-clay">
          Hosted by {event.host_name}
        </p>
      )}
      <dl className="mt-5 space-y-1 text-sm text-ink-soft">
        <div>
          <dt className="sr-only">Date</dt>
          <dd className="font-semibold text-ink">
            {slots.date !== undefined
              ? slots.date
              : formatEventDateTime(event.event_date, event.start_time, event.end_time)}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Location</dt>
          <dd>{slots.location !== undefined ? slots.location : event.location}</dd>
        </div>
      </dl>
      {slots.message !== undefined ? (
        slots.message
      ) : event.message ? (
        <p className="mx-auto mt-6 max-w-prose border-t border-sand pt-6 text-left text-[15px] leading-relaxed text-ink-soft">
          {event.message}
        </p>
      ) : null}
      {slots.hostNote !== undefined ? (
        slots.hostNote
      ) : event.host_note ? (
        <HostNoteSection note={event.host_note} />
      ) : null}
      {slots.costs !== undefined ? (
        slots.costs
      ) : event.cost_mode ? (
        <CostsSection event={event} />
      ) : null}
    </section>
  );
}

export function HostNoteSection({ note }: { note: string }) {
  return (
    <div className="mx-auto mt-6 max-w-prose border-t border-sand pt-6 text-left">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">A note from your host</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{note}</p>
    </div>
  );
}

export function CostsSection({ event }: { event: InvitationData }) {
  const amount = formatPrice(event.cost_amount_cents);
  const handles: Array<{ label: string; value: string }> = [];
  if (event.venmo_handle) handles.push({ label: 'Venmo', value: event.venmo_handle });
  if (event.zelle_handle) handles.push({ label: 'Zelle', value: event.zelle_handle });
  if (event.cashapp_handle) handles.push({ label: 'Cash App', value: event.cashapp_handle });
  return (
    <div className="mx-auto mt-6 max-w-prose border-t border-sand pt-6 text-left">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Chip in</p>
      {amount ? (
        <p className="mt-2 text-sm font-semibold text-ink">
          {event.cost_mode === 'required'
            ? `${amount} per person`
            : `Suggested: ${amount} per person`}
        </p>
      ) : null}
      {event.cost_memo ? <p className="mt-1 text-sm text-ink-soft">{event.cost_memo}</p> : null}
      <ul className="mt-3 space-y-2">
        {handles.map((h) => (
          <li
            key={h.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-paper/60 px-3.5 py-2"
          >
            <span className="text-sm text-ink">
              <span className="font-semibold">{h.label}</span>
              <span className="ml-2 text-ink-soft">{h.value}</span>
            </span>
            <CopyButton value={h.value} label="Copy" />
          </li>
        ))}
      </ul>
    </div>
  );
}
