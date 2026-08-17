'use client';

import { useMemo, useState, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createEventAction, updateEventAction, type CrudState } from '@/app/dashboard/actions';
import { backgroundOf } from '@/lib/backgrounds';
import { formatEventDateTime } from '@/lib/format';
import { EVENT_TYPES, EVENT_TYPE_LABELS, type HostEvent } from '@/lib/types';
import { BackgroundsPanel } from './backgrounds-panel';
import { DateTimeModal, type DateTimeValue } from './date-time-modal';
import { HostNoteModal } from './host-note-modal';
import { CostsSection, HostNoteSection, InvitationCard, type InvitationData } from './invitation-card';
import { LocationModal } from './location-modal';
import { ShareCostsModal, EMPTY_COSTS, type CostsDraft } from './share-costs-modal';
import { Button, FormMessage } from './ui';

const IDLE: CrudState = { status: 'idle' };

interface EventDraft {
  title: string;
  eventType: (typeof EVENT_TYPES)[number];
  hostName: string;
  dateTime: DateTimeValue;
  location: string;
  message: string;
  visibilityMode: 'public' | 'surprise_host';
  hostNote: string;
  background: string;
  costs: CostsDraft;
}

function draftFromEvent(event?: HostEvent): EventDraft {
  return {
    title: event?.title ?? '',
    eventType: event?.event_type ?? 'wedding',
    hostName: event?.host_name ?? '',
    dateTime: {
      date: event?.event_date ?? '',
      startTime: event?.start_time?.slice(0, 5) ?? '',
      endTime: event?.end_time?.slice(0, 5) ?? '',
    },
    location: event?.location ?? '',
    message: event?.message ?? '',
    visibilityMode: event?.visibility_mode ?? 'public',
    hostNote: event?.host_note ?? '',
    background: event?.background ?? '',
    costs: event?.cost_mode
      ? {
          costMode: event.cost_mode,
          costAmount: event.cost_amount_cents != null ? String(event.cost_amount_cents / 100) : '',
          costMemo: event.cost_memo ?? '',
          venmoHandle: event.venmo_handle ?? '',
          zelleHandle: event.zelle_handle ?? '',
          cashappHandle: event.cashapp_handle ?? '',
        }
      : EMPTY_COSTS,
  };
}

function toFormData(draft: EventDraft, eventId?: string): FormData {
  const fd = new FormData();
  if (eventId) fd.set('eventId', eventId);
  fd.set('title', draft.title);
  fd.set('eventType', draft.eventType);
  fd.set('hostName', draft.hostName);
  fd.set('eventDate', draft.dateTime.date);
  fd.set('startTime', draft.dateTime.startTime);
  fd.set('endTime', draft.dateTime.endTime);
  fd.set('location', draft.location);
  fd.set('message', draft.message);
  fd.set('hostNote', draft.hostNote);
  fd.set('background', draft.background);
  fd.set('costMode', draft.costs.costMode);
  fd.set('costAmount', draft.costs.costMode ? draft.costs.costAmount : '');
  fd.set('costMemo', draft.costs.costMode ? draft.costs.costMemo : '');
  fd.set('venmoHandle', draft.costs.costMode ? draft.costs.venmoHandle : '');
  fd.set('zelleHandle', draft.costs.costMode ? draft.costs.zelleHandle : '');
  fd.set('cashappHandle', draft.costs.costMode ? draft.costs.cashappHandle : '');
  fd.set('visibilityMode', draft.visibilityMode);
  return fd;
}

type OpenModal = 'date' | 'location' | 'note' | 'costs' | 'backgrounds' | null;

export function EventCanvas({ event }: { event?: HostEvent }) {
  const isEdit = Boolean(event);
  const router = useRouter();
  const [draft, setDraft] = useState<EventDraft>(() => draftFromEvent(event));
  const initialJson = useMemo(() => JSON.stringify(draftFromEvent(event)), [event]);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateEventAction : createEventAction,
    IDLE,
  );
  const [, startTransition] = useTransition();

  const dirty = JSON.stringify(draft) !== initialJson;
  const err = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  const dateError = err.eventDate ?? err.startTime ?? err.endTime;
  const costsError = err.costMode ?? err.costAmount ?? err.venmoHandle ?? err.zelleHandle ?? err.cashappHandle;
  const bg = backgroundOf(draft.background);

  const set = <K extends keyof EventDraft>(key: K, v: EventDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const submit = () => startTransition(() => formAction(toFormData(draft, event?.id)));

  const close = () => {
    if (!dirty || window.confirm('Discard your unsaved changes?')) {
      router.push(isEdit ? `/dashboard/events/${event!.id}` : '/dashboard');
    }
  };

  const preview: InvitationData = {
    title: draft.title,
    event_type: draft.eventType,
    host_name: draft.hostName,
    event_date: draft.dateTime.date,
    start_time: draft.dateTime.startTime || null,
    end_time: draft.dateTime.endTime || null,
    location: draft.location,
    message: draft.message,
    host_note: draft.hostNote || null,
    cost_mode: draft.costs.costMode || null,
    cost_amount_cents: draft.costs.costAmount ? Math.round(parseFloat(draft.costs.costAmount) * 100) || null : null,
    cost_memo: draft.costs.costMemo || null,
    venmo_handle: draft.costs.venmoHandle || null,
    zelle_handle: draft.costs.zelleHandle || null,
    cashapp_handle: draft.costs.cashappHandle || null,
  };

  return (
    <div className="min-h-screen" style={bg ? { background: bg.css } : undefined}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand/60 bg-card/85 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={close}
          aria-label="Close editor"
          className="rounded-full p-2 text-ink-soft hover:bg-shell/60 hover:text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <Button type="button" disabled={pending} onClick={submit}>
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
        </Button>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-32 pt-8 sm:px-6">
        {state.status === 'error' ? (
          <div className="mb-4">
            <FormMessage status="error" message={state.message} />
          </div>
        ) : null}
        {state.status === 'success' ? (
          <div className="mb-4">
            <FormMessage status="success" message={state.message} />
          </div>
        ) : null}

        <InvitationCard
          event={preview}
          slots={{
            eyebrow: (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-clay">
                <select
                  aria-label="Event type"
                  value={draft.eventType}
                  onChange={(e) => set('eventType', e.target.value as EventDraft['eventType'])}
                  className="cursor-pointer appearance-none rounded-md bg-transparent font-bold uppercase tracking-[0.18em] text-clay hover:bg-shell/60 focus:outline-none focus:ring-2 focus:ring-clay/25"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {EVENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                · You&rsquo;re invited
              </span>
            ),
            title: (
              <EditableText
                value={draft.title}
                onChange={(v) => set('title', v)}
                placeholder="Add a title *"
                error={err.title}
                className="font-display mt-4 w-full bg-transparent text-center text-3xl leading-tight text-ink placeholder:text-ink-faint focus:outline-none sm:text-4xl"
              />
            ),
            host: (
              <div className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold tracking-wide text-clay">
                <span>Hosted by</span>
                <EditableText
                  value={draft.hostName}
                  onChange={(v) => set('hostName', v)}
                  placeholder="you *"
                  error={err.hostName}
                  className="bg-transparent text-center font-semibold tracking-wide text-clay placeholder:text-clay/50 focus:outline-none"
                />
              </div>
            ),
            date: (
              <SlotChip
                onClick={() => setOpenModal('date')}
                filled={Boolean(draft.dateTime.date)}
                error={dateError}
              >
                {draft.dateTime.date
                  ? formatEventDateTime(
                      draft.dateTime.date,
                      draft.dateTime.startTime || null,
                      draft.dateTime.endTime || null,
                    )
                  : 'Pick a date & time'}
              </SlotChip>
            ),
            location: (
              <SlotChip
                onClick={() => setOpenModal('location')}
                filled={Boolean(draft.location)}
                error={err.location}
              >
                {draft.location || 'Add a location'}
              </SlotChip>
            ),
            message: (
              <textarea
                aria-label="Invitation message"
                value={draft.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Set the scene. Guests read this at the top of the invitation."
                rows={draft.message ? Math.min(8, draft.message.split('\n').length + 2) : 2}
                maxLength={2000}
                className="mx-auto mt-6 block w-full max-w-prose resize-none border-t border-sand bg-transparent pt-6 text-left text-[15px] leading-relaxed text-ink-soft placeholder:text-ink-faint focus:outline-none"
              />
            ),
            hostNote: draft.hostNote ? (
              <EditSection onEdit={() => setOpenModal('note')} label="Edit host note">
                <HostNoteSection note={draft.hostNote} />
              </EditSection>
            ) : null,
            costs: draft.costs.costMode ? (
              <EditSection onEdit={() => setOpenModal('costs')} label="Edit share costs" error={costsError}>
                <CostsSection event={preview} />
              </EditSection>
            ) : null,
          }}
        />

        {/* Add-section chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          {!draft.hostNote ? (
            <AddChip onClick={() => setOpenModal('note')}>+ Host note</AddChip>
          ) : null}
          {!draft.costs.costMode ? (
            <AddChip onClick={() => setOpenModal('costs')} error={costsError}>
              + Share costs
            </AddChip>
          ) : null}
        </div>

        {/* Registry privacy */}
        <fieldset className="mt-8 rounded-2xl border border-sand bg-card/85 p-5">
          <legend className="px-1 text-sm font-semibold text-ink">Who can see purchaser names?</legend>
          <div className="mt-1 space-y-2">
            {(
              [
                ['public', 'Everyone', 'You and your guests see who reserved each gift.'],
                [
                  'surprise_host',
                  'Keep it a surprise for me',
                  'Guests see each other’s names, but you only see quantities until the event day.',
                ],
              ] as const
            ).map(([mode, label, hint]) => (
              <label
                key={mode}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-card p-3.5 has-checked:border-clay/50 has-checked:bg-shell/30"
              >
                <input
                  type="radio"
                  name="visibilityMode"
                  value={mode}
                  checked={draft.visibilityMode === mode}
                  onChange={() => set('visibilityMode', mode)}
                  className="mt-1 accent-(--color-clay)"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block text-xs leading-relaxed text-ink-soft">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </main>

      {/* Floating toolbar */}
      <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
        <button
          type="button"
          onClick={() => setOpenModal(openModal === 'backgrounds' ? null : 'backgrounds')}
          className="flex items-center gap-2 rounded-full border border-sand bg-card px-5 py-3 text-sm font-semibold text-ink shadow-[0_8px_24px_rgba(58,46,37,0.18)] transition-transform hover:scale-[1.03]"
        >
          <span aria-hidden className="inline-block h-3.5 w-3.5 rounded-full bg-[conic-gradient(#B14E2B,#F2C879,#5F7A5A,#B14E2B)]" />
          Backgrounds
        </button>
      </div>

      {openModal === 'date' ? (
        <DateTimeModal
          value={draft.dateTime}
          onClose={() => setOpenModal(null)}
          onSave={(v) => {
            set('dateTime', v);
            setOpenModal(null);
          }}
        />
      ) : null}
      {openModal === 'location' ? (
        <LocationModal
          value={draft.location}
          onClose={() => setOpenModal(null)}
          onSave={(v) => {
            set('location', v);
            setOpenModal(null);
          }}
        />
      ) : null}
      {openModal === 'note' ? (
        <HostNoteModal
          value={draft.hostNote}
          onClose={() => setOpenModal(null)}
          onSave={(v) => {
            set('hostNote', v);
            setOpenModal(null);
          }}
        />
      ) : null}
      {openModal === 'costs' ? (
        <ShareCostsModal
          value={draft.costs}
          onClose={() => setOpenModal(null)}
          onSave={(v) => {
            set('costs', v);
            setOpenModal(null);
          }}
        />
      ) : null}
      {openModal === 'backgrounds' ? (
        <BackgroundsPanel
          selected={draft.background}
          onSelect={(key) => set('background', key)}
          onClose={() => setOpenModal(null)}
        />
      ) : null}
    </div>
  );
}

function EditableText({
  value,
  onChange,
  placeholder,
  error,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  className: string;
}) {
  return (
    <span className="block">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={120}
        size={Math.max(value.length, placeholder.length, 4)}
        className={`${className} ${error ? 'rounded-md ring-2 ring-danger/60' : ''}`}
      />
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}

function SlotChip({
  children,
  onClick,
  filled,
  error,
}: {
  children: React.ReactNode;
  onClick: () => void;
  filled: boolean;
  error?: string;
}) {
  return (
    <span className="block">
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full px-3.5 py-1.5 transition-colors ${
          filled
            ? 'text-inherit hover:bg-shell/60'
            : 'bg-butter/40 font-semibold text-ink hover:bg-butter/60'
        } ${error ? 'ring-2 ring-danger/60' : ''}`}
      >
        {children}
      </button>
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}

function AddChip({
  children,
  onClick,
  error,
}: {
  children: React.ReactNode;
  onClick: () => void;
  error?: string;
}) {
  return (
    <span>
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full border border-sand bg-card px-4 py-2 text-sm font-semibold text-ink shadow-[0_2px_10px_rgba(58,46,37,0.08)] transition-colors hover:border-clay/40 hover:bg-shell/40 ${
          error ? 'ring-2 ring-danger/60' : ''
        }`}
      >
        {children}
      </button>
      {error ? (
        <span role="alert" className="mt-1 block text-center text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}

function EditSection({
  children,
  onEdit,
  label,
  error,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  label: string;
  error?: string;
}) {
  return (
    <div className={`group relative ${error ? 'rounded-xl ring-2 ring-danger/60' : ''}`}>
      {children}
      <button
        type="button"
        onClick={onEdit}
        aria-label={label}
        className="absolute right-0 top-5 rounded-full border border-sand bg-card p-2 text-ink-soft opacity-0 shadow transition-opacity hover:text-ink focus:opacity-100 group-hover:opacity-100"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M11.3 1.7l3 3L5 14H2v-3l9.3-9.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
