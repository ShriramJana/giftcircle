'use client';

import { useState } from 'react';
import { Modal } from './modal';
import { Button, Textarea } from './ui';

export function HostNoteModal({
  value,
  onSave,
  onClose,
}: {
  value: string;
  onSave: (next: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const editing = value !== '';

  return (
    <Modal open onClose={onClose} labelledBy="note-title" panelClassName="max-w-xl">
      <h2 id="note-title" className="font-display text-2xl text-ink">
        {editing ? 'Edit your host note' : 'Add a host note'}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Practical details guests should know: parking, what to bring, who to call at the gate.
      </p>
      <Textarea
        aria-label="Host note"
        rows={6}
        className="mt-4"
        placeholder="Write your note here"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={2000}
      />
      <div className="mt-4 flex items-center justify-between gap-2">
        {editing ? (
          <Button type="button" variant="danger" onClick={() => onSave('')}>
            Remove note
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!draft.trim()} onClick={() => onSave(draft.trim())}>
            {editing ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
