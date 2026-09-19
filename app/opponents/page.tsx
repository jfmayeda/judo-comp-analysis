'use client';

import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import { Opponent, Stance } from '@/lib/types';
import { getAllOpponents, createOpponent, updateOpponent, deleteOpponent } from '@/lib/supabase-store';
import { useCoachGate } from '@/lib/use-coach-gate';
import TechniquePicker from '@/components/TechniquePicker';
import TechniqueDisplay from '@/components/TechniqueDisplay';
import { AppFrame } from '@/components/AppFrame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Disclosure } from '@/components/ui/Disclosure';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { IconPlus, IconSearch } from '@/components/ui/Icons';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MetaRow } from '@/components/ui/MetaRow';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StickyActions } from '@/components/ui/StickyActions';

type OpponentFormValues = {
  firstName: string;
  lastInitial: string;
  club: string;
  stance: Stance | '';
  kumiKata: string;
  neWaza: string;
  commonCounters: string;
  weightClass: string;
  ageDivision: string;
  notes: string;
  techniqueIds: string[];
};

const emptyForm = (): OpponentFormValues => ({
  firstName: '', lastInitial: '', club: '', stance: '', kumiKata: '', neWaza: '', commonCounters: '',
  weightClass: '', ageDivision: '', notes: '', techniqueIds: [],
});

function opponentToForm(opponent: Opponent): OpponentFormValues {
  return {
    firstName: opponent.firstName, lastInitial: opponent.lastInitial, club: opponent.club, stance: opponent.stance || '',
    kumiKata: opponent.kumiKata, neWaza: opponent.neWaza, commonCounters: opponent.commonCounters,
    weightClass: opponent.weightClass, ageDivision: opponent.ageDivision, notes: opponent.notes, techniqueIds: opponent.techniqueIds || [],
  };
}

function OpponentForm({ initial, editing, onSubmit, onCancel }: { initial: OpponentFormValues; editing: boolean; onSubmit: (values: OpponentFormValues) => Promise<void>; onCancel: () => void }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<{ firstName?: string; lastInitial?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof OpponentFormValues>(key: K, value: OpponentFormValues[K]) => setValues((c) => ({ ...c, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!values.firstName.trim()) next.firstName = 'First name is required.';
    if (values.lastInitial.length !== 1) next.lastInitial = 'One letter only — never the full last name.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Could not save opponent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="stack">
      <div className="form-grid-2">
        <Field label="First name" required error={errors.firstName}>
          <input type="text" className="form-input" value={values.firstName} autoComplete="off" onChange={(e) => set('firstName', e.target.value)} />
        </Field>
        <Field label="Last initial" required hint="One letter only" error={errors.lastInitial}>
          <input type="text" className="form-input uppercase" maxLength={1} value={values.lastInitial} autoComplete="off" onChange={(e) => set('lastInitial', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())} />
        </Field>
      </div>
      <Field label="Club" optional>
        <input type="text" className="form-input" value={values.club} placeholder="e.g. Peninsula Judo" onChange={(e) => set('club', e.target.value)} />
      </Field>
      <Field label="What to watch for" optional>
        <textarea className="form-input" rows={3} value={values.notes} placeholder="General scouting notes about this opponent" onChange={(e) => set('notes', e.target.value)} />
      </Field>
      <Disclosure title="Details" hint="Stance, weight, techniques, grips, counters" defaultOpen={editing}>
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
            <input type="text" className="form-input" value={values.weightClass} placeholder="e.g. -57kg" onChange={(e) => set('weightClass', e.target.value)} />
          </Field>
          <Field label="Age division">
            <input type="text" className="form-input" value={values.ageDivision} placeholder="e.g. Juvenile" onChange={(e) => set('ageDivision', e.target.value)} />
          </Field>
        </div>
        <TechniquePicker label="Tokui-waza" selectedIds={values.techniqueIds} onChange={(ids) => set('techniqueIds', ids)} placeholder="Search techniques…" />
        <Field label="Kumi-kata (grip style)" optional>
          <input type="text" className="form-input" value={values.kumiKata} onChange={(e) => set('kumiKata', e.target.value)} />
        </Field>
        <Field label="Ne-waza" optional>
          <input type="text" className="form-input" value={values.neWaza} onChange={(e) => set('neWaza', e.target.value)} />
        </Field>
        <Field label="Common counters" optional>
          <input type="text" className="form-input" value={values.commonCounters} placeholder="e.g. Ko-soto-gake on failed attacks" onChange={(e) => set('commonCounters', e.target.value)} />
        </Field>
      </Disclosure>
      {serverError ? <Notice tone="danger" title="Could not save">{serverError}</Notice> : null}
      <StickyActions>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add opponent'}</Button>
      </StickyActions>
    </form>
  );
}

export default function OpponentsPage() {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Opponent | null>(null);
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const loadOpponents = useCallback(async () => {
    try {
      setOpponents(await getAllOpponents());
    } catch (error) {
      console.error('Error loading opponents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const { ready, checking } = useCoachGate({ onReady: loadOpponents });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return opponents;
    return opponents.filter((o) => o.firstName.toLowerCase().includes(q) || o.lastInitial.toLowerCase().includes(q) || o.club.toLowerCase().includes(q));
  }, [opponents, query]);

  const openForm = (opponent: Opponent | null) => {
    setFlash(null);
    setEditingOpponent(opponent);
    setShowForm(true);
    requestAnimationFrame(() => sheetRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingOpponent(null);
  };

  if (!ready || checking || loading) {
    return <LoadingScreen label="Loading opponents" />;
  }

  return (
    <AppFrame eyebrow="Opponents">
      <PageHeader
        kicker="Shared club directory"
        title="Opponents"
        lead={`${opponents.length} opponent${opponents.length === 1 ? '' : 's'} · reused across every athlete's scouting notes and captures`}
        actions={!showForm ? <Button onClick={() => openForm(null)}><IconPlus size={18} /> Add opponent</Button> : null}
      />

      <div className="stack-lg">
        {flash ? <Notice tone="success" title={flash} /> : null}

        {showForm ? (
          <div ref={sheetRef} className="sheet" role="region" aria-labelledby="opponent-form-title">
            <div className="sheet-header">
              <h2 id="opponent-form-title" className="card-title">{editingOpponent ? `Edit ${editingOpponent.firstName} ${editingOpponent.lastInitial}.` : 'New opponent'}</h2>
            </div>
            <OpponentForm
              key={editingOpponent?.id ?? 'new'}
              initial={editingOpponent ? opponentToForm(editingOpponent) : emptyForm()}
              editing={editingOpponent !== null}
              onCancel={closeForm}
              onSubmit={async (values) => {
                const payload = { ...values, stance: (values.stance || null) as Stance };
                if (editingOpponent) await updateOpponent(editingOpponent.id, payload);
                else await createOpponent(payload);
                closeForm();
                setFlash(`${values.firstName} ${values.lastInitial}. ${editingOpponent ? 'updated' : 'added'}`);
                await loadOpponents();
              }}
            />
          </div>
        ) : null}

        {opponents.length > 0 ? (
          <div className="search-field">
            <IconSearch className="search-field-icon" />
            <label htmlFor="opponent-search" className="visually-hidden">Search opponents</label>
            <input id="opponent-search" type="search" className="form-input form-input--search" placeholder="Search by name or club…" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          </div>
        ) : null}

        {opponents.length === 0 ? (
          <EmptyState
            title="No shared opponents yet"
            body="Add opponents your athletes meet often so scouting notes and captures can reuse them."
            actions={<Button onClick={() => openForm(null)}><IconPlus size={18} /> Add opponent</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState compact title={`No opponents match “${query.trim()}”`} actions={<Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button>} />
        ) : (
          <section aria-labelledby="opponent-list-heading">
            <SectionHeading id="opponent-list-heading" title="Directory" count={filtered.length} />
            <div className="card-grid">
              {filtered.map((opponent) => (
                <Card key={opponent.id} as="article" className="flex flex-col gap-3">
                  <div>
                    <h2 className="card-title">{opponent.firstName} {opponent.lastInitial}.</h2>
                    {opponent.club ? <p className="text-sm text-muted">{opponent.club}</p> : null}
                  </div>
                  <MetaRow
                    items={[
                      { label: 'Stance', value: opponent.stance, capitalize: true },
                      { label: 'Weight', value: opponent.weightClass },
                      { label: 'Division', value: opponent.ageDivision },
                    ]}
                  />
                  <TechniqueDisplay techniqueIds={opponent.techniqueIds} label="Tokui-waza" />
                  {opponent.kumiKata ? <p className="text-sm"><span className="meta-key">Grips</span> <span className="text-body">{opponent.kumiKata}</span></p> : null}
                  {opponent.neWaza ? <p className="text-sm"><span className="meta-key">Ne-waza</span> <span className="text-body">{opponent.neWaza}</span></p> : null}
                  {opponent.commonCounters ? <p className="text-sm"><span className="meta-key">Counters</span> <span className="text-body">{opponent.commonCounters}</span></p> : null}
                  {opponent.notes ? <p className="text-sm text-body">{opponent.notes}</p> : null}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2 justify-end">
                    <Button variant="ghost-danger" size="sm" onClick={() => setPendingDelete(opponent)}>Delete</Button>
                    <Button variant="secondary" size="sm" onClick={() => openForm(opponent)}>Edit</Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        destructive
        title={pendingDelete ? `Delete ${pendingDelete.firstName} ${pendingDelete.lastInitial}.?` : ''}
        body="Any scouting notes linked to this opponent become one-off notes. Nothing else is removed."
        confirmLabel="Delete opponent"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteOpponent(pendingDelete.id);
          await loadOpponents();
        }}
      />
    </AppFrame>
  );
}
