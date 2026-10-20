'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  formatModifier,
  getAthleteStats,
  parseScore,
  saveAthleteStat,
  STAT_KEYS,
  STAT_META,
  type AthleteStats,
  type StatKey,
} from '@/lib/athlete-stats';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn } from '@/lib/cn';

export type AthleteStatsCardProps = {
  athleteId: string;
  compact?: boolean;
};

function formatRatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function AthleteStatsCard({ athleteId, compact = false }: AthleteStatsCardProps) {
  const { isAllowlisted, user } = useAuth();
  const [sheet, setSheet] = useState<AthleteStats | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<StatKey, string> | null>(null);

  const load = useCallback(async () => {
    const data = await getAthleteStats(athleteId);
    setSheet(data);
    setDraftNotes({
      athleticism: data.stats.athleticism.note,
      strength: data.stats.strength.note,
      speed: data.stats.speed.note,
      technique: data.stats.technique.note,
    });
  }, [athleteId]);

  useEffect(() => {
    if (isAllowlisted !== true) return;
    let cancelled = false;
    load().catch((error) => {
      if (!cancelled) console.error('Error loading athlete stats:', error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAllowlisted, load]);

  if (isAllowlisted !== true) return null;
  if (!sheet || !draftNotes) return null;

  const canEdit = !compact;
  const rater = user?.email ?? 'Coach';

  const commitScore = async (key: StatKey, raw: string) => {
    const next = parseScore(Number(raw));
    if (next === null) {
      await load();
      return;
    }
    if (next === sheet.stats[key].score) return;
    const saved = await saveAthleteStat({ athleteId, key, score: next, ratedBy: rater });
    setSheet(saved);
  };

  const commitNote = async (key: StatKey) => {
    const note = draftNotes[key].trim();
    if (note === sheet.stats[key].note) return;
    const saved = await saveAthleteStat({ athleteId, key, score: sheet.stats[key].score, note, ratedBy: rater });
    setSheet(saved);
    setDraftNotes((current) => (current ? { ...current, [key]: saved.stats[key].note } : current));
  };

  return (
    <section
      className={cn('card print-section', compact && 'stat-sheet-compact')}
      aria-labelledby="athlete-stats-heading"
      data-testid="athlete-stats"
    >
      <SectionHeading id="athlete-stats-heading" title={compact ? 'Stats' : 'Character sheet'} as={compact ? 'h3' : 'h2'} />
      <div className="stat-sheet">
        {STAT_KEYS.map((key) => {
          const meta = STAT_META[key];
          const entry = sheet.stats[key];
          const mod = formatModifier(entry.score);
          return (
            <div key={key} className="stat-sheet-tile" data-testid={`stat-${key}`}>
              <img
                src={meta.icon128}
                srcSet={`${meta.icon128} 128w, ${meta.icon256} 256w`}
                sizes={compact ? '32px' : '48px'}
                width={compact ? 32 : 48}
                height={compact ? 32 : 48}
                alt=""
                data-stat-icon=""
                className="stat-sheet-icon"
              />
              <span className="stat-sheet-label">{meta.label}</span>
              {canEdit ? (
                <input
                  className="form-input stat-sheet-score-input"
                  type="number"
                  min={1}
                  max={20}
                  inputMode="numeric"
                  aria-label={`${meta.label} score`}
                  data-testid={`stat-${key}-score`}
                  value={entry.score}
                  onChange={(event) => {
                    const score = Number(event.target.value);
                    setSheet({
                      ...sheet,
                      stats: { ...sheet.stats, [key]: { ...entry, score: Number.isFinite(score) ? score : entry.score } },
                    });
                  }}
                  onBlur={(event) => {
                    commitScore(key, event.target.value).catch((error) => console.error('Error saving stat:', error));
                  }}
                />
              ) : (
                <span className="stat-sheet-score" data-testid={`stat-${key}-score`}>{entry.score}</span>
              )}
              <span className="stat-sheet-mod" data-testid={`stat-${key}-mod`}>{mod}</span>
              <div className="stat-sheet-bar" aria-hidden>
                <span style={{ width: `${(Math.min(20, Math.max(1, entry.score)) / 20) * 100}%` }} />
              </div>
              {canEdit ? (
                <input
                  className="form-input stat-sheet-note-input no-smoke-target"
                  type="text"
                  maxLength={80}
                  placeholder="Note"
                  aria-label={`${meta.label} note`}
                  data-testid={`stat-${key}-note`}
                  value={draftNotes[key]}
                  onChange={(event) => setDraftNotes({ ...draftNotes, [key]: event.target.value })}
                  onBlur={() => {
                    commitNote(key).catch((error) => console.error('Error saving stat note:', error));
                  }}
                />
              ) : entry.note ? (
                <p className="stat-sheet-note">{entry.note}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="stat-sheet-meta" data-testid="stat-last-rated">
        {sheet.ratedBy === 'Unrated'
          ? 'Not yet rated'
          : `Last rated ${formatRatedAt(sheet.ratedAt)} by ${sheet.ratedBy}`}
      </p>
    </section>
  );
}
