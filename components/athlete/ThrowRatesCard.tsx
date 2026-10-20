import type { CaptureScoreEvent } from '@/lib/types';
import { formatThrowRate, perTechniqueRates, successRate } from '@/lib/throw-rate';
import { StatTile } from '@/components/ui/StatTile';

type Props = {
  events: CaptureScoreEvent[];
  heading?: string;
  compact?: boolean;
};

/** Coach/admin throw success from captured nage attempts + scores. Hidden when empty. */
export function ThrowRatesCard({ events, heading = 'Throw success', compact = false }: Props) {
  const overall = successRate(events);
  const rows = perTechniqueRates(events);
  if (overall.n === 0) return null;

  return (
    <div data-testid="throw-rates" className="stack" style={{ gap: compact ? 'var(--svj-space-2)' : 'var(--svj-space-3)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="meta-key">{heading}</span>
        <span className="text-xs text-muted">{formatThrowRate(overall)}</span>
      </div>
      {compact ? null : (
        <div className="stat-grid">
          <StatTile
            label="Throw success"
            value={overall.percent === null ? '—' : `${Math.round(overall.percent)}%`}
            tone="accent"
          />
          <StatTile label="Scores" value={overall.scores} />
          <StatTile label="Attempts" value={overall.attempts} />
          <StatTile label="n=" value={overall.n} />
        </div>
      )}
      <ul data-testid="throw-rate-techniques" className="stack" style={{ gap: 'var(--svj-space-1)' }}>
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-baseline justify-between gap-2 text-sm"
            data-testid={`throw-rate-${row.name}`}
          >
            <span className="font-semibold text-strong min-w-0">{row.name}</span>
            <span className="text-muted flex-none">
              {row.scores}/{row.n}
              {row.percent === null ? '' : ` = ${Math.round(row.percent)}%`}
              {` · n=${row.n}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
