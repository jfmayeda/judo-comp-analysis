import { ScoreEvent, PenaltyEvent } from '@/lib/types';

type MatchDetailProps = { scoreEvents: ScoreEvent[]; penaltyEvents: PenaltyEvent[]; goldenScore: boolean };

/** Ordered score and penalty sequence for one sample match. */
export default function MatchDetail({ scoreEvents, penaltyEvents, goldenScore }: MatchDetailProps) {
  const allEvents = [
    ...scoreEvents.map((e) => ({ ...e, kind: 'score' as const })),
    ...penaltyEvents.map((e) => ({ ...e, kind: 'penalty' as const })),
  ].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  return (
    <div className="mt-2 pl-3 border-l-2 border-gray-200 stack" style={{ gap: 'var(--svj-space-1)' }}>
      {goldenScore ? <span className="pill pill-warning self-start">Golden score</span> : null}
      {allEvents.length === 0 ? (
        <p className="text-sm text-muted">No score events recorded</p>
      ) : (
        <ol className="text-sm">
          {allEvents.map((event, index) => (
            <li key={`${event.kind}-${index}`} className="flex gap-2 py-0.5">
              <span className="text-muted tabular-nums w-5 flex-none">{event.sequenceOrder}.</span>
              {event.kind === 'score' ? (
                <span>
                  <span className="font-semibold text-strong capitalize">{event.eventType}</span>
                  {event.techniqueLabel ? <span className="text-body"> via {event.techniqueLabel}</span> : null}
                  {event.notes ? <span className="text-muted"> — {event.notes}</span> : null}
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-red-700 capitalize">{event.penaltyType}</span>
                  <span className="text-body"> to {event.recipient === 'athlete' ? 'us' : 'them'}</span>
                  {event.reason ? <span className="text-muted"> — {event.reason}</span> : null}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
