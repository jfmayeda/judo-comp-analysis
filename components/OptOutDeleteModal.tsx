'use client';

import { useState, useEffect } from 'react';
import { Athlete } from '@/lib/types';

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
  };
};

export default function OptOutDeleteModal({
  athlete,
  isOpen,
  onClose,
  onConfirm,
  deletePreview,
}: OptOutDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedConfirmText = `${athlete.firstName} ${athlete.lastInitial}`;
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
      setError(`Please type "${expectedConfirmText}" exactly to confirm`);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to delete athlete');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Opt-Out / Delete Athlete
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Permanent deletion for privacy/opt-out request
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              ⚠️ This action cannot be undone
            </h3>
            <p className="text-sm text-red-800">
              This will permanently delete all personal data for{' '}
              <strong>{athlete.firstName} {athlete.lastInitial}.</strong> in
              compliance with opt-out/privacy requests.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">
              The following will be permanently deleted:
            </h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>
                Athlete profile ({athlete.firstName} {athlete.lastInitial}.)
              </li>
              <li>
                {deletePreview.opponentNotesCount} opponent scouting{' '}
                {deletePreview.opponentNotesCount === 1 ? 'note' : 'notes'}
              </li>
              <li>
                {deletePreview.promotionsCount} belt promotion{' '}
                {deletePreview.promotionsCount === 1 ? 'record' : 'records'}
              </li>
              <li>
                {deletePreview.tournamentEntriesCount} tournament{' '}
                {deletePreview.tournamentEntriesCount === 1 ? 'entry' : 'entries'}
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              📋 Shared opponents will NOT be deleted
            </h4>
            <p className="text-sm text-blue-800">
              If this athlete&apos;s opponent notes reference shared opponents in
              the club directory, those opponent records will be preserved.
              Only this athlete&apos;s specific scouting notes will be removed.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="font-semibold text-gray-900">
                Type the athlete&apos;s name to confirm deletion:
              </span>
              <p className="text-sm text-gray-600 mb-2">
                Type <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                  {expectedConfirmText}
                </code>
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError(null);
                }}
                className="form-input w-full"
                placeholder={expectedConfirmText}
                disabled={isDeleting}
                autoFocus
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="btn-danger"
          >
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
