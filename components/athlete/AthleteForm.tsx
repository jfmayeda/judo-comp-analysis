'use client';

import { useState, type FormEvent } from 'react';
import TechniquePicker from '@/components/TechniquePicker';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { Field } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Notice';
import { StickyActions } from '@/components/ui/StickyActions';
import { getBeltOptions } from '@/lib/belt-utils';
import {
  athleteFormToPayload,
  hasCompetitionDetails,
  hasTechniqueDetails,
  normalizeLastInitial,
  validateAthleteForm,
  type AthleteFormErrors,
  type AthleteFormValues,
} from '@/lib/athlete-form';
import type { Coach, JudoBelt, Stance } from '@/lib/types';

export type AthleteFormProps = {
  mode: 'create' | 'edit';
  initial: AthleteFormValues;
  /** When provided, the coach-assignment group is shown (edit). */
  coaches?: Coach[];
  onSubmit: (payload: ReturnType<typeof athleteFormToPayload>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

export function coachDisplayName(coach: Pick<Coach, 'email'>): string {
  return coach.email.split('@')[0];
}

/**
 * Athlete create/edit form. Essentials are always visible; competition details,
 * techniques/notes and coach assignment are progressively disclosed.
 */
export function AthleteForm({ mode, initial, coaches, onSubmit, onCancel, submitLabel }: AthleteFormProps) {
  const [values, setValues] = useState<AthleteFormValues>(initial);
  const [errors, setErrors] = useState<AthleteFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AthleteFormValues>(key: K, value: AthleteFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateAthleteForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      await onSubmit(athleteFormToPayload(values));
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Could not save athlete.');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <form onSubmit={handleSubmit} noValidate className="stack">
      <div className="stack">
        <div className="form-grid-2">
          <Field label="First name" required error={errors.firstName}>
            <input
              type="text"
              className="form-input"
              value={values.firstName}
              autoComplete="off"
              autoCapitalize="words"
              onChange={(e) => set('firstName', e.target.value)}
            />
          </Field>
          <Field label="Last initial" required hint="One letter only" error={errors.lastInitial}>
            <input
              type="text"
              className="form-input uppercase"
              value={values.lastInitial}
              maxLength={1}
              autoComplete="off"
              inputMode="text"
              onChange={(e) => set('lastInitial', normalizeLastInitial(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Belt" optional>
          <select
            className="form-input"
            value={values.currentBelt}
            onChange={(e) => set('currentBelt', e.target.value as JudoBelt)}
          >
            {getBeltOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Disclosure
        title="Competition details"
        hint="Stance, weight class, age division"
        defaultOpen={isEdit || hasCompetitionDetails(values)}
      >
        <div className="form-grid-3">
          <Field label="Stance">
            <select
              className="form-input"
              value={values.stance || ''}
              onChange={(e) => set('stance', e.target.value as Stance | '')}
            >
              <option value="">Not set</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="unknown">Unknown</option>
            </select>
          </Field>
          <Field label="Weight class">
            <input
              type="text"
              className="form-input"
              value={values.weightClass}
              placeholder="e.g. -57kg"
              onChange={(e) => set('weightClass', e.target.value)}
            />
          </Field>
          <Field label="Age division">
            <input
              type="text"
              className="form-input"
              value={values.ageDivision}
              placeholder="e.g. Juvenile"
              onChange={(e) => set('ageDivision', e.target.value)}
            />
          </Field>
        </div>
      </Disclosure>

      <Disclosure
        title="Techniques & coaching notes"
        hint="Tokui-waza, ne-waza, grips, development focus"
        defaultOpen={isEdit || hasTechniqueDetails(values)}
      >
        <TechniquePicker
          label="Tokui-waza (standing)"
          selectedIds={values.tokuiTechniqueIds}
          onChange={(ids) => set('tokuiTechniqueIds', ids)}
          categoryFilter="Tachi-waza"
          placeholder="Search throws, foot sweeps…"
        />
        <Field label="Tokui-waza notes" optional>
          <input
            type="text"
            className="form-input"
            value={values.tokuiWaza}
            placeholder="e.g. Strong right-sided entries"
            onChange={(e) => set('tokuiWaza', e.target.value)}
          />
        </Field>
        <TechniquePicker
          label="Ne-waza (ground)"
          selectedIds={values.newazaTechniqueIds}
          onChange={(ids) => set('newazaTechniqueIds', ids)}
          categoryFilter="Ne-waza"
          placeholder="Search pins, chokes, armbars…"
        />
        <Field label="Ne-waza notes" optional>
          <input
            type="text"
            className="form-input"
            value={values.neWaza}
            placeholder="e.g. Solid pins, working on turtle attacks"
            onChange={(e) => set('neWaza', e.target.value)}
          />
        </Field>
        <Field label="Kumi-kata (grip style)" optional>
          <input
            type="text"
            className="form-input"
            value={values.kumiKata}
            placeholder="e.g. High lapel grip, quick hand changes"
            onChange={(e) => set('kumiKata', e.target.value)}
          />
        </Field>
        <Field label="Development focus" optional hint="What this athlete is working on right now. Shown first matside.">
          <input
            type="text"
            className="form-input"
            value={values.developmentAreas}
            onChange={(e) => set('developmentAreas', e.target.value)}
          />
        </Field>
        <Field label="Coaching notes" optional>
          <textarea
            className="form-input"
            rows={3}
            value={values.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </Disclosure>

      {coaches ? (
        <Disclosure
          title="Coach assignment"
          hint="Preferred coach for tournament days"
          defaultOpen={Boolean(values.preferredCoachId)}
        >
          <Field label="Preferred coach" hint="Used by auto-assign on tournament day.">
            <select
              className="form-input"
              value={values.preferredCoachId || ''}
              onChange={(e) => set('preferredCoachId', e.target.value || null)}
            >
              <option value="">No preference</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coachDisplayName(coach)}
                </option>
              ))}
            </select>
          </Field>
          {values.preferredCoachId ? (
            <div className="stack" style={{ gap: 0 }}>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={values.isCoachLocked}
                  onChange={(e) => set('isCoachLocked', e.target.checked)}
                />
                <span>
                  <span className="font-semibold text-strong block">Lock to preferred coach</span>
                  <span className="text-xs text-muted">Auto-assign must always give this athlete their preferred coach.</span>
                </span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={values.coachIsExclusive}
                  onChange={(e) => set('coachIsExclusive', e.target.checked)}
                />
                <span>
                  <span className="font-semibold text-strong block">Coach is exclusive</span>
                  <span className="text-xs text-muted">This coach should not be assigned to anyone else.</span>
                </span>
              </label>
            </div>
          ) : null}
        </Disclosure>
      ) : null}

      {serverError ? <Notice tone="danger" title="Could not save">{serverError}</Notice> : null}

      <StickyActions status={saving ? 'Saving…' : mode === 'create' ? 'Only name and initial are required.' : undefined}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel ?? (mode === 'create' ? 'Add athlete' : 'Save changes')}
        </Button>
      </StickyActions>
    </form>
  );
}
