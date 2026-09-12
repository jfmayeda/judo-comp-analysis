'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type OpponentNote = {
  id: string;
  opponentLabel: string;
  club: string | null;
  notes: string;
  tournament: string | null;
  createdAt: string;
};

type Athlete = {
  id: string;
  firstName: string;
  lastInitial: string;
  tokuiWaza: string;
  developmentAreas: string;
  notes: string;
  opponentNotes: OpponentNote[];
};

export default function PrintProfilePage() {
  const params = useParams();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAthlete();
  }, []);

  const fetchAthlete = async () => {
    try {
      const res = await fetch(`/api/athletes/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAthlete(data);
      }
    } catch (error) {
      console.error('Error fetching athlete:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Athlete not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 no-print flex justify-between items-center">
          <Link href={`/athletes/${athlete.id}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Athlete
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="print-page">
          <div className="mb-8 pb-6 border-b-2 border-gray-300">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {athlete.firstName} {athlete.lastInitial}.
            </h1>
            <p className="text-sm text-gray-600">Tournament Day Profile</p>
          </div>

          {athlete.tokuiWaza && (
            <div className="mb-6 print-section">
              <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Tokui-waza
              </h2>
              <p className="text-lg text-gray-800">{athlete.tokuiWaza}</p>
            </div>
          )}

          {athlete.developmentAreas && (
            <div className="mb-6 print-section">
              <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Development Focus
              </h2>
              <p className="text-lg text-gray-800">{athlete.developmentAreas}</p>
            </div>
          )}

          {athlete.notes && (
            <div className="mb-6 print-section">
              <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Notes
              </h2>
              <p className="text-gray-800 whitespace-pre-wrap">{athlete.notes}</p>
            </div>
          )}

          {athlete.opponentNotes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-300 pb-2">
                Opponent Scouting
              </h2>
              <div className="space-y-6">
                {athlete.opponentNotes.map((note) => (
                  <div key={note.id} className="print-section">
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        vs. {note.opponentLabel}
                      </h3>
                      <div className="flex gap-3 text-sm text-gray-600">
                        {note.club && <span>{note.club}</span>}
                        {note.tournament && <span>{note.tournament}</span>}
                      </div>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {note.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-500">
            <p>Silicon Valley Judo - Competitor Analysis</p>
            <p>Printed: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            page-break-after: always;
          }
          .print-section {
            break-inside: avoid;
          }
          @page {
            margin: 1in;
          }
        }
      `}</style>
    </div>
  );
}
