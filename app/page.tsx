'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Athlete = {
  id: string;
  firstName: string;
  lastInitial: string;
  tokuiWaza: string;
  developmentAreas: string;
  notes: string;
  opponentNotes: Array<{
    id: string;
    opponentLabel: string;
    club: string | null;
    notes: string;
  }>;
};

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastInitial: '',
    tokuiWaza: '',
    developmentAreas: '',
    notes: '',
  });

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    try {
      const res = await fetch('/api/athletes');
      const data = await res.json();
      setAthletes(data);
    } catch (error) {
      console.error('Error fetching athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({
          firstName: '',
          lastInitial: '',
          tokuiWaza: '',
          developmentAreas: '',
          notes: '',
        });
        setShowAddForm(false);
        fetchAthletes();
      }
    } catch (error) {
      console.error('Error creating athlete:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Silicon Valley Judo - Competitor Analysis
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : 'Add Athlete'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Athlete</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
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
                    Last Initial * (one letter)
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
                  Tokui-waza (favorite techniques)
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Athlete
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {athletes.length === 0 ? (
            <p className="text-gray-600 text-center py-12">
              No athletes yet. Add your first athlete to get started.
            </p>
          ) : (
            athletes.map((athlete) => (
              <Link
                key={athlete.id}
                href={`/athletes/${athlete.id}`}
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {athlete.firstName} {athlete.lastInitial}.
                    </h2>
                    {athlete.tokuiWaza && (
                      <p className="text-gray-700 mb-1">
                        <span className="font-medium">Tokui-waza:</span> {athlete.tokuiWaza}
                      </p>
                    )}
                    {athlete.developmentAreas && (
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium">Development:</span>{' '}
                        {athlete.developmentAreas}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {athlete.opponentNotes.length} opponent note
                      {athlete.opponentNotes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
