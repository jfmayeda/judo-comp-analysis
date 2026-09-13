'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AthleteWithNotes, TournamentDay, TournamentDayEntry, Coach } from '@/lib/types';
import {
  getAllAthletesWithNotes,
  getAllTournamentDays,
  getTournamentDayEntries,
  updateTournamentDayEntry,
  getAllCoaches,
} from '@/lib/supabase-store';
import { useAuth } from '@/lib/auth-context';

type EntryWithAthlete = TournamentDayEntry & {
  athlete: AthleteWithNotes;
};

export default function AssignmentBoardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAllowlisted } = useAuth();
  const [athletes, setAthletes] = useState<AthleteWithNotes[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [tournamentDays, setTournamentDays] = useState<TournamentDay[]>([]);
  const [selectedTournamentDay, setSelectedTournamentDay] = useState<TournamentDay | null>(null);
  const [entries, setEntries] = useState<EntryWithAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'by-coach' | 'by-mat'>('all');
  const [selectedCoachFilter, setSelectedCoachFilter] = useState<string | null>(null);

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
      const [athletesData, tournamentDaysData, coachesData] = await Promise.all([
        getAllAthletesWithNotes(),
        getAllTournamentDays(),
        getAllCoaches(),
      ]);
      
      setAthletes(athletesData);
      setTournamentDays(tournamentDaysData);
      setCoaches(coachesData);

      const today = new Date().toISOString().split('T')[0];
      const todayTournament = tournamentDaysData.find(t => t.day === today);
      
      if (todayTournament) {
        setSelectedTournamentDay(todayTournament);
        await loadTournamentDayEntries(todayTournament.id, athletesData);
      } else if (tournamentDaysData.length > 0) {
        setSelectedTournamentDay(tournamentDaysData[0]);
        await loadTournamentDayEntries(tournamentDaysData[0].id, athletesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDayEntries = async (tournamentDayId: string, athletesData: AthleteWithNotes[]) => {
    try {
      const entriesData = await getTournamentDayEntries(tournamentDayId);
      const entriesWithAthletes = entriesData.map(entry => {
        const athlete = athletesData.find(a => a.id === entry.athleteId);
        return athlete ? { ...entry, athlete } : null;
      }).filter(e => e !== null) as EntryWithAthlete[];
      
      setEntries(entriesWithAthletes);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleTournamentDayChange = async (tournamentDayId: string) => {
    const tournament = tournamentDays.find(t => t.id === tournamentDayId);
    if (tournament) {
      setSelectedTournamentDay(tournament);
      await loadTournamentDayEntries(tournamentDayId, athletes);
    }
  };

  const handleUpdateEntry = async (
    entryId: string,
    updates: {
      assignedCoachId?: string | null;
      matNumber?: string | null;
      timeWindow?: string | null;
      noCoachNeeded?: boolean;
    }
  ) => {
    setSaving(entryId);
    try {
      const updated = await updateTournamentDayEntry(entryId, updates);
      setEntries(entries.map(e => e.id === entryId ? { ...e, ...updated } : e));
    } catch (error) {
      console.error('Error updating entry:', error);
    } finally {
      setSaving(null);
    }
  };

  const getCoachName = (coachId: string | null | undefined) => {
    if (!coachId) return null;
    const coach = coaches.find(c => c.id === coachId);
    return coach ? coach.email.split('@')[0] : 'Unknown';
  };

  const getConflicts = (entryId: string, coachId: string | null | undefined, timeWindow: string | null | undefined) => {
    if (!coachId || !timeWindow) return [];
    
    return entries.filter(e => 
      e.id !== entryId && 
      e.assignedCoachId === coachId && 
      e.timeWindow && 
      e.timeWindow === timeWindow
    );
  };

  const getExclusiveCoachWarning = (coachId: string | null | undefined, currentAthleteId: string) => {
    if (!coachId) return null;
    
    const athleteWithExclusiveCoach = athletes.find(a => 
      a.preferredCoachId === coachId && 
      a.coachIsExclusive &&
      a.id !== currentAthleteId
    );
    
    if (athleteWithExclusiveCoach) {
      return `⚠️ This coach is exclusive to ${athleteWithExclusiveCoach.firstName} ${athleteWithExclusiveCoach.lastInitial}.`;
    }
    
    return null;
  };

  const groupedByCoach = () => {
    const groups: Record<string, EntryWithAthlete[]> = {
      'Unassigned': entries.filter(e => !e.assignedCoachId && !e.noCoachNeeded),
      'No Coach Needed': entries.filter(e => e.noCoachNeeded),
    };
    
    coaches.forEach(coach => {
      const coachEntries = entries.filter(e => e.assignedCoachId === coach.id);
      if (coachEntries.length > 0) {
        groups[coach.email.split('@')[0]] = coachEntries;
      }
    });
    
    return groups;
  };

  const groupedByMat = () => {
    const groups: Record<string, EntryWithAthlete[]> = {
      'No Mat Assigned': entries.filter(e => !e.matNumber),
    };
    
    const matsSet = new Set(entries.filter(e => e.matNumber).map(e => e.matNumber!));
    Array.from(matsSet).sort().forEach(mat => {
      groups[`Mat ${mat}`] = entries.filter(e => e.matNumber === mat);
    });
    
    return groups;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen navy-field flex items-center justify-center">
        <p className="text-white">Loading assignment board...</p>
      </div>
    );
  }

  const filteredEntries = viewMode === 'all' 
    ? entries
    : selectedCoachFilter
    ? entries.filter(e => e.assignedCoachId === selectedCoachFilter || (selectedCoachFilter === 'unassigned' && !e.assignedCoachId && !e.noCoachNeeded) || (selectedCoachFilter === 'no-coach-needed' && e.noCoachNeeded))
    : entries;

  return (
    <div className="min-h-screen">
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Link href="/tournament-day" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <span className="text-xl">←</span>
            <img 
              src="/svj-logo-white.png" 
              alt="Silicon Valley Judo" 
              className="app-header-logo"
            />
            <p className="eyebrow text-white text-xs uppercase">COACH ASSIGNMENTS</p>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <p className="eyebrow mb-2">Tournament Day</p>
          <h2 className="text-3xl mb-2">Coach Assignment Board</h2>
          <p className="text-gray-700">
            Assign coaches to athletes, set mat numbers and time windows
          </p>
        </div>

        {/* Tournament Day Selector */}
        <div className="card p-6 mb-6">
          <div className="flex gap-4 items-end mb-4">
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
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Entries
              </button>
              <button
                onClick={() => setViewMode('by-coach')}
                className={`px-4 py-2 rounded transition-colors ${
                  viewMode === 'by-coach' 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Coach
              </button>
              <button
                onClick={() => setViewMode('by-mat')}
                className={`px-4 py-2 rounded transition-colors ${
                  viewMode === 'by-mat' 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Mat
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No athletes selected for this tournament day.{' '}
              <Link href="/tournament-day" className="text-brand-blue hover:text-brand-blue-hover font-semibold">
                Select athletes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Entries</p>
                <p className="text-2xl font-bold text-brand-blue">{entries.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Assigned</p>
                <p className="text-2xl font-bold text-green-700">
                  {entries.filter(e => e.assignedCoachId || e.noCoachNeeded).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Unassigned</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {entries.filter(e => !e.assignedCoachId && !e.noCoachNeeded).length}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">No Coach Needed</p>
                <p className="text-2xl font-bold text-purple-700">
                  {entries.filter(e => e.noCoachNeeded).length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Assignments List */}
        {viewMode === 'all' && (
          <div className="space-y-4">
            {entries.map(entry => {
              const conflicts = getConflicts(entry.id, entry.assignedCoachId, entry.timeWindow);
              const exclusiveWarning = getExclusiveCoachWarning(entry.assignedCoachId, entry.athlete.id);
              const preferredCoachName = entry.athlete.preferredCoachId 
                ? getCoachName(entry.athlete.preferredCoachId) 
                : null;
              
              return (
                <div key={entry.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {entry.athlete.firstName} {entry.athlete.lastInitial}.
                      </h3>
                      {entry.athlete.weightClass && (
                        <p className="text-sm text-gray-600">{entry.athlete.weightClass}</p>
                      )}
                      {preferredCoachName && (
                        <p className="text-xs text-blue-600 mt-1">
                          Preferred: {preferredCoachName}
                          {entry.athlete.isCoachLocked && ' 🔒'}
                          {entry.athlete.coachIsExclusive && ' ⭐ (Exclusive)'}
                        </p>
                      )}
                    </div>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={entry.noCoachNeeded}
                        onChange={(e) => handleUpdateEntry(entry.id, { 
                          noCoachNeeded: e.target.checked,
                          assignedCoachId: e.target.checked ? null : entry.assignedCoachId
                        })}
                        disabled={saving === entry.id}
                        className="rounded"
                      />
                      <span className="text-gray-700">No coach needed (SVJ vs SVJ)</span>
                    </label>
                  </div>

                  {!entry.noCoachNeeded && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="eyebrow text-xs text-gray-500 block mb-2">
                          Assigned Coach
                        </label>
                        <select
                          value={entry.assignedCoachId || ''}
                          onChange={(e) => handleUpdateEntry(entry.id, { 
                            assignedCoachId: e.target.value || null 
                          })}
                          disabled={saving === entry.id}
                          className="form-input w-full"
                        >
                          <option value="">Select coach...</option>
                          {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                              {coach.email.split('@')[0]}
                            </option>
                          ))}
                        </select>
                        {exclusiveWarning && (
                          <p className="text-xs text-orange-600 mt-1">{exclusiveWarning}</p>
                        )}
                      </div>

                      <div>
                        <label className="eyebrow text-xs text-gray-500 block mb-2">
                          Mat Number
                        </label>
                        <input
                          type="text"
                          value={entry.matNumber || ''}
                          onChange={(e) => handleUpdateEntry(entry.id, { 
                            matNumber: e.target.value || null 
                          })}
                          disabled={saving === entry.id}
                          placeholder="e.g., 1, 2, 3"
                          className="form-input w-full"
                        />
                      </div>

                      <div>
                        <label className="eyebrow text-xs text-gray-500 block mb-2">
                          Time Window
                        </label>
                        <input
                          type="text"
                          value={entry.timeWindow || ''}
                          onChange={(e) => handleUpdateEntry(entry.id, { 
                            timeWindow: e.target.value || null 
                          })}
                          disabled={saving === entry.id}
                          placeholder="e.g., 9:00-10:00 AM"
                          className="form-input w-full"
                        />
                      </div>
                    </div>
                  )}

                  {conflicts.length > 0 && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-sm text-orange-800">
                        ⚠️ Potential conflict: {getCoachName(entry.assignedCoachId)} is also assigned to{' '}
                        {conflicts.map(c => `${c.athlete.firstName} ${c.athlete.lastInitial}.`).join(', ')} at this time
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* By Coach View */}
        {viewMode === 'by-coach' && (
          <div className="space-y-6">
            {Object.entries(groupedByCoach()).map(([coachName, coachEntries]) => (
              <div key={coachName} className="card p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  {coachName} <span className="text-sm font-normal text-gray-600">({coachEntries.length})</span>
                </h3>
                <div className="space-y-2">
                  {coachEntries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold">
                          {entry.athlete.firstName} {entry.athlete.lastInitial}.
                        </p>
                        <p className="text-sm text-gray-600">
                          {entry.matNumber && `Mat ${entry.matNumber}`}
                          {entry.matNumber && entry.timeWindow && ' • '}
                          {entry.timeWindow}
                        </p>
                      </div>
                      <Link
                        href={`/athletes/${entry.athlete.id}`}
                        className="text-sm text-brand-blue hover:text-brand-blue-hover font-semibold"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* By Mat View */}
        {viewMode === 'by-mat' && (
          <div className="space-y-6">
            {Object.entries(groupedByMat()).map(([matName, matEntries]) => (
              <div key={matName} className="card p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  {matName} <span className="text-sm font-normal text-gray-600">({matEntries.length})</span>
                </h3>
                <div className="space-y-2">
                  {matEntries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold">
                          {entry.athlete.firstName} {entry.athlete.lastInitial}.
                        </p>
                        <p className="text-sm text-gray-600">
                          {entry.assignedCoachId ? getCoachName(entry.assignedCoachId) : 'No coach assigned'}
                          {entry.timeWindow && ` • ${entry.timeWindow}`}
                          {entry.noCoachNeeded && ' • No coach needed'}
                        </p>
                      </div>
                      <Link
                        href={`/athletes/${entry.athlete.id}`}
                        className="text-sm text-brand-blue hover:text-brand-blue-hover font-semibold"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
