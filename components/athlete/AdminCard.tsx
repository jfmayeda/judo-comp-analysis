import type { Coach } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Chip';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { coachDisplayName } from './AthleteForm';

type Props = {
  preferredCoach: Coach | null;
  isCoachLocked: boolean;
  coachIsExclusive: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onEdit: () => void;
};

/** Administrative details, kept last and visually quiet; delete stays clearly separated. */
export function AdminCard({ preferredCoach, isCoachLocked, coachIsExclusive, isAdmin, onDelete, onEdit }: Props) {
  return (
    <section className="card no-print" aria-labelledby="admin-heading">
      <SectionHeading id="admin-heading" title="Administration" />
      <div className="stack">
        <div>
          <span className="meta-key block mb-1">Preferred coach</span>
          {preferredCoach ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-strong">{coachDisplayName(preferredCoach)}</span>
              {isCoachLocked ? <Pill tone="navy">Locked</Pill> : null}
              {coachIsExclusive ? <Pill tone="outline">Exclusive</Pill> : null}
            </div>
          ) : (
            <p className="text-sm text-muted">
              No preference.{' '}
              <button type="button" className="btn-link" onClick={onEdit}>Set one</button>
            </p>
          )}
        </div>
        {isAdmin ? (
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted">
              Opt-out requests permanently delete this athlete and every linked note, promotion and tournament entry.
            </p>
            <Button variant="danger" size="sm" onClick={onDelete} className="flex-none">Opt-out / delete</Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
