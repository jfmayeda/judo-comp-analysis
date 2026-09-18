'use client';

import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Notice } from './Notice';

export type ConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

/** Replaces window.confirm(): keyboard accessible, shows errors inline. */
export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', destructive, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      locked={busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={handleConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      {body ? <div className="text-sm text-body">{body}</div> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}
