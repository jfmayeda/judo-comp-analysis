'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import TechniquePicker from '@/components/TechniquePicker';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Disclosure } from '@/components/ui/Disclosure';
import { Field } from '@/components/ui/Field';
import { IconClose, IconPlus } from '@/components/ui/Icons';
import { Notice } from '@/components/ui/Notice';
import { StickyActions } from '@/components/ui/StickyActions';
import {
  formatCaptureScoreSummary,
  SCORE_EVENT_LABELS,
  withSequenceOrders,
} from '@/lib/capture-score';
import { CAPTURE_RESULT_LABELS, saveQuickCapture } from '@/lib/quick-capture';
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
  athleteName?: string;
  /** Called after a successful save with the human-readable summary. */
  onSaved: (summary: string) => void;
  onCancel: () => void;
};

const SCORING_ADDS: Array<{ eventType: Exclude<CaptureScoreEventType, 'shido'>; label: string }> = [
  { eventType: 'ippon', label: 'Ippon' },
  { eventType: 'wazari', label: 'Waza-ari' },
  { eventType: 'osaekomi', label: 'Osaekomi' },
  { eventType: 'golden_score', label: 'Golden score' },
];

export function draftEventLine(event: DraftScoreEvent, index: number): string {
  if (event.eventType === 'shido') {
    const who = event.recipient === 'athlete' ? 'us' : 'them';
    return `${index + 1}. Shido (${who})`;
  }
  const label = SCORE_EVENT_LABELS[event.eventType];
  return event.techniqueLabel ? `${index + 1}. ${label} via ${event.techniqueLabel}` : `${index + 1}. ${label}`;
}

/**
 * Post-match capture. Minimum path: Result → Save (opponent defaults to
 * Unknown). Score sequence, technique, opponent identity and notes are
 * optional layers. Persistence contract (saveQuickCapture) is unchanged.
 */
export default function QuickCapture({ athleteId, athleteName, onSaved, onCancel }: QuickCaptureProps) {
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('unknown');
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [opponentQuery, setOpponentQuery] = useState('');
  const [sharedOpponentId, setSharedOpponentId] = useState('');
  const [oneOffFirst, setOneOffFirst] = useState('');
  const [oneOffInitial, setOneOffInitial] = useState('');
  const [events, setEvents] = useState<DraftScoreEvent[]>([]);
  const [techniqueTargetIndex, setTechniqueTargetIndex] = useState<number | null>(null);
  const [howText, setHowText] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    getAllOpponents().then(setOpponents).catch(() => setOpponents([]));
    headingRef.current?.focus();
  }, []);

  const filteredOpponents = useMemo(() => {
    const query = opponentQuery.trim().toLowerCase();
    if (!query) return opponents;
    return opponents.filter(
      (opponent) =>
        opponent.firstName.toLowerCase().includes(query) ||
        opponent.lastInitial.toLowerCase().includes(query) ||
        opponent.club.toLowerCase().includes(query),
    );
  }, [opponents, opponentQuery]);

  const opponentReady =
    opponentMode === 'unknown' ||
    (opponentMode === 'shared' && sharedOpponentId !== '') ||
    (opponentMode === 'oneOff' && oneOffFirst.trim() !== '' && oneOffInitial.trim().length === 1);

  const canSave = result !== null && opponentReady;

  const captureSummary =
    result === null ? null : formatCaptureScoreSummary({ result, events: withSequenceOrders(events) });

  const techniqueTarget = techniqueTargetIndex !== null ? events[techniqueTargetIndex] : undefined;
  const scoringTarget = techniqueTarget && techniqueTarget.eventType !== 'shido' ? techniqueTarget : null;

  const addScoringEvent = (eventType: Exclude<CaptureScoreEventType, 'shido'>) => {
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
      if (current === null || current === index) return null;
      return current > index ? current - 1 : current;
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
        if (index !== techniqueTargetIndex || event.eventType === 'shido') return event;
        return { eventType: event.eventType, ...(techniqueId ? { techniqueId, techniqueLabel } : {}) };
      }),
    );
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!result || !canSave) return;

    let opponent: CaptureOpponent;
    if (opponentMode === 'unknown') {
      opponent = { kind: 'unknown' };
    } else if (opponentMode === 'oneOff') {
      opponent = { kind: 'oneOff', firstName: oneOffFirst, lastInitial: oneOffInitial };
    } else {
      opponent = { kind: 'shared', opponentId: sharedOpponentId };
    }

    setSaving(true);
    setError(null);
    try {
      await saveQuickCapture({ athleteId, opponent, result, scoreEvents: events, howText, note });
      onSaved(captureSummary ?? CAPTURE_RESULT_LABELS[result]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save capture');
    } finally {
      setSaving(false);
    }
  };

  const opponentLabel =
    opponentMode === 'unknown'
      ? 'Unknown opponent'
      : opponentMode === 'shared'
        ? (() => {
            const chosen = opponents.find((o) => o.id === sharedOpponentId);
            return chosen ? `${chosen.firstName} ${chosen.lastInitial}.` : 'Pick from club list';
          })()
        : oneOffFirst.trim()
          ? `${oneOffFirst.trim()} ${oneOffInitial.toUpperCase()}.`
          : 'New opponent';

  return (
    <form id="quick-capture" onSubmit={handleSave} className="sheet no-print" aria-labelledby="quick-capture-title" data-testid="quick-capture">
      <div className="sheet-header">
        <div className="min-w-0">
          <h2 id="quick-capture-title" ref={headingRef} tabIndex={-1} className="card-title outline-none">
            Quick capture
          </h2>
          <p className="text-sm text-muted mt-1">
            {athleteName ? `${athleteName} · ` : ''}Result first. Everything else is optional.
          </p>
        </div>
        <button type="button" className="btn-icon -mr-2 -mt-1" onClick={onCancel} aria-label="Close quick capture">
          <IconClose />
        </button>
      </div>

      <div className="stack">
        <fieldset className="min-w-0">
          <legend className="field-label mb-2">
            Result <span className="field-required" aria-hidden>*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(['win', 'loss', 'other'] as const).map((value) => (
              <Chip key={value} size="lg" pressed={result === value} onClick={() => setResult(value)} data-testid={`result-${value}`}>
                {CAPTURE_RESULT_LABELS[value]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="field-label mb-2">
            Score sequence <span className="field-optional">optional</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {SCORING_ADDS.map((item) => (
              <Chip key={item.eventType} onClick={() => addScoringEvent(item.eventType)} data-testid={`add-${item.eventType}`}>
                <IconPlus size={14} /> {item.label}
              </Chip>
            ))}
            <Chip onClick={() => addShido('athlete')}><IconPlus size={14} /> Shido us</Chip>
            <Chip onClick={() => addShido('opponent')}><IconPlus size={14} /> Shido them</Chip>
          </div>

          {events.length > 0 ? (
            <ol className="mt-3 panel stack" style={{ gap: 'var(--svj-space-1)' }} aria-label="Score sequence">
              {events.map((item, index) => (
                <li key={`${item.eventType}-${index}`} className="flex items-center gap-2 min-h-11">
                  <span className="text-sm font-semibold text-strong flex-1 min-w-0">{draftEventLine(item, index)}</span>
                  {item.eventType !== 'shido' ? (
                    <Chip
                      className="btn-sm"
                      pressed={techniqueTargetIndex === index}
                      onClick={() => setTechniqueTargetIndex((current) => (current === index ? null : index))}
                    >
                      {item.techniqueLabel ? 'Change' : 'How?'}
                    </Chip>
                  ) : null}
                  <button type="button" className="btn-icon" onClick={() => removeEvent(index)} aria-label={`Remove ${draftEventLine(item, index)}`}>
                    <IconClose size={18} />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="field-hint mt-2">Tap scores in the order they happened. Add the technique if you know it.</p>
          )}

          {scoringTarget ? (
            <div className="mt-3">
              <TechniquePicker
                label={`Technique for ${SCORE_EVENT_LABELS[scoringTarget.eventType]}`}
                selectedIds={scoringTarget.techniqueId ? [scoringTarget.techniqueId] : []}
                onChange={handleTechniqueChange}
                placeholder="Search a throw or pin…"
                allowCustom={false}
              />
            </div>
          ) : null}
        </fieldset>

        <Disclosure title="Opponent" hint={opponentLabel} defaultOpen={false}>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['unknown', 'Unknown'],
                ['shared', 'Club list'],
                ['oneOff', 'New initials'],
              ] as const
            ).map(([value, label]) => (
              <Chip key={value} pressed={opponentMode === value} onClick={() => setOpponentMode(value)}>
                {label}
              </Chip>
            ))}
          </div>

          {opponentMode === 'shared' ? (
            <div className="stack" style={{ gap: 'var(--svj-space-2)' }}>
              <Field label="Find opponent">
                <input
                  type="search"
                  value={opponentQuery}
                  onChange={(e) => setOpponentQuery(e.target.value)}
                  placeholder="First name or club"
                  className="form-input"
                  autoComplete="off"
                />
              </Field>
              <div className="choice-list" role="listbox" aria-label="Shared opponents">
                {filteredOpponents.length === 0 ? (
                  <p className="p-3 text-sm text-muted">No shared opponents match. Use New initials.</p>
                ) : (
                  filteredOpponents.map((opponent) => (
                    <button
                      key={opponent.id}
                      type="button"
                      role="option"
                      aria-selected={sharedOpponentId === opponent.id}
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
          ) : null}

          {opponentMode === 'oneOff' ? (
            <div className="grid grid-cols-3 gap-3">
              <Field label="First name" className="col-span-2">
                <input type="text" value={oneOffFirst} onChange={(e) => setOneOffFirst(e.target.value)} className="form-input" autoComplete="off" />
              </Field>
              <Field label="Initial">
                <input
                  type="text"
                  value={oneOffInitial}
                  onChange={(e) => setOneOffInitial(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())}
                  className="form-input uppercase"
                  maxLength={1}
                  autoComplete="off"
                />
              </Field>
            </div>
          ) : null}
        </Disclosure>

        <Disclosure title="Add detail" hint="How it happened, a short note" defaultOpen={false}>
          <Field label="How" optional>
            <input
              type="text"
              value={howText}
              onChange={(e) => setHowText(e.target.value)}
              className="form-input"
              placeholder="Free text if the technique is not in the list"
            />
          </Field>
          <Field label="Note" optional hint="One or two lines. The phone keyboard handles voice.">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="form-input" />
          </Field>
        </Disclosure>

        {error ? <Notice tone="danger" title="Capture not saved">{error}</Notice> : null}
      </div>

      <StickyActions
        status={
          captureSummary ? (
            <span data-testid="capture-summary" className="text-strong font-semibold">{captureSummary}</span>
          ) : (
            'Pick a result to enable Save.'
          )
        }
      >
        <Button type="submit" disabled={!canSave || saving} data-testid="save-capture">
          {saving ? 'Saving…' : 'Save capture'}
        </Button>
      </StickyActions>
    </form>
  );
}
