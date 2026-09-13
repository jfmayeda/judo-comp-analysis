'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AthleteWithNotes } from '@/lib/types';
import { getAthleteWithNotes } from '@/lib/supabase-store';

export default function PrintProfilePage() {
  const params = useParams();
  const [athlete, setAthlete] = useState<AthleteWithNotes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAthlete();
  }, []);

  const loadAthlete = async () => {
    try {
      const id = params.id as string;
      const data = await getAthleteWithNotes(id);
      setAthlete(data);
    } catch (error) {
      console.error('Error loading athlete:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Athlete not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6 no-print flex justify-between items-center">
          <Link href={`/athletes/${athlete.id}`} className="text-blue-600 hover:text-blue-800 font-semibold uppercase tracking-wide text-sm">
            ← Back to Athlete
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-primary"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="print-page">
          {/* Header Section */}
          <div className="mb-8 pb-6 border-b-2 border-gray-900">
            <div className="mb-4">
              <p className="eyebrow mb-2">Tournament Day Profile</p>
              <h1 className="text-5xl mb-3 tracking-wide">
                {athlete.firstName} {athlete.lastInitial}.
              </h1>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              {athlete.stance && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stance</p>
                  <p className="text-base font-semibold capitalize">{athlete.stance}</p>
                </div>
              )}
              {athlete.weightClass && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weight Class</p>
                  <p className="text-base font-semibold">{athlete.weightClass}</p>
                </div>
              )}
              {athlete.ageDivision && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Division</p>
                  <p className="text-base font-semibold">{athlete.ageDivision}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Opponent Notes</p>
                <p className="text-base font-semibold">{athlete.opponentNotes.length}</p>
              </div>
            </div>
          </div>

          {/* Core Info Section */}
          {athlete.tokuiWaza && (
            <div className="mb-6 print-section">
              <h2 className="text-lg font-bold mb-2 uppercase tracking-wide text-gray-900">
                Tokui-waza
              </h2>
              <p className="text-base text-gray-900 leading-relaxed">{athlete.tokuiWaza}</p>
            </div>
          )}

          {/* Scouting Details Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6 print-section">
            {athlete.kumiKata && (
              <div>
                <h3 className="text-sm font-bold mb-2 uppercase tracking-wide text-gray-900">
                  Kumi-kata
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">{athlete.kumiKata}</p>
              </div>
            )}

            {athlete.neWaza && (
              <div>
                <h3 className="text-sm font-bold mb-2 uppercase tracking-wide text-gray-900">
                  Ne-waza
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">{athlete.neWaza}</p>
              </div>
            )}
          </div>

          {athlete.developmentAreas && (
            <div className="mb-6 print-section">
              <h2 className="text-lg font-bold mb-2 uppercase tracking-wide text-gray-900">
                Development Focus
              </h2>
              <p className="text-base text-gray-900 leading-relaxed">{athlete.developmentAreas}</p>
            </div>
          )}

          {athlete.notes && (
            <div className="mb-8 print-section">
              <h2 className="text-lg font-bold mb-2 uppercase tracking-wide text-gray-900">
                Coach Notes
              </h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{athlete.notes}</p>
            </div>
          )}

          {/* Opponent Scouting Section */}
          {athlete.opponentNotes.length > 0 && (
            <div className="mt-8 pt-8 border-t-2 border-gray-900">
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-wide">
                Opponent Scouting
              </h2>
              <div className="space-y-6">
                {athlete.opponentNotes.map((note) => (
                  <div key={note.id} className="print-section border-l-4 border-gray-900 pl-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        vs. {note.opponentLabel}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        {note.club && <span>• {note.club}</span>}
                        {note.tournament && <span>• {note.tournament}</span>}
                        {note.stance && <span>• Stance: <span className="capitalize">{note.stance}</span></span>}
                        {note.weightClass && <span>• {note.weightClass}</span>}
                        {note.ageDivision && <span>• {note.ageDivision}</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {note.kumiKata && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Kumi-kata</p>
                          <p className="text-sm text-gray-900">{note.kumiKata}</p>
                        </div>
                      )}

                      {note.neWaza && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Ne-waza</p>
                          <p className="text-sm text-gray-900">{note.neWaza}</p>
                        </div>
                      )}

                      {note.commonCounters && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Common Counters</p>
                          <p className="text-sm text-gray-900">{note.commonCounters}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Scouting Notes</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                          {note.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
            <p className="font-semibold uppercase tracking-wider">Silicon Valley Judo • Competitor Analysis</p>
            <p className="mt-1">Printed: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
