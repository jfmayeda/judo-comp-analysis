'use client';

import { useState } from 'react';
import { Match } from '@/lib/types';
import MatchDetail from './MatchDetail';
import { IconChevronDown } from '@/components/ui/Icons';

function formatTerminalMethod(method: string): string {
  const formatted: Record<string, string> = {
    ippon: 'Ippon',
    wazari_awasete_ippon: 'Waza-ari awasete ippon',
    yuko: 'Yuko',
    decision: 'Decision',
    walkover: 'Walkover',
    hansoku_make: 'Hansoku-make',
    fusen_gachi: 'Fusen-gachi',
    kiken_gachi: 'Kiken-gachi',
  };
  return formatted[method] || method;
}

/** One sample match: W/L badge, opponent, method; expands to the event sequence. */
export default function MatchRow({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false);
  const isWin = match.result === 'win';
  return (
    <li className="result-row">
      <span className={`result-badge ${isWin ? 'result-badge-win' : 'result-badge-loss'}`} aria-label={isWin ? 'Win' : 'Loss'}>
        {isWin ? 'W' : 'L'}
      </span>
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full min-h-10 flex items-center justify-between gap-2 text-left"
        >
          <span className="min-w-0">
            <span className="block font-semibold text-strong">vs. {match.opponentFirstName} {match.opponentLastInitial}.</span>
            <span className="block text-xs text-muted">
              {formatTerminalMethod(match.terminalMethod)}
              {match.goldenScore ? ' · golden score' : ''}
            </span>
          </span>
          <IconChevronDown size={18} className={`flex-none text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded ? <MatchDetail scoreEvents={match.scoreEvents} penaltyEvents={match.penaltyEvents} goldenScore={match.goldenScore} /> : null}
      </div>
    </li>
  );
}
