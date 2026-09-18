'use client';

import { useEffect, useState } from 'react';
import type { AthleteActivity, AthleteWithNotes } from '@/lib/types';
import type { BadgeWithProgress } from '@/lib/badge-store';
import { getAthleteActivity } from '@/lib/activity-store';
import { getAthleteBadgeProgress } from '@/lib/badge-store';
import { capturedResults, formatResultLabel, tallyResults } from '@/lib/development';
import BadgesSection from '@/components/BadgesSection';
import CareerTimeline from '@/components/CareerTimeline';
import TournamentCard from '@/components/TournamentCard';
import { LoadingBlock } from '@/components/ui/LoadingScreen';
import { SampleBand } from '@/components/ui/SampleData';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatTile } from '@/components/ui/StatTile';

type Props = {
  athlete: AthleteWithNotes;
  isSample: boolean;
  onQuickCapture: () => void;
};

/**
 * One development story per athlete:
 *  1. Captured results — real, persisted Quick Capture data (opponent_notes with a result).
 *  2. Sample tournament history + sample badges — only for sample athletes, clearly banded.
 * Real athletes without captures get an honest empty state, not a hidden section.
 */
export function DevelopmentCard({ athlete, isSample, onQuickCapture }: Props) {
  const [activity, setActivity] = useState<AthleteActivity | null>(null);
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [loadingSample, setLoadingSample] = useState(isSample);

  useEffect(() => {
    if (!isSample) {
      setLoadingSample(false);
      return;
    }
    let cancelled = false;
    Promise.all([getAthleteActivity(athlete.id), getAthleteBadgeProgress(athlete.id)])
      .then(([activityData, badgeData]) => {
        if (cancelled) return;
        setActivity(activityData);
        setBadges(badgeData);
      })
      .catch((error) => console.error('Error loading sample development data:', error))
      .finally(() => {
        if (!cancelled) setLoadingSample(false);
      });
    return () => {
      cancelled = true;
    };
  }, [athlete.id, isSample]);

  const results = capturedResults(athlete.opponentNotes);
  const tally = tallyResults(athlete.opponentNotes);

  return (
    <section className="card" aria-labelledby="development-heading">
      <SectionHeading id="development-heading" title="Development" />

      <div className="stack-lg">
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <span className="meta-key">Captured results · {tally.total}</span>
            <span className="text-xs text-muted">From Quick capture</span>
          </div>
          {tally.total === 0 ? (
            <p className="text-sm text-muted">
              No results captured yet. After a match, tap{' '}
              <button type="button" className="btn-link no-print" onClick={onQuickCapture}>Quick capture</button>
              {' '}to log the result and score sequence here.
            </p>
          ) : (
            <>
              <div className="stat-grid mb-3">
                <StatTile label="Record" value={`${tally.wins}–${tally.losses}${tally.other ? `–${tally.other}` : ''}`} tone="accent" />
                <StatTile label="Wins" value={tally.wins} />
                <StatTile label="Ippon wins" value={tally.ipponWins} />
                <StatTile label="Losses" value={tally.losses} />
              </div>
              <ul data-testid="captured-results">
                {results.slice(0, 6).map((result) => (
                  <li key={result.id} className="result-row">
                    <span className={`result-badge result-badge-${result.result}`} aria-label={result.result}>
                      {formatResultLabel(result.result)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-strong">{result.headline}</p>
                      <p className="text-xs text-muted">
                        vs. {result.opponentLabel}
                        {result.club ? ` · ${result.club}` : ''} ·{' '}
                        {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {result.note && result.note !== result.headline ? (
                        <p className="text-sm text-body mt-1 line-clamp-2">{result.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {results.length > 6 ? (
                <p className="text-xs text-muted mt-2">Showing the latest 6 of {results.length}. All results are in Opponent intel.</p>
              ) : null}
            </>
          )}
        </div>

        {isSample ? (
          loadingSample ? (
            <LoadingBlock label="Loading sample history" />
          ) : (
            <>
              {activity && (activity.careerTimeline.length > 0 || activity.tournaments.length > 0) ? (
                <SampleBand note="Illustrates what tournament history could look like once results are imported. Not saved.">
                  <div className="stack">
                    {activity.careerTimeline.length > 0 ? (
                      <div>
                        <span className="meta-key block mb-2">Career timeline</span>
                        <CareerTimeline events={activity.careerTimeline} />
                      </div>
                    ) : null}
                    {activity.tournaments.length > 0 ? (
                      <div className="stack" style={{ gap: 'var(--svj-space-3)' }}>
                        <span className="meta-key">Tournaments</span>
                        {[...activity.tournaments]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((tournament) => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                          ))}
                      </div>
                    ) : null}
                  </div>
                </SampleBand>
              ) : null}
              {badges.length > 0 ? (
                <SampleBand note="Badge tiers shown with sample counts. Real badge progress is not tracked yet.">
                  <span className="meta-key block mb-2">Badges</span>
                  <BadgesSection badges={badges} />
                </SampleBand>
              ) : null}
            </>
          )
        ) : (
          <p className="text-xs text-muted">
            Tournament history and badges are not tracked yet for real athletes. Sample athletes show what they could look like.
          </p>
        )}
      </div>
    </section>
  );
}
