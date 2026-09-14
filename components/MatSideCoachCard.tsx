'use client';

import Link from 'next/link';
import { AthleteWithNotes, TournamentDayEntry } from '@/lib/types';

interface MatSideCoachCardProps {
  athlete: AthleteWithNotes;
  assignment?: TournamentDayEntry | null;
  coachName?: string | null;
  onQuickCapture?: () => void;
}

export function MatSideCoachCard({ athlete, assignment, coachName, onQuickCapture }: MatSideCoachCardProps) {
  const tokuiItems = [
    athlete.tokuiWaza,
    ...(athlete.tokuiTechniqueIds || [])
  ].filter(Boolean);
  
  const neWazaItems = [
    athlete.neWaza,
    ...(athlete.newazaTechniqueIds || [])
  ].filter(Boolean);

  const recentOpponentNotes = athlete.opponentNotes
    .slice(0, 3)
    .map(note => ({
      label: note.opponentLabel,
      club: note.club,
      result: note.result,
      summary: note.notes.length > 100 ? note.notes.slice(0, 100) + '...' : note.notes
    }));

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-brand-blue rounded-lg shadow-lg p-4 md:p-6">
      {/* Header - Name and Belt */}
      <div className="mb-4 pb-3 border-b-2 border-brand-blue">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {athlete.firstName} {athlete.lastInitial}.
        </h2>
        {athlete.currentBelt && athlete.currentBelt !== 'unset' && (
          <p className="text-sm text-gray-700 font-semibold uppercase tracking-wide">
            {athlete.currentBelt.replace('_', ' ')}
          </p>
        )}
      </div>

      {/* Assignment Info - Prominent if present */}
      {assignment && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-brand-blue">
          <p className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-2">
            Today's Assignment
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {coachName && (
              <div>
                <span className="font-semibold text-gray-900">Coach:</span>
                <p className="text-gray-700">{coachName}</p>
              </div>
            )}
            {assignment.matNumber && (
              <div>
                <span className="font-semibold text-gray-900">Mat:</span>
                <p className="text-gray-700">{assignment.matNumber}</p>
              </div>
            )}
            {assignment.timeWindow && (
              <div>
                <span className="font-semibold text-gray-900">Time:</span>
                <p className="text-gray-700">{assignment.timeWindow}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Core Techniques - Scannable Chips */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {tokuiItems.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Tokui-waza (Tachi)
            </p>
            <div className="flex flex-wrap gap-2">
              {tokuiItems.slice(0, 3).map((item, idx) => (
                <span 
                  key={idx}
                  className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {neWazaItems.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Ne-waza
            </p>
            <div className="flex flex-wrap gap-2">
              {neWazaItems.slice(0, 3).map((item, idx) => (
                <span 
                  key={idx}
                  className="inline-block px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Development Areas - Short */}
      {athlete.developmentAreas && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Development Focus
          </p>
          <p className="text-sm text-gray-900 leading-relaxed">
            {athlete.developmentAreas.length > 120 
              ? athlete.developmentAreas.slice(0, 120) + '...' 
              : athlete.developmentAreas}
          </p>
        </div>
      )}

      {/* Recent Opponent Intel - Condensed */}
      {recentOpponentNotes.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Recent Opponent Intel
          </p>
          <div className="space-y-2">
            {recentOpponentNotes.map((note, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-semibold text-gray-900">vs. {note.label}</span>
                {note.result && (
                  <span className="text-brand-blue font-semibold">
                    {' '}
                    · {note.result}
                  </span>
                )}
                {note.club && <span className="text-gray-600"> ({note.club})</span>}
                <p className="text-gray-700 text-xs mt-1">{note.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-blue-200">
        {onQuickCapture && (
          <button
            type="button"
            onClick={onQuickCapture}
            className="flex-1 text-center px-4 py-2 bg-brand-blue text-white font-semibold text-sm rounded-full hover:bg-brand-blue-hover transition-colors min-h-[44px]"
          >
            Quick capture
          </button>
        )}
        <Link
          href={`/athletes/${athlete.id}/print`}
          target="_blank"
          className="flex-1 text-center px-4 py-2 bg-white border-2 border-brand-blue text-brand-blue font-semibold text-sm rounded-full hover:bg-blue-50 transition-colors min-h-[44px]"
        >
          Print Profile
        </Link>
        <Link
          href={`/athletes/${athlete.id}#opponent-notes`}
          className="flex-1 text-center px-4 py-2 bg-white border-2 border-brand-blue text-brand-blue font-semibold text-sm rounded-full hover:bg-blue-50 transition-colors min-h-[44px]"
        >
          Full Notes
        </Link>
      </div>
    </div>
  );
}
