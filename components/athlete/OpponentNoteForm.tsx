'use client';

import { useState, type FormEvent } from 'react';
import TechniquePicker from '@/components/TechniquePicker';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { Field } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';
import { StickyActions } from '@/components/ui/StickyActions';
import type { Stance } from '@/lib/types';

export type OpponentNoteFormValues = {
  opponentLabel: string;
  club: string;
  notes: string;
  tournament: string;
  stance: Stance | '';
  kumiKata: string;
  neWaza: string;
  commonCounters: string;
  weightClass: string;
  ageDivision: string;
  techniqueIds: string[];
  tokuiTechniqueIds: string[];
  newazaTechniqueIds: string[];
};

export function emptyOpponentNoteForm(): OpponentNoteFormValues {
  return {
    opponentLabel: '', club: '', notes: '', tournament: '', stance: '', kumiKata: '', neWaza: '',
    commonCounters: '', weightClass: '', ageDivision: '', techniqueIds: [], tokuiTechniqueIds: [], newazaTechniqueIds: [],
  };
}

/** Scouting note form: who + what to watch for visible; the rest disclosed. */
export function OpponentNoteForm({ onSubmit, onCancel }: { onSubmit: (values: OpponentNoteFormValues) => Promise<void>; onCancel: () => void }) {
  const [values, setValues] = useState<OpponentNoteFormValues>(emptyOpponentNoteForm());
  const [errors, setErrors] = useState<{ opponentLabel?: string; notes?: string }>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const set = <K extends keyof OpponentNoteFormValues>(key: K, value: OpponentNoteFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!values.opponentLabel.trim()) nextErrors.opponentLabel = 'Who is this note about? First name + initial.';
    if (!values.notes.trim()) nextErrors.notes = 'Write what to watch for.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="stack">
      <div className="form-grid-2">
        <Field label="Opponent" required hint="First name + last initial" error={errors.opponentLabel}>
          <input type="text" className="form-input" value={values.opponentLabel} placeholder="e.g. Sarah M" autoComplete="off" onChange={(e) => set('opponentLabel', e.target.value)} />
        </Field>
        <Field label="Club" optional>
          <input type="text" className="form-input" value={values.club} onChange={(e) => set('club', e.target.value)} />
        </Field>
      </div>
      <Field label="What to watch for" required error={errors.notes}>
        <textarea className="form-input" rows={3} value={values.notes} placeholder="Their game plan, what worked, what to do next time" onChange={(e) => set('notes', e.target.value)} />
      </Field>

      <Disclosure title="Opponent details" hint="Stance, weight, techniques, grips, counters">
        <div className="form-grid-3">
          <Field label="Stance">
            <select className="form-input" value={values.stance || ''} onChange={(e) => set('stance', e.target.value as Stance | '')}>
              <option value="">Not set</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="unknown">Unknown</option>
            </select>
          </Field>
          <Field label="Weight class">
            <input type="text" className="form-input" value={values.weightClass} onChange={(e) => set('weightClass', e.target.value)} />
          </Field>
          <Field label="Age division">
            <input type="text" className="form-input" value={values.ageDivision} onChange={(e) => set('ageDivision', e.target.value)} />
          </Field>
        </div>
        <Field label="Tournament" optional>
          <input type="text" className="form-input" value={values.tournament} onChange={(e) => set('tournament', e.target.value)} />
        </Field>
        <TechniquePicker
          label="Their tokui-waza (standing)"
          selectedIds={values.tokuiTechniqueIds}
          onChange={(ids) => set('tokuiTechniqueIds', ids)}
          categoryFilter="Tachi-waza"
          placeholder="Search their standing techniques…"
        />
        <TechniquePicker
          label="Their ne-waza"
          selectedIds={values.newazaTechniqueIds}
          onChange={(ids) => set('newazaTechniqueIds', ids)}
          categoryFilter="Ne-waza"
          placeholder="Search their ground techniques…"
        />
        <Field label="Kumi-kata" optional>
          <input type="text" className="form-input" value={values.kumiKata} onChange={(e) => set('kumiKata', e.target.value)} />
        </Field>
        <Field label="Ne-waza notes" optional>
          <input type="text" className="form-input" value={values.neWaza} onChange={(e) => set('neWaza', e.target.value)} />
        </Field>
        <Field label="Common counters" optional>
          <input type="text" className="form-input" value={values.commonCounters} placeholder="e.g. Ko-soto-gake on failed attacks" onChange={(e) => set('commonCounters', e.target.value)} />
        </Field>
      </Disclosure>

      {serverError ? <Notice tone="danger" title="Could not save">{serverError}</Notice> : null}

      <StickyActions>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save note'}</Button>
      </StickyActions>
    </form>
  );
}
