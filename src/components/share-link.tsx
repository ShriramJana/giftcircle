'use client';

import { useSyncExternalStore } from 'react';
import { CopyButton } from './copy-button';

const noopSubscribe = () => () => {};

/** Client-only page origin: '' during SSR, window.location.origin after. */
function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => '',
  );
}

/** Shows the absolute guest URL for an event with a copy control. */
export function ShareLink({ path }: { path: string }) {
  const url = `${useOrigin()}${path}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <code className="break-all rounded-lg border border-sand bg-paper px-3 py-2 font-mono text-xs text-ink">
        {url}
      </code>
      <CopyButton value={url} label="Copy guest link" />
    </div>
  );
}
