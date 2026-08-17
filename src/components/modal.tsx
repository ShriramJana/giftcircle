'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Shared dialog shell: portal, backdrop, Escape and X to close, body scroll
 * lock. Mount it only while open so feature modals reset their local state
 * on every open.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  panelClassName = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  panelClassName?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-ink/40" aria-hidden onMouseDown={onClose} />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className={`modal-pop relative w-full rounded-2xl bg-card p-6 shadow-[0_24px_64px_rgba(58,46,37,0.28)] outline-none sm:p-8 ${panelClassName}`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-2 text-ink-soft transition-colors hover:bg-shell/60 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
