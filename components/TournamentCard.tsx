'use client';

import { Tournament } from '@/lib/types';
import MatchRow from './MatchRow';
import { Pill } from '@/components/ui/Chip';

function formatPlace(place: number | undefined): string {
  if (!place) return '';
  const suffix: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${place}${suffix[place] || 'th'}`;
}

/** One tournament with its match list (sample data source only, for now). */
export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const placeStr = formatPlace(tournament.place);
  const wins = tournament.matches.filter((m) => m.result === 'win').length;
  return (
    <article className="panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="card-title-sm">{tournament.name.replace(/\s*\(SAMPLE\)\s*/i, '')}</h4>
          <p className="text-xs text-muted mt-1">
            {new Date(tournament.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · {tournament.division} · {wins}–{tournament.matches.length - wins}
          </p>
        </div>
        {placeStr ? <Pill tone={tournament.medal ? 'warning' : 'muted'} className="flex-none">{placeStr}{tournament.medal ? ` · ${tournament.medal}` : ''}</Pill> : null}
      </div>
      <ul className="mt-2">
        {tournament.matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </ul>
    </article>
  );
}
