import type { AthleteWithNotes } from '@/lib/types';
import { stripSampleMarker } from '@/lib/development';
import { SectionHeading } from '@/components/ui/SectionHeading';

/** Development focus and coaching notes: what the coach wants to say matside. */
export function FocusCard({ athlete, onEdit }: { athlete: AthleteWithNotes; onEdit: () => void }) {
  const focus = athlete.developmentAreas.trim();
  const notes = stripSampleMarker(athlete.notes);
  return (
    <section className="card" aria-labelledby="focus-heading">
      <SectionHeading id="focus-heading" title="Development focus" />
      {focus ? (
        <p className="text-lg font-semibold text-strong leading-snug">{focus}</p>
      ) : (
        <p className="text-sm text-muted">
          No focus set yet.{' '}
          <button type="button" className="btn-link" onClick={onEdit}>Add one</button>
        </p>
      )}
      {notes ? (
        <div className="mt-4">
          <span className="meta-key block mb-1">Coaching notes</span>
          <p className="text-sm text-body whitespace-pre-wrap">{notes}</p>
        </div>
      ) : null}
    </section>
  );
}
