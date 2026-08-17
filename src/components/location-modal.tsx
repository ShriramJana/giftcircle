'use client';

import { useState } from 'react';
import { LocationInput } from './location-input';
import { Modal } from './modal';
import { Button } from './ui';

export function LocationModal({
  value,
  onSave,
  onClose,
}: {
  value: string;
  onSave: (next: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <Modal open onClose={onClose} labelledBy="loc-title" panelClassName="max-w-xl">
      <h2 id="loc-title" className="font-display text-2xl text-ink">
        Location
      </h2>
      <div className="mt-5 min-h-56">
        <LocationInput id="canvas-location" defaultValue={value} onValueChange={setDraft} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={!draft.trim()} onClick={() => onSave(draft.trim())}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
