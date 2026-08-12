'use client';

import { useState } from 'react';
import { Button } from './ui';

export function CopyButton({ value, label = 'Copy link' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard unavailable; the link is visible to copy manually.
        }
      }}
    >
      {copied ? 'Copied!' : label}
    </Button>
  );
}
