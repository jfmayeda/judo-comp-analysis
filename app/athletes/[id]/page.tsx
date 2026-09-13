'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AthleteWithNotes, Stance } from '@/lib/types';
import {
  getAthleteWithNotes,
  updateAthlete,
  deleteAthlete,
  createOpponentNote,
  deleteOpponentNote,
} from '@/lib/supabase-store';
import { useAuth } from '@/lib/auth-context';

export default function AthletePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAllowlisted } = useAuth();
  const [athlete, setAthlete] = useState<AthleteWithNotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastInitial: '',
    tokuiWaza: '',
    developmentAreas: '',
    notes: '',
    stance: '' as Stance | '',
    kumiKata: '',
    neWaza: '',
    weightClass: '',
    ageDivision: '',
  });
  const [noteFormData, setNoteFormData] = useState({
    opponentLabel: '',
    club: '',
    notes: '',
    tournament: '',
    stance: '' as Stance | '',
    kumiKata: '',
    neWaza: '',
    commonCounters: '',
    weightClass: '',
    ageDivision: '',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (isAllowlisted === false) {
      router.push('/unauthorized');
      return;
    }

    if (isAllowlisted === true) {
      loadAthlete();
    }
  }, [user, authLoading, isAllowlisted, router]);

  const loadAthlete = async () => {
    try {
      const id = params.id as string;
      const data = await getAthleteWithNotes(id);
      if (data) {
        setAthlete(data);
        setFormData({
          firstName: data.firstName,
          lastInitial: data.lastInitial,
          tokuiWaza: data.tokuiWaza,
          developmentAreas: data.developmentAreas,
          notes: data.notes,
          stance: data.stance || '',
          kumiKata: data.kumiKata,
          neWaza: data.neWaza,
          weightClass: data.weightClass,
          ageDivision: data.ageDivision,
        });
      }
    } catch (error) {
      console.error('Error loading athlete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = params.id as string;
      await updateAthlete(id, {
        ...formData,
        stance: formData.stance || null,
      });
      setEditing(false);
      await loadAthlete();
    } catch (error: any) {
      console.error('Error updating athlete:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${athlete?.firstName} ${athlete?.lastInitial}. and all related notes?`)) {
      return;
    }
    try {
      const id = params.id as string;
      await deleteAthlete(id);
      router.push('/');
    } catch (error: any) {
      console.error('Error deleting athlete:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = params.id as string;
      await createOpponentNote({
        athleteId: id,
        opponentLabel: noteFormData.opponentLabel,
        club: noteFormData.club || null,
        notes: noteFormData.notes,
        tournament: noteFormData.tournament || null,
        stance: noteFormData.stance || null,
        kumiKata: noteFormData.kumiKata,
        neWaza: noteFormData.neWaza,
        commonCounters: noteFormData.commonCounters,
        weightClass: noteFormData.weightClass,
        ageDivision: noteFormData.ageDivision,
      });
      setNoteFormData({
        opponentLabel: '',
        club: '',
        notes: '',
        tournament: '',
        stance: '',
        kumiKata: '',
        neWaza: '',
        commonCounters: '',
        weightClass: '',
        ageDivision: '',
      });
      setShowAddNote(false);
      await loadAthlete();
    } catch (error: any) {
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this opponent note?')) {
      return;
    }
    try {
      await deleteOpponentNote(noteId);
      await loadAthlete();
    } catch (error: any) {
      console.error('Error deleting note:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen navy-field flex items-center justify-center">
        <p className="text-white">Loading athlete...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen navy-field flex items-center justify-center">
        <p className="text-white">Athlete not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Link href="/" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <span className="text-xl">←</span>
            <img 
              src="/svj-logo-white.png" 
              alt="Silicon Valley Judo" 
              className="app-header-logo"
            />
            <p className="eyebrow text-white text-xs uppercase">COMPETITOR ANALYSIS</p>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-8">
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start mb-6 no-print">
            <h2 className="text-3xl">
              {athlete.firstName} {athlete.lastInitial}.
            </h2>
            <div className="flex gap-2">
              <Link
                href={`/athletes/${athlete.id}/print`}
                className="btn-secondary text-sm"
              >
                Print Profile
              </Link>
              <button
                onClick={() => setEditing(!editing)}
                className="btn-primary text-sm"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger text-sm"
              >
                Delete
              </button>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Last Initial
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={1}
                    value={formData.lastInitial}
                    onChange={(e) =>
                      setFormData({ ...formData, lastInitial: e.target.value.toUpperCase() })
                    }
                    className="form-input w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Stance
                  </label>
                  <select
                    value={formData.stance || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, stance: e.target.value as Stance | '' })
                    }
                    className="form-input w-full"
                  >
                    <option value="">Not set</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Weight Class
                  </label>
                  <input
                    type="text"
                    value={formData.weightClass}
                    onChange={(e) =>
                      setFormData({ ...formData, weightClass: e.target.value })
                    }
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Age Division
                  </label>
                  <input
                    type="text"
                    value={formData.ageDivision}
                    onChange={(e) =>
                      setFormData({ ...formData, ageDivision: e.target.value })
                    }
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Tokui-waza (favorite techniques)
                </label>
                <input
                  type="text"
                  value={formData.tokuiWaza}
                  onChange={(e) =>
                    setFormData({ ...formData, tokuiWaza: e.target.value })
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Kumi-kata (grip style)
                </label>
                <input
                  type="text"
                  value={formData.kumiKata}
                  onChange={(e) =>
                    setFormData({ ...formData, kumiKata: e.target.value })
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Ne-waza (ground game)
                </label>
                <input
                  type="text"
                  value={formData.neWaza}
                  onChange={(e) =>
                    setFormData({ ...formData, neWaza: e.target.value })
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Development Areas
                </label>
                <input
                  type="text"
                  value={formData.developmentAreas}
                  onChange={(e) =>
                    setFormData({ ...formData, developmentAreas: e.target.value })
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="form-input w-full"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                {athlete.stance && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stance</h4>
                    <p className="text-gray-900 capitalize">{athlete.stance}</p>
                  </div>
                )}
                {athlete.weightClass && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weight Class</h4>
                    <p className="text-gray-900">{athlete.weightClass}</p>
                  </div>
                )}
                {athlete.ageDivision && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Division</h4>
                    <p className="text-gray-900">{athlete.ageDivision}</p>
                  </div>
                )}
              </div>

              {athlete.tokuiWaza && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tokui-waza</h3>
                  <p className="text-gray-900">{athlete.tokuiWaza}</p>
                </div>
              )}

              {athlete.kumiKata && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Kumi-kata</h3>
                  <p className="text-gray-900">{athlete.kumiKata}</p>
                </div>
              )}

              {athlete.neWaza && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Ne-waza</h3>
                  <p className="text-gray-900">{athlete.neWaza}</p>
                </div>
              )}

              {athlete.developmentAreas && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Development Areas</h3>
                  <p className="text-gray-900">{athlete.developmentAreas}</p>
                </div>
              )}

              {athlete.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{athlete.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-6 no-print">
            <h3 className="text-2xl">Opponent Notes</h3>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="btn-primary text-sm"
            >
              {showAddNote ? 'Cancel' : 'Add Note'}
            </button>
          </div>

          {showAddNote && (
            <form onSubmit={handleAddNote} className="mb-6 p-6 bg-gray-50 rounded-lg space-y-6 no-print">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Opponent Name * (first + last initial)
                  </label>
                  <input
                    type="text"
                    required
                    value={noteFormData.opponentLabel}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, opponentLabel: e.target.value })
                    }
                    placeholder="e.g. Sarah M"
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Club
                  </label>
                  <input
                    type="text"
                    value={noteFormData.club}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, club: e.target.value })
                    }
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Stance
                  </label>
                  <select
                    value={noteFormData.stance || ''}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, stance: e.target.value as Stance | '' })
                    }
                    className="form-input w-full"
                  >
                    <option value="">Not set</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Weight Class
                  </label>
                  <input
                    type="text"
                    value={noteFormData.weightClass}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, weightClass: e.target.value })
                    }
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    Age Division
                  </label>
                  <input
                    type="text"
                    value={noteFormData.ageDivision}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, ageDivision: e.target.value })
                    }
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Tournament
                </label>
                <input
                  type="text"
                  value={noteFormData.tournament}
                  onChange={(e) =>
                    setNoteFormData({ ...noteFormData, tournament: e.target.value })
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Kumi-kata (grip style)
                </label>
                <input
                  type="text"
                  value={noteFormData.kumiKata}
                  onChange={(e) =>
                    setNoteFormData({ ...noteFormData, kumiKata: e.target.value })
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Ne-waza (ground game)
                </label>
                <input
                  type="text"
                  value={noteFormData.neWaza}
                  onChange={(e) =>
                    setNoteFormData({ ...noteFormData, neWaza: e.target.value })
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Common Counters
                </label>
                <input
                  type="text"
                  value={noteFormData.commonCounters}
                  onChange={(e) =>
                    setNoteFormData({ ...noteFormData, commonCounters: e.target.value })
                  }
                  placeholder="e.g. Ko-soto-gake on failed attacks"
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Scouting Notes *
                </label>
                <textarea
                  required
                  value={noteFormData.notes}
                  onChange={(e) =>
                    setNoteFormData({ ...noteFormData, notes: e.target.value })
                  }
                  rows={4}
                  className="form-input w-full"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
              >
                Add Note
              </button>
            </form>
          )}

          {athlete.opponentNotes.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No opponent notes yet. Add scouting notes for upcoming matchups.
            </p>
          ) : (
            <div className="space-y-4">
              {athlete.opponentNotes.map((note) => (
                <div key={note.id} className="p-6 bg-gray-50 rounded-lg print-section">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">
                        vs. {note.opponentLabel}
                        {note.club && (
                          <span className="text-gray-600 font-normal ml-2">
                            ({note.club})
                          </span>
                        )}
                      </h4>
                      {note.tournament && (
                        <p className="text-sm text-gray-600 mt-1">{note.tournament}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold uppercase tracking-wide no-print"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-300">
                    {note.stance && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stance</p>
                        <p className="text-sm capitalize">{note.stance}</p>
                      </div>
                    )}
                    {note.weightClass && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight</p>
                        <p className="text-sm">{note.weightClass}</p>
                      </div>
                    )}
                    {note.ageDivision && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Division</p>
                        <p className="text-sm">{note.ageDivision}</p>
                      </div>
                    )}
                  </div>

                  {note.kumiKata && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Kumi-kata</p>
                      <p className="text-sm text-gray-900">{note.kumiKata}</p>
                    </div>
                  )}

                  {note.neWaza && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ne-waza</p>
                      <p className="text-sm text-gray-900">{note.neWaza}</p>
                    </div>
                  )}

                  {note.commonCounters && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Common Counters</p>
                      <p className="text-sm text-gray-900">{note.commonCounters}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Scouting Notes</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{note.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
