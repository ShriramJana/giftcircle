'use client';

import { useState } from 'react';
import { Modal } from './modal';
import { Button } from './ui';
import { addMonths, monthGrid, monthLabel, timeOptions, toISODate } from '@/lib/calendar';
import { formatEventDate, formatTime } from '@/lib/format';

export interface DateTimeValue {
  date: string;
  startTime: string;
  endTime: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const TIMES = timeOptions();

export function DateTimeModal({
  value,
  onSave,
  onClose,
}: {
  value: DateTimeValue;
  onSave: (next: DateTimeValue) => void;
  onClose: () => void;
}) {
  const today = toISODate(new Date());
  const initial = value.date || today;
  const [view, setView] = useState({
    year: parseInt(initial.slice(0, 4), 10),
    month: parseInt(initial.slice(5, 7), 10) - 1,
  });
  const [tab, setTab] = useState<'start' | 'end'>('start');
  const [draft, setDraft] = useState<DateTimeValue>(value);

  const grid = monthGrid(view.year, view.month);
  const timezone = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value;

  const pickDay = (iso: string) => setDraft((d) => ({ ...d, date: iso }));
  const pickStart = (t: string) =>
    setDraft((d) => ({ ...d, startTime: t, endTime: t === '' ? '' : d.endTime }));
  const pickEnd = (t: string) => setDraft((d) => ({ ...d, endTime: t }));

  return (
    <Modal open onClose={onClose} labelledBy="dt-title" panelClassName="max-w-2xl">
      <h2 id="dt-title" className="font-display text-2xl text-ink">
        Date and time
      </h2>

      {/* Start / End summary tabs */}
      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-sand">
        {(['start', 'end'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            disabled={t === 'end' && !draft.startTime}
            aria-pressed={tab === t}
            className={`px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              tab === t ? 'bg-shell/60' : 'bg-card hover:bg-shell/30'
            }`}
          >
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
              {t === 'start' ? 'Start' : 'End'}
            </span>
            <span className="block text-sm text-ink">
              {t === 'start'
                ? draft.date
                  ? `${formatEventDate(draft.date)}${draft.startTime ? `, ${formatTime(draft.startTime)}` : ''}`
                  : 'Pick a date & time'
                : draft.endTime
                  ? formatTime(draft.endTime)
                  : 'Optional'}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_9rem]">
        {/* Calendar */}
        <div className="rounded-xl border border-sand p-3">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
              className="rounded-full p-2 text-ink-soft hover:bg-shell/60 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="font-display text-lg text-ink">{monthLabel(view.year, view.month)}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
              className="rounded-full p-2 text-ink-soft hover:bg-shell/60 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            {WEEKDAYS.map((d, i) => (
              <span key={`${d}${i}`} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((cell) => {
              const past = cell.iso < today;
              const selected = cell.iso === draft.date;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={past}
                  onClick={() => pickDay(cell.iso)}
                  aria-pressed={selected}
                  className={`mx-auto my-0.5 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-clay font-semibold text-card'
                      : past || !cell.inMonth
                        ? 'text-ink-faint'
                        : 'text-ink hover:bg-shell/60'
                  } ${cell.iso === today && !selected ? 'ring-1 ring-clay/50' : ''}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time column */}
        <div className="rounded-xl border border-sand p-2">
          <p className="px-2 py-1 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
            {tab === 'start' ? 'Start time' : 'End time'}
          </p>
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {tab === 'start' ? (
              <li>
                <TimeRow label="No time" selected={draft.startTime === ''} onPick={() => pickStart('')} />
              </li>
            ) : null}
            {(tab === 'start' ? TIMES : TIMES.filter((t) => t > draft.startTime)).map((t) => (
              <li key={t}>
                <TimeRow
                  label={formatTime(t)}
                  selected={(tab === 'start' ? draft.startTime : draft.endTime) === t}
                  onPick={() => (tab === 'start' ? pickStart(t) : pickEnd(t))}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">Times shown as entered{timezone ? `, ${timezone}` : ''}.</p>
        <Button type="button" disabled={!draft.date} onClick={() => onSave(draft)}>
          Save
        </Button>
      </div>
    </Modal>
  );
}

function TimeRow({
  label,
  selected,
  onPick,
}: {
  label: string;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={`w-full rounded-lg px-3 py-1.5 text-center text-sm transition-colors ${
        selected ? 'bg-clay font-semibold text-card' : 'text-ink hover:bg-shell/60'
      }`}
    >
      {label}
    </button>
  );
}
