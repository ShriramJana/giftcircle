'use client';

import { BACKGROUNDS } from '@/lib/backgrounds';

/** Right-side sheet of backdrop swatches. Selection applies instantly. */
export function BackgroundsPanel({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <aside
      aria-label="Backgrounds"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-xs overflow-y-auto border-l border-sand bg-card p-5 shadow-[-8px_0_32px_rgba(58,46,37,0.14)]"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Backgrounds</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close backgrounds"
          className="rounded-full p-2 text-ink-soft hover:bg-shell/60 hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {Object.entries(BACKGROUNDS).map(([key, bg]) => {
          const active = key === selected || (key === 'paper' && selected === '');
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key === 'paper' ? '' : key)}
              aria-pressed={active}
              title={bg.label}
              className={`aspect-square rounded-xl border transition-transform hover:scale-[1.04] ${
                active ? 'border-clay ring-2 ring-clay/40' : 'border-sand'
              }`}
              style={{ background: bg.css }}
            >
              <span className="sr-only">{bg.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Guests see this backdrop behind the whole invitation page.
      </p>
    </aside>
  );
}
