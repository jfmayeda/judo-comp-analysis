'use client';

import Link from 'next/link';
import { AthleteWithNotes, TournamentDayEntry } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Chip';

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
    <Card className="p-4 md:p-6">
      {/* Header - Name and Belt */}
      <div className="mb-4 pb-3 border-b-2 border-svj-blue-600">
        <h2 className="text-2xl md:text-3xl font-bold text-svj-navy-900 mb-1">
          {athlete.firstName} {athlete.lastInitial}.
        </h2>
        {athlete.currentBelt && athlete.currentBelt !== 'unset' && (
          <p className="text-sm text-svj-gray-600 font-semibold uppercase tracking-wide">
            {athlete.currentBelt.replace('_', ' ')}
          </p>
        )}
      </div>

      {/* Assignment Info - Prominent if present */}
      {assignment && (
        <div className="mb-4 p-3 bg-svj-white rounded-svj-card border-2 border-svj-blue-600">
          <p className="text-xs font-bold text-svj-blue-600 uppercase tracking-wider mb-2">
            Today's Assignment
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {coachName && (
              <div>
                <span className="font-semibold text-svj-navy-900">Coach:</span>
                <p className="text-svj-gray-600">{coachName}</p>
              </div>
            )}
            {assignment.matNumber && (
              <div>
                <span className="font-semibold text-svj-navy-900">Mat:</span>
                <p className="text-svj-gray-600">{assignment.matNumber}</p>
              </div>
            )}
            {assignment.timeWindow && (
              <div>
                <span className="font-semibold text-svj-navy-900">Time:</span>
                <p className="text-svj-gray-600">{assignment.timeWindow}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Core Techniques - Scannable Chips */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {tokuiItems.length > 0 && (
          <div>
            <p className="text-xs font-bold text-svj-gray-600 uppercase tracking-wider mb-2">
              Tokui-waza (Tachi)
            </p>
            <div className="flex flex-wrap gap-2">
              {tokuiItems.slice(0, 3).map((item, idx) => (
                <Pill key={idx}>{item}</Pill>
              ))}
            </div>
          </div>
        )}

        {neWazaItems.length > 0 && (
          <div>
            <p className="text-xs font-bold text-svj-gray-600 uppercase tracking-wider mb-2">
              Ne-waza
            </p>
            <div className="flex flex-wrap gap-2">
              {neWazaItems.slice(0, 3).map((item, idx) => (
                <Pill key={idx} tone="navy">{item}</Pill>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Development Areas - Short */}
      {athlete.developmentAreas && (
        <div className="mb-4">
          <p className="text-xs font-bold text-svj-gray-600 uppercase tracking-wider mb-2">
            Development Focus
          </p>
          <p className="text-sm text-svj-navy-900 leading-relaxed">
            {athlete.developmentAreas.length > 120 
              ? athlete.developmentAreas.slice(0, 120) + '...' 
              : athlete.developmentAreas}
          </p>
        </div>
      )}

      {/* Recent Opponent Intel - Condensed */}
      {recentOpponentNotes.length > 0 && (
        <div className="mb-4 p-3 bg-svj-paper rounded-svj-card">
          <p className="text-xs font-bold text-svj-gray-600 uppercase tracking-wider mb-2">
            Recent Opponent Intel
          </p>
          <div className="space-y-2">
            {recentOpponentNotes.map((note, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-semibold text-svj-navy-900">vs. {note.label}</span>
                {note.result && (
                  <span className="text-svj-blue-600 font-semibold">
                    {' '}
                    · {note.result}
                  </span>
                )}
                {note.club && <span className="text-svj-gray-600"> ({note.club})</span>}
                <p className="text-svj-gray-600 text-xs mt-1">{note.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-svj-gray-200">
        {onQuickCapture && (
          <Button onClick={onQuickCapture} className="flex-1">
            Quick capture
          </Button>
        )}
        <Button as={Link} href={`/athletes/${athlete.id}/print`} target="_blank" variant="secondary" className="flex-1">
          Print Profile
        </Button>
        <Button as={Link} href={`/athletes/${athlete.id}#opponent-notes`} variant="secondary" className="flex-1">
          Full Notes
        </Button>
      </div>
    </Card>
  );
}
