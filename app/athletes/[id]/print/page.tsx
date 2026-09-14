'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { AthleteWithNotes, TournamentDayEntry, Coach } from '@/lib/types';
import { getAthleteWithNotes, getTodaysTournamentAssignment, getAllCoaches } from '@/lib/supabase-store';

export default function PrintProfilePage() {
  const params = useParams();
  const [athlete, setAthlete] = useState<AthleteWithNotes | null>(null);
  const [todaysAssignment, setTodaysAssignment] = useState<TournamentDayEntry | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState<string>('');

  useEffect(() => {
    loadAthlete();
    
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/athletes/${params.id}` 
      : `https://judo-comp-analysis.vercel.app/athletes/${params.id}`;
    setProfileUrl(url);
  }, [params.id]);

  const loadAthlete = async () => {
    try {
      const id = params.id as string;
      const [data, assignmentData, coachesData] = await Promise.all([
        getAthleteWithNotes(id),
        getTodaysTournamentAssignment(id),
        getAllCoaches(),
      ]);
      setAthlete(data);
      setTodaysAssignment(assignmentData);
      setCoaches(coachesData);
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
          {/* Header Section with QR Code */}
          <div className="mb-6 pb-6 border-b-2 border-gray-900 flex items-start justify-between">
            <div className="flex-1">
              <p className="eyebrow mb-2">MATSIDE COACH CARD</p>
              <h1 className="text-4xl mb-3 tracking-wide">
                {athlete.firstName} {athlete.lastInitial}.
              </h1>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {athlete.stance && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stance</p>
                    <p className="text-sm font-semibold capitalize">{athlete.stance}</p>
                  </div>
                )}
                {athlete.weightClass && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weight</p>
                    <p className="text-sm font-semibold">{athlete.weightClass}</p>
                  </div>
                )}
                {athlete.ageDivision && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Division</p>
                    <p className="text-sm font-semibold">{athlete.ageDivision}</p>
                  </div>
                )}
              </div>

              {/* Tournament Assignment */}
              {todaysAssignment && (
                <div className="p-3 bg-blue-50 border border-blue-600 rounded mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 text-blue-900">Today's Assignment</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {todaysAssignment.assignedCoachId && coaches.find(c => c.id === todaysAssignment.assignedCoachId) && (
                      <div>
                        <span className="font-semibold">Coach:</span>{' '}
                        {coaches.find(c => c.id === todaysAssignment.assignedCoachId)?.email.split('@')[0]}
                      </div>
                    )}
                    {todaysAssignment.matNumber && (
                      <div>
                        <span className="font-semibold">Mat:</span> {todaysAssignment.matNumber}
                      </div>
                    )}
                    {todaysAssignment.timeWindow && (
                      <div>
                        <span className="font-semibold">Time:</span> {todaysAssignment.timeWindow}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* QR Code */}
            {profileUrl && (
              <div className="ml-6 flex flex-col items-center">
                <QRCodeSVG 
                  value={profileUrl} 
                  size={80}
                  level="M"
                  includeMargin={false}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">Scan for<br/>full profile</p>
              </div>
            )}
          </div>

          {/* Core Coaching Intel - Compact Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5 print-section">
            {athlete.tokuiWaza && (
              <div>
                <h3 className="text-sm font-bold mb-1 uppercase tracking-wide text-gray-900">Tokui-waza (Tachi)</h3>
                <p className="text-sm text-gray-900 leading-snug">{athlete.tokuiWaza}</p>
              </div>
            )}
            
            {athlete.neWaza && (
              <div>
                <h3 className="text-sm font-bold mb-1 uppercase tracking-wide text-gray-900">Ne-waza</h3>
                <p className="text-sm text-gray-900 leading-snug">{athlete.neWaza}</p>
              </div>
            )}
            
            {athlete.kumiKata && (
              <div>
                <h3 className="text-sm font-bold mb-1 uppercase tracking-wide text-gray-900">Kumi-kata</h3>
                <p className="text-sm text-gray-900 leading-snug">{athlete.kumiKata}</p>
              </div>
            )}

            {athlete.developmentAreas && (
              <div>
                <h3 className="text-sm font-bold mb-1 uppercase tracking-wide text-gray-900">Development</h3>
                <p className="text-sm text-gray-900 leading-snug">{athlete.developmentAreas}</p>
              </div>
            )}
          </div>

          {athlete.notes && (
            <div className="mb-6 print-section p-3 bg-gray-50 rounded">
              <h3 className="text-sm font-bold mb-2 uppercase tracking-wide text-gray-900">Coach Notes</h3>
              <p className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">{athlete.notes}</p>
            </div>
          )}

          {/* Opponent Scouting Section - Denser */}
          {athlete.opponentNotes.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-gray-900">
              <h2 className="text-xl font-bold mb-4 uppercase tracking-wide">Opponent Intel</h2>
              <div className="space-y-4">
                {athlete.opponentNotes.map((note) => (
                  <div key={note.id} className="print-section border-l-4 border-gray-700 pl-3 py-2">
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-gray-900 inline">vs. {note.opponentLabel}</h3>
                      {note.club && <span className="text-sm text-gray-600 ml-2">({note.club})</span>}
                      
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-600 mt-1">
                        {note.tournament && <span>• {note.tournament}</span>}
                        {note.stance && <span>• <span className="capitalize">{note.stance}</span></span>}
                        {note.weightClass && <span>• {note.weightClass}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                      {note.kumiKata && (
                        <div>
                          <span className="text-xs font-bold text-gray-600">Kumi-kata:</span>
                          <span className="text-xs text-gray-900 ml-1">{note.kumiKata}</span>
                        </div>
                      )}
                      {note.neWaza && (
                        <div>
                          <span className="text-xs font-bold text-gray-600">Ne-waza:</span>
                          <span className="text-xs text-gray-900 ml-1">{note.neWaza}</span>
                        </div>
                      )}
                      {note.commonCounters && (
                        <div className="col-span-2">
                          <span className="text-xs font-bold text-gray-600">Counters:</span>
                          <span className="text-xs text-gray-900 ml-1">{note.commonCounters}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-900 leading-snug">
                      {note.notes}
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
