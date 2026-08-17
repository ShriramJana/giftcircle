'use client';

import { useState } from 'react';
import { Modal } from './modal';
import { Button, Input, Textarea } from './ui';

export interface CostsDraft {
  costMode: '' | 'required' | 'suggested';
  costAmount: string;
  costMemo: string;
  venmoHandle: string;
  zelleHandle: string;
  cashappHandle: string;
}

export const EMPTY_COSTS: CostsDraft = {
  costMode: '',
  costAmount: '',
  costMemo: '',
  venmoHandle: '',
  zelleHandle: '',
  cashappHandle: '',
};

const QUICK_AMOUNTS = ['10', '20', '25', '50'];

export function ShareCostsModal({
  value,
  onSave,
  onClose,
}: {
  value: CostsDraft;
  onSave: (next: CostsDraft) => void;
  onClose: () => void;
}) {
  const editing = value.costMode !== '';
  const [draft, setDraft] = useState<CostsDraft>(
    editing ? value : { ...value, costMode: 'required' },
  );
  const set = <K extends keyof CostsDraft>(key: K, v: CostsDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const amountOk = /^\d{1,5}([.]\d{1,2})?$/.test(draft.costAmount) && parseFloat(draft.costAmount) > 0;
  const handleOk = Boolean(
    draft.venmoHandle.trim() || draft.zelleHandle.trim() || draft.cashappHandle.trim(),
  );

  return (
    <Modal open onClose={onClose} labelledBy="costs-title" panelClassName="max-w-2xl">
      <h2 id="costs-title" className="font-display text-2xl text-ink">
        Share costs with your guests
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Cover event expenses or collect for a group gift. Add your payment info so guests know
        where to send their share.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(
          [
            ['required', 'Set a required amount', 'Each guest pays an equal share.'],
            ['suggested', 'Set a suggested amount', 'Guests pay what they can.'],
          ] as const
        ).map(([mode, label, hint]) => (
          <label
            key={mode}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-card p-3.5 has-checked:border-clay/50 has-checked:bg-shell/30"
          >
            <input
              type="radio"
              name="costMode"
              value={mode}
              checked={draft.costMode === mode}
              onChange={() => set('costMode', mode)}
              className="mt-1 accent-(--color-clay)"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <span className="block text-xs leading-relaxed text-ink-soft">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-shell/30 p-4">
        <p className="text-sm font-semibold text-ink">
          {draft.costMode === 'required' ? 'Required amount' : 'Suggested amount'}
        </p>
        <p className="mt-1 text-xs text-ink-soft">Enter the amount each guest should pay.</p>
        <div className="relative mt-3">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">$</span>
          <Input
            aria-label="Amount per person"
            inputMode="decimal"
            className="pl-7 pr-24"
            placeholder="0"
            value={draft.costAmount}
            onChange={(e) => set('costAmount', e.target.value.replace(/[^\d.]/g, ''))}
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
            per person
          </span>
        </div>
        <div className="mt-2.5 flex gap-2">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => set('costAmount', a)}
              className="rounded-full border border-sand bg-card px-3.5 py-1.5 text-sm font-semibold text-ink hover:border-clay/50 hover:bg-shell/40"
            >
              ${a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-shell/30 p-4">
        <p className="text-sm font-semibold text-ink">Where should guests send payment?</p>
        <p className="mt-1 text-xs text-ink-soft">Add at least one. Skip any you don&rsquo;t use.</p>
        <div className="mt-3 space-y-2.5">
          {(
            [
              ['venmoHandle', 'Venmo', '@username'],
              ['zelleHandle', 'Zelle', 'phone or email'],
              ['cashappHandle', 'Cash App', '$username'],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key} className="grid grid-cols-[6rem_1fr] items-center gap-2">
              <span className="text-sm font-semibold text-ink">{label}</span>
              <Input
                aria-label={label}
                placeholder={placeholder}
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
                maxLength={120}
              />
            </div>
          ))}
        </div>
      </div>

      <Textarea
        aria-label="Memo"
        rows={2}
        className="mt-4"
        placeholder="Add a note about what you're sharing costs for. (optional)"
        value={draft.costMemo}
        onChange={(e) => set('costMemo', e.target.value)}
        maxLength={500}
      />

      <p className="mt-3 text-xs text-ink-faint">
        GiftCircle doesn&rsquo;t verify payments. Share only with guests you trust.
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        {editing ? (
          <Button type="button" variant="danger" onClick={() => onSave(EMPTY_COSTS)}>
            Remove from invitation
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!amountOk || !handleOk} onClick={() => onSave(draft)}>
            {editing ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
