'use client';

import { Tournament } from '@/lib/types';
import MatchRow from './MatchRow';
import { Card } from '@/components/ui/Card';

type TournamentCardProps = {
  tournament: Tournament;
};

function getMedalIcon(medal: string | undefined): string {
  if (!medal) return '';
  const icons: Record<string, string> = {
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
  };
  return icons[medal] || '';
}

function formatPlace(place: number | undefined): string {
  if (!place) return '';
  const suffix: Record<number, string> = {
    1: 'st',
    2: 'nd',
    3: 'rd',
  };
  return `${place}${suffix[place] || 'th'}`;
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const medalIcon = getMedalIcon(tournament.medal);
  const placeStr = formatPlace(tournament.place);

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900 mb-1">
            {tournament.name}
          </h4>
          <p className="text-sm text-gray-600">
            {new Date(tournament.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            {' • '}
            {tournament.division}
          </p>
        </div>
        {(placeStr || medalIcon) && (
          <div className="text-right ml-4">
            {placeStr && (
              <p className="text-lg font-bold text-gray-900">
                {placeStr} {medalIcon}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Matches
        </h5>
        <div className="space-y-2">
          {tournament.matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      </div>
    </Card>
  );
}
