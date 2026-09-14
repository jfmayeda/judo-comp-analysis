'use client';

import { useEffect, useMemo, useState } from 'react';
import TechniquePicker from '@/components/TechniquePicker';
import {
  CAPTURE_RESULT_LABELS,
  SCORE_FLAVOR_LABELS,
  saveQuickCapture,
} from '@/lib/quick-capture';
import { getAllOpponents } from '@/lib/supabase-store';
import {
  CaptureOpponent,
  CaptureResult,
  Opponent,
  ScoreFlavor,
} from '@/lib/types';

type OpponentMode = CaptureOpponent['kind'];

type QuickCaptureProps = {
  athleteId: string;
  onSaved: () => void;
  onCancel: () => void;
};

const SCORE_FLAVORS: ScoreFlavor[] = [
  'ippon',
  'waza_ari',
  'osaekomi',
  'golden_score',
  'other',
];

export default function QuickCapture({
  athleteId,
  onSaved,
  onCancel,
}: QuickCaptureProps) {
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('shared');
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [opponentQuery, setOpponentQuery] = useState('');
  const [sharedOpponentId, setSharedOpponentId] = useState('');
  const [oneOffFirst, setOneOffFirst] = useState('');
  const [oneOffInitial, setOneOffInitial] = useState('');
  const [techniqueIds, setTechniqueIds] = useState<string[]>([]);
  const [howText, setHowText] = useState('');
  const [scoreFlavor, setScoreFlavor] = useState<ScoreFlavor | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllOpponents()
      .then(setOpponents)
      .catch(() => setOpponents([]));
  }, []);

  const filteredOpponents = useMemo(() => {
    const query = opponentQuery.trim().toLowerCase();
    if (!query) return opponents;
    return opponents.filter(
      (opponent) =>
        opponent.firstName.toLowerCase().includes(query) ||
        opponent.lastInitial.toLowerCase().includes(query) ||
        opponent.club.toLowerCase().includes(query)
    );
  }, [opponents, opponentQuery]);

  const canSave =
    result !== null &&
    (opponentMode === 'unknown' ||
      (opponentMode === 'shared' && sharedOpponentId !== '') ||
      (opponentMode === 'oneOff' &&
        oneOffFirst.trim() !== '' &&
        oneOffInitial.trim().length === 1));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!result || !canSave) return;

    let opponent: CaptureOpponent;
    if (opponentMode === 'unknown') {
      opponent = { kind: 'unknown' };
    } else if (opponentMode === 'oneOff') {
      opponent = {
        kind: 'oneOff',
        firstName: oneOffFirst,
        lastInitial: oneOffInitial,
      };
    } else {
      opponent = { kind: 'shared', opponentId: sharedOpponentId };
    }

    setSaving(true);
    setError(null);
    try {
      await saveQuickCapture({
        athleteId,
        opponent,
        result,
        techniqueIds,
        howText,
        scoreFlavor,
        note,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save capture');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      id="quick-capture"
      onSubmit={handleSave}
      className="mb-6 p-4 md:p-5 bg-white border-2 border-brand-blue rounded-lg space-y-4 no-print"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900">
            Quick capture
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            After the match. Result, opponent, how, short note.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold uppercase tracking-wide text-gray-600 hover:text-gray-900 min-h-[44px]"
        >
          Cancel
        </button>
      </div>

      <fieldset>
        <legend className="eyebrow block text-gray-700 mb-2">Result *</legend>
        <div className="grid grid-cols-3 gap-2">
          {(['win', 'loss', 'other'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setResult(value)}
              className={`min-h-[48px] rounded-full text-sm font-semibold uppercase tracking-wide border-2 ${
                result === value
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-800 border-gray-300'
              }`}
            >
              {CAPTURE_RESULT_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow block text-gray-700 mb-2">Opponent</legend>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(
            [
              ['shared', 'Club list'],
              ['oneOff', 'New initials'],
              ['unknown', 'Unknown'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setOpponentMode(value)}
              className={`min-h-[44px] rounded-full text-xs md:text-sm font-semibold uppercase tracking-wide border-2 ${
                opponentMode === value
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-800 border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {opponentMode === 'shared' && (
          <div className="space-y-2">
            <input
              type="search"
              value={opponentQuery}
              onChange={(e) => setOpponentQuery(e.target.value)}
              placeholder="Search first name or club"
              className="form-input w-full"
            />
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {filteredOpponents.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">
                  No shared opponents yet. Use New initials.
                </p>
              ) : (
                filteredOpponents.map((opponent) => (
                  <button
                    key={opponent.id}
                    type="button"
                    onClick={() => setSharedOpponentId(opponent.id)}
                    className={`w-full text-left px-3 py-3 min-h-[44px] text-sm ${
                      sharedOpponentId === opponent.id
                        ? 'bg-blue-50 font-semibold'
                        : 'bg-white'
                    }`}
                  >
                    {opponent.firstName} {opponent.lastInitial}.
                    {opponent.club ? ` · ${opponent.club}` : ''}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {opponentMode === 'oneOff' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="eyebrow block text-gray-700 mb-2">
                First name
              </label>
              <input
                type="text"
                value={oneOffFirst}
                onChange={(e) => setOneOffFirst(e.target.value)}
                className="form-input w-full"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="eyebrow block text-gray-700 mb-2">
                Last initial
              </label>
              <input
                type="text"
                value={oneOffInitial}
                onChange={(e) =>
                  setOneOffInitial(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1))
                }
                className="form-input w-full uppercase"
                maxLength={1}
                autoComplete="off"
              />
            </div>
          </div>
        )}
      </fieldset>

      <div>
        <TechniquePicker
          label="How (tokui / ne list)"
          selectedIds={techniqueIds}
          onChange={setTechniqueIds}
          placeholder="Type to search a technique"
        />
        <input
          type="text"
          value={howText}
          onChange={(e) => setHowText(e.target.value)}
          className="form-input w-full mt-2"
          placeholder="Or free text if it is not in the list"
        />
      </div>

      <fieldset>
        <legend className="eyebrow block text-gray-700 mb-2">
          Score flavor
        </legend>
        <div className="flex flex-wrap gap-2">
          {SCORE_FLAVORS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setScoreFlavor((current) => (current === value ? null : value))
              }
              className={`min-h-[44px] px-3 rounded-full text-xs font-semibold uppercase tracking-wide border-2 ${
                scoreFlavor === value
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-800 border-gray-300'
              }`}
            >
              {SCORE_FLAVOR_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="eyebrow block text-gray-700 mb-2">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="form-input w-full"
          placeholder="One or two lines. Phone keyboard handles voice."
        />
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSave || saving}
        className="btn-primary w-full disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save capture'}
      </button>
    </form>
  );
}
