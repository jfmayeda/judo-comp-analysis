import Link from 'next/link';
import type { AthleteWithNotes, TournamentDayEntry } from '@/lib/types';
import { isSampleAthlete, tallyResults } from '@/lib/development';
import { SampleDataTag } from '@/components/ui/SampleData';
import { Card } from '@/components/ui/Card';
import { BeltMark } from '@/components/ui/BeltMark';
import { Pill } from '@/components/ui/Chip';
import { IconChevronRight } from '@/components/ui/Icons';
import { MetaRow } from '@/components/ui/MetaRow';

export function athleteDisplayName(athlete: Pick<AthleteWithNotes, 'firstName' | 'lastInitial'>): string {
  return `${athlete.firstName} ${athlete.lastInitial}.`;
}

/** Roster card: identity first, then the two facts a coach scans for, then activity counts. */
export function AthleteCard({ athlete, todayEntry }: { athlete: AthleteWithNotes; todayEntry?: TournamentDayEntry | null }) {
  const tally = tallyResults(athlete.opponentNotes);
  const scoutingNotes = athlete.opponentNotes.length - tally.total;
  const techniqueCount = (athlete.tokuiTechniqueIds?.length ?? 0) + (athlete.newazaTechniqueIds?.length ?? 0);

  return (
    <Card as={Link} href={`/athletes/${athlete.id}`} className="flex flex-col gap-3" aria-label={`${athleteDisplayName(athlete)} — open profile`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="card-title">{athleteDisplayName(athlete)}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <BeltMark belt={athlete.currentBelt} />
            {isSampleAthlete(athlete) ? <SampleDataTag label="Sample" /> : null}
          </div>
        </div>
        {todayEntry ? (
          <Pill tone="brand" className="flex-none">
            Today{todayEntry.matNumber ? ` · Mat ${todayEntry.matNumber}` : ''}
          </Pill>
        ) : null}
      </div>

      <MetaRow
        items={[
          { label: 'Stance', value: athlete.stance, capitalize: true },
          { label: 'Weight', value: athlete.weightClass },
          { label: 'Division', value: athlete.ageDivision },
        ]}
      />

      {athlete.developmentAreas ? (
        <p className="text-sm text-body line-clamp-2">
          <span className="meta-key">Focus</span>{' '}
          <span className="text-strong">{athlete.developmentAreas}</span>
        </p>
      ) : null}

      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3 text-xs text-muted">
        <span className="min-w-0">
          {[
            techniqueCount ? `${techniqueCount} technique${techniqueCount === 1 ? '' : 's'}` : null,
            scoutingNotes ? `${scoutingNotes} scouting note${scoutingNotes === 1 ? '' : 's'}` : null,
            tally.total ? `${tally.wins}W ${tally.losses}L` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'No details yet'}
        </span>
        <IconChevronRight size={18} className="flex-none text-brand-blue" />
      </div>
    </Card>
  );
}
