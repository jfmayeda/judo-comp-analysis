'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AthleteWithNotes, TournamentDay } from '@/lib/types';
import {
  getAllAthletesWithNotes,
  getAllTournamentDays,
  createTournamentDay,
  getTournamentDayEntries,
  setTournamentDayAthletes,
} from '@/lib/supabase-store';
import { useAuth } from '@/lib/auth-context';

export default function TournamentDayPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAllowlisted } = useAuth();
  const [athletes, setAthletes] = useState<AthleteWithNotes[]>([]);
  const [tournamentDays, setTournamentDays] = useState<TournamentDay[]>([]);
  const [selectedTournamentDay, setSelectedTournamentDay] = useState<TournamentDay | null>(null);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      loadData();
    }
  }, [user, authLoading, isAllowlisted, router]);

  const loadData = async () => {
    try {
      const [athletesData, tournamentDaysData] = await Promise.all([
        getAllAthletesWithNotes(),
        getAllTournamentDays(),
      ]);
      
      setAthletes(athletesData);
      setTournamentDays(tournamentDaysData);

      // Auto-select today's tournament day if exists
      const today = new Date().toISOString().split('T')[0];
      const todayTournament = tournamentDaysData.find(t => t.day === today);
      
      if (todayTournament) {
        setSelectedTournamentDay(todayTournament);
        await loadTournamentDaySelections(todayTournament.id);
      } else {
        // Create today's tournament day automatically
        const newTournament = await createTournamentDay({
          name: `Tournament ${new Date().toLocaleDateString()}`,
          day: today,
        });
        setTournamentDays([newTournament, ...tournamentDaysData]);
        setSelectedTournamentDay(newTournament);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDaySelections = async (tournamentDayId: string) => {
    try {
      const entries = await getTournamentDayEntries(tournamentDayId);
      setSelectedAthleteIds(new Set(entries.map(e => e.athleteId)));
    } catch (error) {
      console.error('Error loading selections:', error);
    }
  };

  const handleTournamentDayChange = async (tournamentDayId: string) => {
    const tournament = tournamentDays.find(t => t.id === tournamentDayId);
    if (tournament) {
      setSelectedTournamentDay(tournament);
      await loadTournamentDaySelections(tournamentDayId);
    }
  };

  const handleToggleAthlete = (athleteId: string) => {
    const newSet = new Set(selectedAthleteIds);
    if (newSet.has(athleteId)) {
      newSet.delete(athleteId);
    } else {
      newSet.add(athleteId);
    }
    setSelectedAthleteIds(newSet);
  };

  const handleSave = async () => {
    if (!selectedTournamentDay) return;
    
    setSaving(true);
    try {
      await setTournamentDayAthletes(
        selectedTournamentDay.id,
        Array.from(selectedAthleteIds)
      );
    } catch (error) {
      console.error('Error saving selections:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPack = () => {
    if (!selectedTournamentDay || selectedAthleteIds.size === 0) return;
    
    const selectedAthletes = athletes.filter(a => selectedAthleteIds.has(a.id));
    const athleteIdsParam = selectedAthletes.map(a => a.id).join(',');
    
    window.open(`/tournament-day/print?athletes=${encodeURIComponent(athleteIdsParam)}`, '_blank');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen navy-field flex items-center justify-center">
        <p className="text-white">Loading tournament day...</p>
      </div>
    );
  }

  const selectedAthletes = athletes.filter(a => selectedAthleteIds.has(a.id));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header">
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <p className="eyebrow mb-2">Tournament Day</p>
          <h2 className="text-3xl mb-2">Who's Fighting Today</h2>
          <p className="text-gray-700">
            Select competing athletes and print the tournament pack for matside coaching
          </p>
        </div>

        {/* Tournament Day Selector & Actions */}
        <div className="card p-6 mb-6">
          <div className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="eyebrow block text-gray-700 mb-2">
                Tournament Day
              </label>
              {selectedTournamentDay && (
                <select
                  value={selectedTournamentDay.id}
                  onChange={(e) => handleTournamentDayChange(e.target.value)}
                  className="form-input w-full"
                >
                  {tournamentDays.map(td => (
                    <option key={td.id} value={td.id}>
                      {new Date(td.day).toLocaleDateString()} {td.name && `- ${td.name}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !selectedTournamentDay}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Selection'}
            </button>
            <button
              onClick={handlePrintPack}
              disabled={selectedAthleteIds.size === 0}
              className="btn-secondary"
            >
              Print Pack ({selectedAthleteIds.size})
            </button>
            <Link
              href="/tournament-day/assign"
              className="btn-primary inline-block text-center"
            >
              Assign Coaches →
            </Link>
          </div>

          {selectedAthletes.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">{selectedAthletes.length} athlete{selectedAthletes.length !== 1 ? 's' : ''} selected:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedAthletes.map(athlete => (
                  <div
                    key={athlete.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-900 rounded-full text-sm"
                  >
                    <span className="font-semibold">{athlete.firstName} {athlete.lastInitial}.</span>
                    {athlete.weightClass && <span className="text-blue-700">• {athlete.weightClass}</span>}
                    {athlete.opponentNotes.length > 0 && (
                      <span className="text-blue-700">• {athlete.opponentNotes.length} note{athlete.opponentNotes.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Athlete Selection Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {athletes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">
                No athletes in roster. <Link href="/" className="text-brand-blue hover:text-brand-blue-hover font-semibold">Add athletes</Link> to get started.
              </p>
            </div>
          ) : (
            athletes.map((athlete) => {
              const isSelected = selectedAthleteIds.has(athlete.id);
              return (
                <div
                  key={athlete.id}
                  onClick={() => handleToggleAthlete(athlete.id)}
                  className={`card p-6 cursor-pointer transition-all ${
                    isSelected 
                      ? 'ring-2 ring-brand-blue bg-blue-50' 
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {athlete.firstName} {athlete.lastInitial}.
                    </h3>
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-brand-blue border-brand-blue' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {athlete.tokuiWaza && (
                      <p className="text-gray-700 text-sm">
                        <span className="eyebrow text-xs text-gray-500">Tokui-waza:</span>{' '}
                        <span className="text-base">{athlete.tokuiWaza}</span>
                      </p>
                    )}
                    
                    <div className="flex gap-4 text-sm flex-wrap">
                      {athlete.stance && (
                        <div>
                          <span className="eyebrow text-xs text-gray-500">Stance:</span>{' '}
                          <span className="capitalize">{athlete.stance}</span>
                        </div>
                      )}
                      {athlete.weightClass && (
                        <div>
                          <span className="eyebrow text-xs text-gray-500">Weight:</span>{' '}
                          {athlete.weightClass}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {athlete.opponentNotes.length} opponent note{athlete.opponentNotes.length !== 1 ? 's' : ''}
                    </span>
                    <Link
                      href={`/athletes/${athlete.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-brand-blue hover:text-brand-blue-hover font-semibold"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
