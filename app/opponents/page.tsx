'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Opponent, Stance } from '@/lib/types';
import { getAllOpponents, createOpponent, updateOpponent, deleteOpponent, searchOpponents } from '@/lib/supabase-store';
import { useAuth } from '@/lib/auth-context';
import TechniquePicker from '@/components/TechniquePicker';
import TechniqueDisplay from '@/components/TechniqueDisplay';

export default function OpponentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAllowlisted, signOut } = useAuth();
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [filteredOpponents, setFilteredOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastInitial: '',
    club: '',
    stance: '' as Stance | '',
    kumiKata: '',
    neWaza: '',
    commonCounters: '',
    weightClass: '',
    ageDivision: '',
    notes: '',
    techniqueIds: [] as string[],
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
      loadOpponents();
    }
  }, [user, authLoading, isAllowlisted, router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOpponents(opponents);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = opponents.filter(opp => 
        opp.firstName.toLowerCase().includes(query) ||
        opp.lastInitial.toLowerCase().includes(query) ||
        opp.club.toLowerCase().includes(query)
      );
      setFilteredOpponents(filtered);
    }
  }, [searchQuery, opponents]);

  const loadOpponents = async () => {
    try {
      const data = await getAllOpponents();
      setOpponents(data);
      setFilteredOpponents(data);
    } catch (error) {
      console.error('Error loading opponents:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastInitial: '',
      club: '',
      stance: '',
      kumiKata: '',
      neWaza: '',
      commonCounters: '',
      weightClass: '',
      ageDivision: '',
      notes: '',
      techniqueIds: [],
    });
    setEditingOpponent(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOpponent) {
        await updateOpponent(editingOpponent.id, {
          firstName: formData.firstName,
          lastInitial: formData.lastInitial,
          club: formData.club,
          stance: formData.stance || null,
          kumiKata: formData.kumiKata,
          neWaza: formData.neWaza,
          commonCounters: formData.commonCounters,
          weightClass: formData.weightClass,
          ageDivision: formData.ageDivision,
          notes: formData.notes,
          techniqueIds: formData.techniqueIds,
        });
      } else {
        await createOpponent({
          firstName: formData.firstName,
          lastInitial: formData.lastInitial,
          club: formData.club,
          stance: formData.stance || null,
          kumiKata: formData.kumiKata,
          neWaza: formData.neWaza,
          commonCounters: formData.commonCounters,
          weightClass: formData.weightClass,
          ageDivision: formData.ageDivision,
          notes: formData.notes,
          techniqueIds: formData.techniqueIds,
        });
      }
      resetForm();
      await loadOpponents();
    } catch (error: any) {
      console.error('Error saving opponent:', error);
      alert(`Error: ${error.message || 'Failed to save opponent'}`);
    }
  };

  const handleEdit = (opponent: Opponent) => {
    setFormData({
      firstName: opponent.firstName,
      lastInitial: opponent.lastInitial,
      club: opponent.club,
      stance: opponent.stance || '',
      kumiKata: opponent.kumiKata,
      neWaza: opponent.neWaza,
      commonCounters: opponent.commonCounters,
      weightClass: opponent.weightClass,
      ageDivision: opponent.ageDivision,
      notes: opponent.notes,
      techniqueIds: opponent.techniqueIds || [],
    });
    setEditingOpponent(opponent);
    setShowAddForm(true);
  };

  const handleDelete = async (opponent: Opponent) => {
    if (!confirm(`Delete ${opponent.firstName} ${opponent.lastInitial}.? Any scouting notes linked to this opponent will become one-off notes.`)) {
      return;
    }
    try {
      await deleteOpponent(opponent.id);
      await loadOpponents();
    } catch (error: any) {
      console.error('Error deleting opponent:', error);
      alert(`Error: ${error.message || 'Failed to delete opponent'}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen navy-field flex items-center justify-center">
        <p className="text-white">Loading opponents...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header flex flex-wrap items-center justify-between px-4 md:px-8 gap-3">
        <div>
          <p className="eyebrow text-white mb-1">Competitor Analysis</p>
          <h1 className="wordmark text-xl">SILICON VALLEY JUDO</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="btn-secondary text-white border-white hover:bg-white hover:text-gray-900 text-sm"
          >
            Roster
          </Link>
          <Link
            href="/tournament-day"
            className="btn-secondary text-white border-white hover:bg-white hover:text-gray-900 text-sm"
          >
            Tournament Day
          </Link>
          <button
            onClick={handleLogout}
            className="btn-secondary text-white border-white hover:bg-white hover:text-gray-900 text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <p className="eyebrow mb-2">Shared Database</p>
            <h2 className="text-2xl md:text-3xl mb-2">Opponents</h2>
            <p className="text-gray-700 text-sm md:text-base">
              {opponents.length} opponent{opponents.length !== 1 ? 's' : ''} • Club-wide reusable records for scouting notes
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="btn-primary w-full md:w-auto"
          >
            {showAddForm ? 'Cancel' : 'Add Opponent'}
          </button>
        </div>

        {showAddForm && (
          <div className="card p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl mb-4 md:mb-6 uppercase tracking-wide">
              {editingOpponent ? 'Edit Opponent' : 'Add New Opponent'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow block text-gray-700 mb-2">
                    First Name *
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
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Club
                </label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={(e) =>
                    setFormData({ ...formData, club: e.target.value })
                  }
                  placeholder="e.g. Peninsula Judo"
                  className="form-input w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="e.g. -57kg"
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
                    placeholder="e.g. Junior"
                    className="form-input w-full"
                  />
                </div>
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
                  placeholder="e.g. High lapel grip, quick hand changes"
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
                  placeholder="e.g. Strong pins, working on turtle attacks"
                  className="form-input w-full"
                />
              </div>

              <div>
                <TechniquePicker
                  label="Tokui-waza (favorite techniques)"
                  selectedIds={formData.techniqueIds}
                  onChange={(techniqueIds) =>
                    setFormData({ ...formData, techniqueIds })
                  }
                  placeholder="Search techniques..."
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Common Counters
                </label>
                <input
                  type="text"
                  value={formData.commonCounters}
                  onChange={(e) =>
                    setFormData({ ...formData, commonCounters: e.target.value })
                  }
                  placeholder="e.g. Ko-soto-gake on failed attacks"
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  General Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="General scouting information about this opponent"
                  className="form-input w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary flex-1 md:flex-initial"
                >
                  {editingOpponent ? 'Update Opponent' : 'Create Opponent'}
                </button>
                {editingOpponent && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary flex-1 md:flex-initial"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {opponents.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpponents.length === 0 && opponents.length === 0 ? (
            <div className="col-span-full">
              <p className="text-gray-600 text-center py-12">
                No opponents yet. Add shared opponents to reuse across athlete scouting notes.
              </p>
            </div>
          ) : filteredOpponents.length === 0 ? (
            <div className="col-span-full">
              <p className="text-gray-600 text-center py-12">
                No opponents match your search.
              </p>
            </div>
          ) : (
            filteredOpponents.map((opponent) => (
              <div
                key={opponent.id}
                className="card p-4 md:p-6"
              >
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">
                  {opponent.firstName} {opponent.lastInitial}.
                </h3>
                
                {opponent.club && (
                  <p className="text-sm text-gray-600 mb-3">{opponent.club}</p>
                )}
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex flex-wrap gap-4">
                    {opponent.stance && (
                      <div>
                        <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Stance:</span>{' '}
                        <span className="capitalize">{opponent.stance}</span>
                      </div>
                    )}
                    {opponent.weightClass && (
                      <div>
                        <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Weight:</span>{' '}
                        {opponent.weightClass}
                      </div>
                    )}
                  </div>
                  
                  {opponent.ageDivision && (
                    <p>
                      <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Division:</span>{' '}
                      {opponent.ageDivision}
                    </p>
                  )}

                  <TechniqueDisplay
                    techniqueIds={opponent.techniqueIds}
                    label="Tokui-waza"
                  />

                  {opponent.kumiKata && (
                    <p>
                      <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Kumi-kata:</span>{' '}
                      {opponent.kumiKata}
                    </p>
                  )}

                  {opponent.neWaza && (
                    <p>
                      <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Ne-waza:</span>{' '}
                      {opponent.neWaza}
                    </p>
                  )}

                  {opponent.commonCounters && (
                    <p>
                      <span className="font-semibold uppercase tracking-wide text-xs text-gray-500">Counters:</span>{' '}
                      {opponent.commonCounters}
                    </p>
                  )}

                  {opponent.notes && (
                    <p className="text-gray-700 pt-2 border-t border-gray-200">
                      {opponent.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleEdit(opponent)}
                    className="btn-secondary text-sm flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(opponent)}
                    className="btn-secondary border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-sm flex-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
