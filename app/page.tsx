'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AthleteWithNotes, Stance } from '@/lib/types';
import { getAllAthletesWithNotes, createAthlete, seedDataIfEmpty } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<AthleteWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
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

  useEffect(() => {
    // Check auth
    const isAuthenticated = localStorage.getItem('judo-auth');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Seed data if this is first visit
    seedDataIfEmpty();
    // Load athletes
    loadAthletes();
  }, []);

  const loadAthletes = () => {
    try {
      const data = getAllAthletesWithNotes();
      setAthletes(data);
    } catch (error) {
      console.error('Error loading athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createAthlete({
        firstName: formData.firstName,
        lastInitial: formData.lastInitial,
        tokuiWaza: formData.tokuiWaza,
        developmentAreas: formData.developmentAreas,
        notes: formData.notes,
        stance: formData.stance || null,
        kumiKata: formData.kumiKata,
        neWaza: formData.neWaza,
        weightClass: formData.weightClass,
        ageDivision: formData.ageDivision,
      });
      setFormData({
        firstName: '',
        lastInitial: '',
        tokuiWaza: '',
        developmentAreas: '',
        notes: '',
        stance: '',
        kumiKata: '',
        neWaza: '',
        weightClass: '',
        ageDivision: '',
      });
      setShowAddForm(false);
      loadAthletes();
    } catch (error) {
      console.error('Error creating athlete:', error);
      alert('Failed to create athlete. Please check your input.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('judo-auth');
    router.push('/login');
  };

  const handleSeedData = () => {
    localStorage.removeItem('judo-initialized');
    seedDataIfEmpty();
    loadAthletes();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header flex items-center justify-between px-8">
        <div>
          <p className="eyebrow text-white mb-1">Competitor Analysis</p>
          <h1 className="wordmark text-xl">SILICON VALLEY JUDO</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSeedData}
            className="btn-secondary text-white border-white hover:bg-white hover:text-gray-900 text-sm"
          >
            Seed Data
          </button>
          <button
            onClick={handleLogout}
            className="btn-secondary text-white border-white hover:bg-white hover:text-gray-900 text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl mb-2">Athlete Roster</h2>
            <p className="text-gray-600">
              {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} • Click to view profile and scouting notes
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : 'Add Athlete'}
          </button>
        </div>

        {showAddForm && (
          <div className="card p-6 mb-8">
            <h3 className="text-xl mb-6">Add New Athlete</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Stance
                  </label>
                  <select
                    value={formData.stance}
                    onChange={(e) =>
                      setFormData({ ...formData, stance: e.target.value as Stance | '' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Not set</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Weight Class
                  </label>
                  <input
                    type="text"
                    value={formData.weightClass}
                    onChange={(e) =>
                      setFormData({ ...formData, weightClass: e.target.value })
                    }
                    placeholder="e.g. -57kg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Age Division
                  </label>
                  <input
                    type="text"
                    value={formData.ageDivision}
                    onChange={(e) =>
                      setFormData({ ...formData, ageDivision: e.target.value })
                    }
                    placeholder="e.g. Junior"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Tokui-waza (favorite techniques)
                </label>
                <input
                  type="text"
                  value={formData.tokuiWaza}
                  onChange={(e) =>
                    setFormData({ ...formData, tokuiWaza: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Kumi-kata (grip style)
                </label>
                <input
                  type="text"
                  value={formData.kumiKata}
                  onChange={(e) =>
                    setFormData({ ...formData, kumiKata: e.target.value })
                  }
                  placeholder="e.g. High lapel grip, quick hand changes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Ne-waza (ground game)
                </label>
                <input
                  type="text"
                  value={formData.neWaza}
                  onChange={(e) =>
                    setFormData({ ...formData, neWaza: e.target.value })
                  }
                  placeholder="e.g. Strong pins, working on turtle attacks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Development Areas
                </label>
                <input
                  type="text"
                  value={formData.developmentAreas}
                  onChange={(e) =>
                    setFormData({ ...formData, developmentAreas: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
              >
                Create Athlete
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {athletes.length === 0 ? (
            <div className="col-span-full">
              <p className="text-gray-600 text-center py-12">
                No athletes yet. Add your first athlete to get started.
              </p>
            </div>
          ) : (
            athletes.map((athlete) => (
              <Link
                key={athlete.id}
                href={`/athletes/${athlete.id}`}
                className="card p-6 block group"
              >
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  {athlete.firstName} {athlete.lastInitial}.
                </h3>
                
                <div className="space-y-2 mb-4">
                  {athlete.tokuiWaza && (
                    <p className="text-gray-700 text-sm">
                      <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Tokui-waza:</span>{' '}
                      <span className="text-base">{athlete.tokuiWaza}</span>
                    </p>
                  )}
                  
                  <div className="flex gap-4 text-sm">
                    {athlete.stance && (
                      <div>
                        <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Stance:</span>{' '}
                        <span className="capitalize">{athlete.stance}</span>
                      </div>
                    )}
                    {athlete.weightClass && (
                      <div>
                        <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Weight:</span>{' '}
                        {athlete.weightClass}
                      </div>
                    )}
                  </div>
                  
                  {athlete.ageDivision && (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Division:</span>{' '}
                      {athlete.ageDivision}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {athlete.opponentNotes.length} opponent note{athlete.opponentNotes.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-blue-600 group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
