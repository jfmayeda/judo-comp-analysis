'use client';

import { useState } from 'react';
import { Match } from '@/lib/types';
import MatchDetail from './MatchDetail';

type MatchRowProps = {
  match: Match;
};

function formatTerminalMethod(method: string): string {
  const formatted: Record<string, string> = {
    ippon: 'Ippon',
    wazari_awasete_ippon: 'Wazari-awasete-ippon',
    yuko: 'Yuko',
    decision: 'Decision',
    walkover: 'Walkover',
    hansoku_make: 'Hansoku-make',
    fusen_gachi: 'Fusen-gachi',
    kiken_gachi: 'Kiken-gachi',
  };
  return formatted[method] || method;
}

export default function MatchRow({ match }: MatchRowProps) {
  const [expanded, setExpanded] = useState(false);

  const isWin = match.result === 'win';
  const resultIcon = isWin ? '✓' : '✗';
  const resultColor = isWin ? 'text-green-700' : 'text-red-700';
  const bgColor = isWin ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className={`rounded-md border ${isWin ? 'border-green-200' : 'border-red-200'} ${bgColor} mb-2`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className={`text-lg font-bold ${resultColor}`}>{resultIcon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                vs {match.opponentFirstName} {match.opponentLastInitial}.
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {isWin ? 'Win' : 'Loss'} ({formatTerminalMethod(match.terminalMethod)})
                {match.goldenScore && <span className="ml-2">⏱️</span>}
              </p>
            </div>
          </div>
          <span className="text-gray-400 text-sm">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-200">
          <MatchDetail
            scoreEvents={match.scoreEvents}
            penaltyEvents={match.penaltyEvents}
            goldenScore={match.goldenScore}
          />
        </div>
      )}
    </div>
  );
}
