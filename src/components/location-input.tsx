'use client';

import { useEffect, useRef, useState } from 'react';
import type { LocationSuggestion } from '@/lib/geocode';
import { Input } from './ui';

/**
 * Accessible location autocomplete: a plain text input that fills a
 * suggestion list as the host types. Free text is always allowed; picking a
 * suggestion just saves typing.
 */
export function LocationInput({
  id,
  name,
  defaultValue,
  required,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  const cancelPendingSearch = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
  };

  // Debounced search, driven by the change handler rather than an effect.
  const onChange = (next: string) => {
    setValue(next);
    cancelPendingSearch();
    const q = next.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { suggestions: LocationSuggestion[] };
        setSuggestions(data.suggestions);
        setOpen(true);
        setActive(-1);
      } catch {
        // Aborted or offline; keep whatever the host typed.
      } finally {
        if (abortRef.current === controller) setSearching(false);
      }
    }, 300);
  };

  // Close on outside click; drop any in-flight search on unmount.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      cancelPendingSearch();
    };
  }, []);

  const pick = (label: string) => {
    cancelPendingSearch();
    setValue(label);
    setSuggestions([]);
    setOpen(false);
    setActive(-1);
    setSearching(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(suggestions[active].label);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Start typing a venue, town, or address"
        autoComplete="off"
        required={required}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
      />
      {searching ? (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
          Searching…
        </span>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-sand bg-card py-1 shadow-[0_8px_24px_rgba(58,46,37,0.14)]"
        >
          {suggestions.map((s, i) => (
            <li key={s.label} role="presentation">
              <button
                type="button"
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === active}
                className={`w-full px-3.5 py-2 text-left text-sm text-ink hover:bg-shell/60 ${
                  i === active ? 'bg-shell/60' : ''
                }`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s.label)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
