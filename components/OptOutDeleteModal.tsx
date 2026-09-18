'use client';

import { useEffect, useState } from 'react';
import { Athlete } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';

type OptOutDeleteModalProps = {
  athlete: Athlete;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deletePreview: {
    athleteName: string;
    opponentNotesCount: number;
    promotionsCount: number;
    tournamentEntriesCount: number;
  } | null;
  isLoadingPreview?: boolean;
  previewError?: string | null;
};

/**
 * Opt-out / cascade delete. Behaviour unchanged: preview counts, typed-name
 * confirmation, hard delete via onConfirm. Now an accessible Dialog.
 */
export default function OptOutDeleteModal({
  athlete,
  isOpen,
  onClose,
  onConfirm,
  deletePreview,
  isLoadingPreview = false,
  previewError = null,
}: OptOutDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedConfirmText = `${athlete.firstName} ${athlete.lastInitial}.`;
  const isConfirmValid = confirmText.trim() === expectedConfirmText;

  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!isConfirmValid) {
      setError(`Type "${expectedConfirmText}" exactly to confirm.`);
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete athlete');
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      locked={isDeleting}
      title="Opt-out / delete athlete"
      subtitle="Permanent deletion for a privacy or opt-out request"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={!isConfirmValid || isDeleting}>
            {isDeleting ? 'Deleting…' : 'Permanently delete'}
          </Button>
        </>
      }
    >
      <Notice tone="danger" title="This cannot be undone">
        All personal data for <strong>{expectedConfirmText}</strong> will be permanently deleted.
      </Notice>

      {isLoadingPreview ? (
        <div className="stack" style={{ gap: 'var(--svj-space-2)' }} aria-busy>
          <p className="font-semibold text-strong text-sm">Loading deletion preview…</p>
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ) : previewError ? (
        <Notice tone="warning" title="Could not load deletion preview">
          {previewError} You can still proceed, but counts may not be accurate.
        </Notice>
      ) : deletePreview ? (
        <div>
          <p className="font-semibold text-strong text-sm mb-2">The following will be permanently deleted:</p>
          <ul className="list-disc pl-5 text-sm text-body space-y-1">
            <li>Athlete profile ({expectedConfirmText})</li>
            <li>{deletePreview.opponentNotesCount} opponent scouting {deletePreview.opponentNotesCount === 1 ? 'note' : 'notes'}</li>
            <li>{deletePreview.promotionsCount} belt promotion {deletePreview.promotionsCount === 1 ? 'record' : 'records'}</li>
            <li>{deletePreview.tournamentEntriesCount} tournament {deletePreview.tournamentEntriesCount === 1 ? 'entry' : 'entries'}</li>
          </ul>
        </div>
      ) : null}

      <Notice tone="muted" title="Shared opponents are kept">
        Shared opponent records in the club directory are preserved. Only this athlete&apos;s own scouting notes are removed.
      </Notice>

      <Field label="Type the athlete's name to confirm" hint={`Type ${expectedConfirmText}`} error={error}>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => {
            setConfirmText(e.target.value);
            setError(null);
          }}
          className="form-input"
          placeholder={expectedConfirmText}
          disabled={isDeleting}
          autoComplete="off"
        />
      </Field>
    </Dialog>
  );
}
