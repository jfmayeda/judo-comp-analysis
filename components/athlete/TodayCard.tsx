import Link from 'next/link';
import type { TournamentDayEntry } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatTile } from '@/components/ui/StatTile';

/** Today's mat / coach / time. Rendered only when the athlete is on today's tournament day. */
export function TodayCard({ assignment, coachName }: { assignment: TournamentDayEntry; coachName: string | null }) {
  return (
    <section className="card" aria-labelledby="today-heading">
      <SectionHeading
        id="today-heading"
        title="Today"
        action={<Button as={Link} href="/tournament-day/assign" variant="ghost" size="sm">Assignments</Button>}
      />
      <div className="stat-grid" style={{ gridTemplateColumns: 'auto minmax(0, 1fr) minmax(0, 1fr)' }}>
        <StatTile label="Mat" value={assignment.matNumber || '—'} tone="accent" />
        <StatTile label="Coach" size="sm" value={assignment.noCoachNeeded ? 'Not needed' : coachName || 'Unassigned'} />
        <StatTile label="Time" size="sm" value={assignment.timeWindow || '—'} />
      </div>
    </section>
  );
}
