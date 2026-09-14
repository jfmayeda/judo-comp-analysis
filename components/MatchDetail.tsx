import { ScoreEvent, PenaltyEvent } from '@/lib/types';

type MatchDetailProps = {
  scoreEvents: ScoreEvent[];
  penaltyEvents: PenaltyEvent[];
  goldenScore: boolean;
};

export default function MatchDetail({ scoreEvents, penaltyEvents, goldenScore }: MatchDetailProps) {
  const allEvents = [
    ...scoreEvents.map(e => ({ ...e, kind: 'score' as const })),
    ...penaltyEvents.map(e => ({ ...e, kind: 'penalty' as const }))
  ].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  return (
    <div className="mt-3 pl-6 space-y-2">
      {goldenScore && (
        <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-md">
          <span className="text-lg">⏱️</span>
          <span className="font-semibold">Golden Score</span>
        </div>
      )}
      
      {allEvents.length === 0 ? (
        <p className="text-sm text-gray-600 italic">No score events recorded</p>
      ) : (
        <div className="space-y-1.5">
          {allEvents.map((event, index) => {
            if (event.kind === 'score') {
              const scoreEvent = event as ScoreEvent & { kind: 'score' };
              return (
                <div key={`score-${index}`} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 font-mono text-xs mt-0.5">{scoreEvent.sequenceOrder}.</span>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 capitalize">
                      {scoreEvent.eventType}
                    </span>
                    {scoreEvent.techniqueLabel && (
                      <span className="text-gray-700 ml-2">
                        via {scoreEvent.techniqueLabel}
                      </span>
                    )}
                    {scoreEvent.notes && (
                      <span className="text-gray-600 ml-2 italic">
                        ({scoreEvent.notes})
                      </span>
                    )}
                  </div>
                </div>
              );
            } else {
              const penaltyEvent = event as PenaltyEvent & { kind: 'penalty' };
              return (
                <div key={`penalty-${index}`} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 font-mono text-xs mt-0.5">{penaltyEvent.sequenceOrder}.</span>
                  <div className="flex-1">
                    <span className="font-semibold text-red-700 capitalize">
                      {penaltyEvent.penaltyType}
                    </span>
                    <span className="text-gray-700 ml-2">
                      → {penaltyEvent.recipient === 'athlete' ? 'You' : 'Opponent'}
                    </span>
                    {penaltyEvent.reason && (
                      <span className="text-gray-600 ml-2 italic">
                        ({penaltyEvent.reason})
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
