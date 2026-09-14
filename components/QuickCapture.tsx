'use client';

import { useEffect, useMemo, useState } from 'react';
import TechniquePicker from '@/components/TechniquePicker';
import {
  formatCaptureScoreSummary,
  SCORE_EVENT_LABELS,
  withSequenceOrders,
} from '@/lib/capture-score';
import {
  CAPTURE_RESULT_LABELS,
  saveQuickCapture,
} from '@/lib/quick-capture';
import { getAllOpponents, getTechniquesByIds } from '@/lib/supabase-store';
import {
  CaptureOpponent,
  CaptureResult,
  CaptureScoreEventType,
  DraftScoreEvent,
  Opponent,
} from '@/lib/types';

type OpponentMode = CaptureOpponent['kind'];

type QuickCaptureProps = {
  athleteId: string;
  onSaved: () => void;
  onCancel: () => void;
};

const SCORING_ADDS: Array<{
  eventType: Exclude<CaptureScoreEventType, 'shido'>;
  label: string;
}> = [
  { eventType: 'ippon', label: 'Ippon' },
  { eventType: 'wazari', label: 'Waza-ari' },
  { eventType: 'osaekomi', label: 'Osaekomi' },
  { eventType: 'golden_score', label: 'Golden score' },
];

function SelectChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="chip-toggle"
    >
      {children}
    </button>
  );
}

function draftEventLine(event: DraftScoreEvent, index: number): string {
  if (event.eventType === 'shido') {
    const who = event.recipient === 'athlete' ? 'us' : 'them';
    return `${index + 1}. Shido (${who})`;
  }
  const label = SCORE_EVENT_LABELS[event.eventType];
  return event.techniqueLabel
    ? `${index + 1}. ${label} via ${event.techniqueLabel}`
    : `${index + 1}. ${label}`;
}

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
  const [events, setEvents] = useState<DraftScoreEvent[]>([]);
  const [techniqueTargetIndex, setTechniqueTargetIndex] = useState<number | null>(
    null
  );
  const [howText, setHowText] = useState('');
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

  const captureSummary =
    result === null
      ? null
      : formatCaptureScoreSummary({
          result,
          events: withSequenceOrders(events),
        });

  const techniqueTarget =
    techniqueTargetIndex !== null ? events[techniqueTargetIndex] : undefined;
  const scoringTarget =
    techniqueTarget && techniqueTarget.eventType !== 'shido'
      ? techniqueTarget
      : null;

  const addScoringEvent = (
    eventType: Exclude<CaptureScoreEventType, 'shido'>
  ) => {
    const next = [...events, { eventType }];
    setEvents(next);
    setTechniqueTargetIndex(next.length - 1);
  };

  const addShido = (recipient: 'athlete' | 'opponent') => {
    setEvents((current) => [...current, { eventType: 'shido', recipient }]);
    setTechniqueTargetIndex(null);
  };

  const removeEvent = (index: number) => {
    setEvents((current) => current.filter((_, i) => i !== index));
    setTechniqueTargetIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
  };

  const handleTechniqueChange = async (ids: string[]) => {
    if (techniqueTargetIndex === null) return;
    const techniqueId = ids[ids.length - 1];
    let techniqueLabel: string | undefined;
    if (techniqueId) {
      const techs = await getTechniquesByIds([techniqueId]);
      techniqueLabel = techs[0]?.name;
    }
    setEvents((current) =>
      current.map((event, index) => {
        if (index !== techniqueTargetIndex || event.eventType === 'shido') {
          return event;
        }
        return {
          eventType: event.eventType,
          ...(techniqueId ? { techniqueId, techniqueLabel } : {}),
        };
      })
    );
  };

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
        scoreEvents: events,
        howText,
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
            After the match. Result, opponent, score sequence, short note.
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
            <SelectChip
              key={value}
              pressed={result === value}
              onClick={() => setResult(value)}
            >
              {CAPTURE_RESULT_LABELS[value]}
            </SelectChip>
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
            <SelectChip
              key={value}
              pressed={opponentMode === value}
              onClick={() => setOpponentMode(value)}
            >
              {label}
            </SelectChip>
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
                    aria-pressed={sharedOpponentId === opponent.id}
                    onClick={() => setSharedOpponentId(opponent.id)}
                    className="list-choice"
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

      <fieldset>
        <legend className="eyebrow block text-gray-700 mb-2">
          Score sequence
        </legend>
        <div className="flex flex-wrap gap-2 mb-3">
          {SCORING_ADDS.map((item) => (
            <button
              key={item.eventType}
              type="button"
              className="chip-toggle"
              onClick={() => addScoringEvent(item.eventType)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className="chip-toggle"
            onClick={() => addShido('athlete')}
          >
            Shido us
          </button>
          <button
            type="button"
            className="chip-toggle"
            onClick={() => addShido('opponent')}
          >
            Shido them
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tap to add scores in order. Technique is optional on throws and pins.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((item, index) => (
              <li
                key={`${item.eventType}-${index}`}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-sm font-semibold text-gray-900 flex-1 min-w-[8rem]">
                  {draftEventLine(item, index)}
                </span>
                {item.eventType !== 'shido' && (
                  <SelectChip
                    pressed={techniqueTargetIndex === index}
                    onClick={() =>
                      setTechniqueTargetIndex((current) =>
                        current === index ? null : index
                      )
                    }
                  >
                    How
                  </SelectChip>
                )}
                <button
                  type="button"
                  onClick={() => removeEvent(index)}
                  className="text-sm font-semibold uppercase tracking-wide text-red-700 min-h-[44px]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {scoringTarget && (
          <div className="mt-3">
            <TechniquePicker
              label={`Technique for ${SCORE_EVENT_LABELS[scoringTarget.eventType]} (optional)`}
              selectedIds={
                scoringTarget.techniqueId ? [scoringTarget.techniqueId] : []
              }
              onChange={handleTechniqueChange}
              placeholder="Type to search a throw or pin"
            />
          </div>
        )}
      </fieldset>

      <div>
        <label className="eyebrow block text-gray-700 mb-2">
          How (free text)
        </label>
        <input
          type="text"
          value={howText}
          onChange={(e) => setHowText(e.target.value)}
          className="form-input w-full"
          placeholder="Or free text if it is not in the list"
        />
      </div>

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

      {captureSummary && (
        <p className="text-sm font-semibold text-gray-900" data-testid="capture-summary">
          {captureSummary}
        </p>
      )}

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
