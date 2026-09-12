'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function AthletePage() {
  const params = useParams();
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastInitial: '',
    tokuiWaza: '',
    developmentAreas: '',
    notes: '',
  });
  const [noteFormData, setNoteFormData] = useState({
    opponentLabel: '',
    club: '',
    notes: '',
    tournament: '',
  });

  useEffect(() => {
    fetchAthlete();
  }, []);

  const fetchAthlete = async () => {
    try {
      const res = await fetch(`/api/athletes/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAthlete(data);
        setFormData({
          firstName: data.firstName,
          lastInitial: data.lastInitial,
          tokuiWaza: data.tokuiWaza,
          developmentAreas: data.developmentAreas,
          notes: data.notes,
        });
      }
    } catch (error) {
      console.error('Error fetching athlete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/athletes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditing(false);
        fetchAthlete();
      }
    } catch (error) {
      console.error('Error updating athlete:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${athlete?.firstName} ${athlete?.lastInitial}. and all related notes?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/athletes/${params.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting athlete:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/opponent-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: params.id,
          ...noteFormData,
        }),
      });
      if (res.ok) {
        setNoteFormData({
          opponentLabel: '',
          club: '',
          notes: '',
          tournament: '',
        });
        setShowAddNote(false);
        fetchAthlete();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this opponent note?')) {
      return;
    }
    try {
      const res = await fetch(`/api/opponent-notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAthlete();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 no-print">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Athletes
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4 no-print">
            <h1 className="text-3xl font-bold text-gray-900">
              {athlete.firstName} {athlete.lastInitial}.
            </h1>
            <div className="flex gap-2">
              <Link
                href={`/athletes/${athlete.id}/print`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Print Profile
              </Link>
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editing ? 'Cancel Edit' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tokui-waza
                </label>
                <input
                  type="text"
                  value={formData.tokuiWaza}
                  onChange={(e) =>
                    setFormData({ ...formData, tokuiWaza: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Development Areas
                </label>
                <input
                  type="text"
                  value={formData.developmentAreas}
                  onChange={(e) =>
                    setFormData({ ...formData, developmentAreas: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {athlete.tokuiWaza && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Tokui-waza</h3>
                  <p className="text-gray-900">{athlete.tokuiWaza}</p>
                </div>
              )}
              {athlete.developmentAreas && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Development Areas</h3>
                  <p className="text-gray-900">{athlete.developmentAreas}</p>
                </div>
              )}
              {athlete.notes && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Notes</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{athlete.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4 no-print">
            <h2 className="text-2xl font-bold text-gray-900">Opponent Notes</h2>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showAddNote ? 'Cancel' : 'Add Note'}
            </button>
          </div>

          {showAddNote && (
            <form onSubmit={handleAddNote} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4 no-print">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club
                  </label>
                  <input
                    type="text"
                    value={noteFormData.club}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, club: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tournament
                </label>
                <input
                  type="text"
                  value={noteFormData.tournament}
                  onChange={(e) =>
                    setNoteFormData({ ...noteFormData, tournament: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scouting Notes *
                </label>
                <textarea
                  required
                  value={noteFormData.notes}
                  onChange={(e) =>
                    setNoteFormData({ ...noteFormData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                <div key={note.id} className="p-4 bg-gray-50 rounded-lg print-section">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        vs. {note.opponentLabel}
                        {note.club && (
                          <span className="text-gray-600 font-normal ml-2">
                            ({note.club})
                          </span>
                        )}
                      </h3>
                      {note.tournament && (
                        <p className="text-sm text-gray-600">{note.tournament}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-800 text-sm no-print"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{note.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
