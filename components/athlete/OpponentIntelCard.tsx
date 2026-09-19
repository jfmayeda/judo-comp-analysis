'use client';

import type { OpponentNote } from '@/lib/types';
import { noteCaptureHeadline } from '@/lib/capture-score';
import { formatResultLabel, stripSampleMarker } from '@/lib/development';
import TechniqueDisplay from '@/components/TechniqueDisplay';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconPlus } from '@/components/ui/Icons';
import { MetaRow } from '@/components/ui/MetaRow';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { OpponentNoteForm, type OpponentNoteFormValues } from './OpponentNoteForm';

type Props = {
  notes: OpponentNote[];
  showAddForm: boolean;
  onToggleAdd: () => void;
  onAdd: (values: OpponentNoteFormValues) => Promise<void>;
  onDelete: (note: OpponentNote) => void;
};

function NoteItem({ note, onDelete }: { note: OpponentNote; onDelete: (note: OpponentNote) => void }) {
  const headline = noteCaptureHeadline(note);
  const text = stripSampleMarker(note.notes);
  return (
    <li className="result-row print-section" style={{ gridTemplateColumns: note.result ? 'auto 1fr' : '1fr' }}>
      {note.result ? (
        <span className={`result-badge result-badge-${note.result}`} aria-label={note.result}>
          {formatResultLabel(note.result)}
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-strong">
              vs. {note.opponentLabel}
              {note.club ? <span className="font-normal text-muted"> · {note.club}</span> : null}
            </p>
            {headline ? <p className="text-sm font-semibold text-brand-blue">{headline}</p> : null}
            {note.tournament ? <p className="text-xs text-muted">{note.tournament}</p> : null}
          </div>
          <Button variant="ghost-danger" size="sm" className="no-print flex-none" onClick={() => onDelete(note)} aria-label={`Delete note about ${note.opponentLabel}`}>
            Delete
          </Button>
        </div>
        <MetaRow
          items={[
            { label: 'Stance', value: note.stance, capitalize: true },
            { label: 'Weight', value: note.weightClass },
            { label: 'Division', value: note.ageDivision },
          ]}
        />
        {text ? <p className="text-sm text-body whitespace-pre-wrap mt-2">{text}</p> : null}
        <div className="mt-2 stack" style={{ gap: 'var(--svj-space-2)' }}>
          <TechniqueDisplay techniqueIds={note.techniqueIds} label="Their techniques" />
          {note.kumiKata ? <p className="text-sm"><span className="meta-key">Grips</span> <span className="text-body">{note.kumiKata}</span></p> : null}
          {note.neWaza ? <p className="text-sm"><span className="meta-key">Ne-waza</span> <span className="text-body">{note.neWaza}</span></p> : null}
          {note.commonCounters ? <p className="text-sm"><span className="meta-key">Counters</span> <span className="text-body">{note.commonCounters}</span></p> : null}
        </div>
      </div>
    </li>
  );
}

/** Scouting notes and captured results against specific opponents, newest first. */
export function OpponentIntelCard({ notes, showAddForm, onToggleAdd, onAdd, onDelete }: Props) {
  return (
    <section id="opponent-notes" className="card" aria-labelledby="opponents-heading">
      <SectionHeading
        id="opponents-heading"
        title="Opponent intel"
        count={notes.length}
        action={
          !showAddForm ? (
            <Button variant="ghost" size="sm" onClick={onToggleAdd} className="no-print">
              <IconPlus size={16} /> Scouting note
            </Button>
          ) : null
        }
      />
      {showAddForm ? (
        <div className="sheet mb-4 no-print" style={{ padding: 'var(--svj-space-4)' }}>
          <h3 className="card-title-sm mb-3">New scouting note</h3>
          <OpponentNoteForm onSubmit={onAdd} onCancel={onToggleAdd} />
        </div>
      ) : null}
      {notes.length === 0 ? (
        <EmptyState
          compact
          title="No opponent notes yet"
          body="Capture a match result after competing, or add a scouting note before the next matchup."
        />
      ) : (
        <ul>
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
