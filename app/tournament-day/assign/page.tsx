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
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/lib/auth-context';
import {
  autoAssignCoaches,
  AssignmentProposal,
  ConflictWarning,
  getCoachName as getCoachNameUtil,
} from '@/lib/coach-auto-assign';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip, Pill } from '@/components/ui/Chip';

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
  const [showAutoAssignPreview, setShowAutoAssignPreview] = useState(false);
  const [autoAssignProposals, setAutoAssignProposals] = useState<AssignmentProposal[]>([]);
  const [autoAssignConflicts, setAutoAssignConflicts] = useState<ConflictWarning[]>([]);
  const [applyingAutoAssign, setApplyingAutoAssign] = useState(false);

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
    return getCoachNameUtil(coachId, coaches);
  };

  const handleAutoAssign = () => {
    const { proposals, conflicts } = autoAssignCoaches(entries, coaches);
    setAutoAssignProposals(proposals);
    setAutoAssignConflicts(conflicts);
    setShowAutoAssignPreview(true);
  };

  const handleApplyAutoAssign = async () => {
    setApplyingAutoAssign(true);
    try {
      // Apply all proposals
      for (const proposal of autoAssignProposals) {
        await updateTournamentDayEntry(proposal.entryId, {
          assignedCoachId: proposal.proposedCoachId,
        });
      }
      
      // Reload entries
      if (selectedTournamentDay) {
        await loadTournamentDayEntries(selectedTournamentDay.id, athletes);
      }
      
      // Close preview
      setShowAutoAssignPreview(false);
      setAutoAssignProposals([]);
      setAutoAssignConflicts([]);
    } catch (error) {
      console.error('Error applying auto-assignments:', error);
      alert('Failed to apply auto-assignments. Please try again.');
    } finally {
      setApplyingAutoAssign(false);
    }
  };

  const handleClearAllAssignments = async () => {
    if (!confirm('Clear all coach assignments? This will not affect locked assignments.')) {
      return;
    }
    
    setSaving('clearing');
    try {
      const entriesToClear = entries.filter(e => 
        e.assignedCoachId && !e.athlete.isCoachLocked
      );
      
      for (const entry of entriesToClear) {
        await updateTournamentDayEntry(entry.id, {
          assignedCoachId: null,
        });
      }
      
      // Reload entries
      if (selectedTournamentDay) {
        await loadTournamentDayEntries(selectedTournamentDay.id, athletes);
      }
    } catch (error) {
      console.error('Error clearing assignments:', error);
      alert('Failed to clear assignments. Please try again.');
    } finally {
      setSaving(null);
    }
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
      return `This coach is exclusive to ${athleteWithExclusiveCoach.firstName} ${athleteWithExclusiveCoach.lastInitial}.`;
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

  const assignedCount = entries.filter(e => e.assignedCoachId || e.noCoachNeeded).length;
  const unassignedCount = entries.filter(e => !e.assignedCoachId && !e.noCoachNeeded).length;
  const noCoachCount = entries.filter(e => e.noCoachNeeded).length;
  const alreadyAssignedCount = entries.filter(e => e.assignedCoachId && !e.noCoachNeeded).length;

  return (
    <div className="min-h-screen">
      <AppHeader backHref="/tournament-day" eyebrow="Coach Assignments" />

      <div className="page-shell">
        <div className="page-title-row">
          <div className="page-title-copy">
            <p className="eyebrow mb-2">Tournament Day</p>
            <h2 className="text-2xl md:text-3xl mb-2">Coach Assignment Board</h2>
            <p className="text-svj-gray-600 text-sm md:text-base">
              Assign coaches to athletes, set mat numbers and time windows
            </p>
          </div>
        </div>

        <Card className="p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <label className="eyebrow block mb-2">
                Tournament Day
              </label>
              {selectedTournamentDay && (
                <select
                  value={selectedTournamentDay.id}
                  onChange={(e) => handleTournamentDayChange(e.target.value)}
                  className="form-input w-full text-base"
                >
                  {tournamentDays.map(td => (
                    <option key={td.id} value={td.id}>
                      {new Date(td.day).toLocaleDateString()} {td.name && `- ${td.name}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Chip
                pressed={viewMode === 'all'}
                onClick={() => setViewMode('all')}
                className="w-full"
              >
                All
              </Chip>
              <Chip
                pressed={viewMode === 'by-coach'}
                onClick={() => setViewMode('by-coach')}
                className="w-full"
              >
                By Coach
              </Chip>
              <Chip
                pressed={viewMode === 'by-mat'}
                onClick={() => setViewMode('by-mat')}
                className="w-full"
              >
                By Mat
              </Chip>
            </div>
          </div>

          {entries.length > 0 && (
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t-2 border-svj-gray-200">
              <div className="assign-actions">
                <Button
                  onClick={handleAutoAssign}
                  disabled={saving !== null}
                  className="w-full text-sm md:text-base py-3 min-h-[48px]"
                >
                  Auto-Assign Coaches
                </Button>
                <Button
                  onClick={handleClearAllAssignments}
                  disabled={saving !== null}
                  variant="secondary"
                  className="w-full text-sm md:text-base py-3 min-h-[48px]"
                >
                  Clear All (Keep Locked)
                </Button>
              </div>
              <p className="text-xs md:text-sm text-svj-gray-600 text-center">
                Auto-assign respects locked and exclusive coaches
              </p>
            </div>
          )}

          {entries.length === 0 ? (
            <div className="text-center py-8 text-svj-gray-600">
              No athletes selected for this tournament day.{' '}
              <Button as={Link} href="/tournament-day" variant="ghost" size="sm">
                Select athletes
              </Button>
            </div>
          ) : (
            <div className="assign-counts">
              <CountTile label="Total" value={entries.length} />
              <CountTile label="Assigned" value={assignedCount} />
              <CountTile label="Unassigned" value={unassignedCount} />
              <CountTile label="No Coach" value={noCoachCount} />
            </div>
          )}
        </Card>

        {viewMode === 'all' && (
          <div className="flex flex-col gap-svj-5">
            {entries.map(entry => {
              const conflicts = getConflicts(entry.id, entry.assignedCoachId, entry.timeWindow);
              const exclusiveWarning = getExclusiveCoachWarning(entry.assignedCoachId, entry.athlete.id);
              const preferredCoachName = entry.athlete.preferredCoachId 
                ? getCoachName(entry.athlete.preferredCoachId) 
                : null;
              
              return (
                <Card key={entry.id} className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-2xl font-bold text-svj-navy-900">
                        {entry.athlete.firstName} {entry.athlete.lastInitial}.
                      </h3>
                      {entry.athlete.weightClass && (
                        <p className="text-sm text-svj-gray-600">{entry.athlete.weightClass}</p>
                      )}
                      {preferredCoachName && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <p className="text-sm text-svj-gray-600">
                            Preferred: {preferredCoachName}
                          </p>
                          {entry.athlete.isCoachLocked && <Pill tone="navy">Locked</Pill>}
                          {entry.athlete.coachIsExclusive && <Pill>Exclusive</Pill>}
                        </div>
                      )}
                    </div>
                    
                    <label className="flex items-center gap-2 text-sm min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={entry.noCoachNeeded}
                        onChange={(e) => handleUpdateEntry(entry.id, { 
                          noCoachNeeded: e.target.checked,
                          assignedCoachId: e.target.checked ? null : entry.assignedCoachId
                        })}
                        disabled={saving === entry.id}
                        className="rounded-svj-control"
                      />
                      <span className="text-svj-navy-900">No coach needed (SVJ vs SVJ)</span>
                    </label>
                  </div>

                  {!entry.noCoachNeeded && (
                    <div className="assign-fields">
                      <div>
                        <label className="eyebrow text-xs block mb-2">
                          Assigned Coach
                        </label>
                        <select
                          value={entry.assignedCoachId || ''}
                          onChange={(e) => handleUpdateEntry(entry.id, { 
                            assignedCoachId: e.target.value || null 
                          })}
                          disabled={saving === entry.id}
                          className="form-input w-full text-base min-h-[44px]"
                        >
                          <option value="">Select coach...</option>
                          {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                              {coach.email.split('@')[0]}
                            </option>
                          ))}
                        </select>
                        {exclusiveWarning && (
                          <p className="text-xs text-svj-navy-800 mt-1">{exclusiveWarning}</p>
                        )}
                      </div>

                      <div>
                        <label className="eyebrow text-xs block mb-2">
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
                          className="form-input w-full text-base min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="eyebrow text-xs block mb-2">
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
                          className="form-input w-full text-base min-h-[44px]"
                        />
                      </div>
                    </div>
                  )}

                  {conflicts.length > 0 && (
                    <div className="mt-4 p-3 bg-svj-paper rounded-svj-card border-2 border-svj-navy-800">
                      <p className="text-sm text-svj-navy-900">
                        Potential conflict: {getCoachName(entry.assignedCoachId)} is also assigned to{' '}
                        {conflicts.map(c => `${c.athlete.firstName} ${c.athlete.lastInitial}.`).join(', ')} at this time
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {viewMode === 'by-coach' && (
          <div className="flex flex-col gap-svj-5">
            {Object.entries(groupedByCoach()).map(([coachName, coachEntries]) => (
              <Card key={coachName} className="p-4 md:p-6">
                <h3 className="text-xl font-bold mb-4 text-svj-navy-900">
                  {coachName} <span className="text-sm font-normal text-svj-gray-600">({coachEntries.length})</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {coachEntries.map(entry => (
                    <GroupRow
                      key={entry.id}
                      name={`${entry.athlete.firstName} ${entry.athlete.lastInitial}.`}
                      detail={[
                        entry.matNumber ? `Mat ${entry.matNumber}` : null,
                        entry.timeWindow,
                      ].filter(Boolean).join(' • ')}
                      href={`/athletes/${entry.athlete.id}`}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {viewMode === 'by-mat' && (
          <div className="flex flex-col gap-svj-5">
            {Object.entries(groupedByMat()).map(([matName, matEntries]) => (
              <Card key={matName} className="p-4 md:p-6">
                <h3 className="text-xl font-bold mb-4 text-svj-navy-900">
                  {matName} <span className="text-sm font-normal text-svj-gray-600">({matEntries.length})</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {matEntries.map(entry => (
                    <GroupRow
                      key={entry.id}
                      name={`${entry.athlete.firstName} ${entry.athlete.lastInitial}.`}
                      detail={[
                        entry.assignedCoachId ? getCoachName(entry.assignedCoachId) : 'No coach assigned',
                        entry.timeWindow,
                        entry.noCoachNeeded ? 'No coach needed' : null,
                      ].filter(Boolean).join(' • ')}
                      href={`/athletes/${entry.athlete.id}`}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showAutoAssignPreview && (
        <div className="assign-modal-overlay">
          <div className="assign-modal-scrim" aria-hidden />
          <Card
            className="assign-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-assign-preview-title"
          >
            <div className="p-4 md:p-6 border-b-2 border-svj-navy-900 shrink-0">
              <h3 id="auto-assign-preview-title" className="text-2xl font-bold text-svj-navy-900">Auto-Assign Preview</h3>
              <p className="text-sm text-svj-gray-600 mt-1">
                Review proposed assignments before applying
              </p>
            </div>

            <div className="overflow-y-auto min-h-0 flex-1 p-4 md:p-6">
              <div className="assign-counts mb-6">
                <CountTile label="Proposals" value={autoAssignProposals.length} />
                <CountTile label="Conflicts" value={autoAssignConflicts.length} />
                <CountTile label="Already Assigned" value={alreadyAssignedCount} />
                <CountTile label="No Coach Needed" value={noCoachCount} />
              </div>

              {autoAssignConflicts.length > 0 && (
                <div className="bg-svj-paper border-2 border-svj-navy-800 rounded-svj-card p-4 mb-6">
                  <h4 className="text-sm font-semibold text-svj-navy-900 mb-2">
                    {autoAssignConflicts.length} Conflict Warning{autoAssignConflicts.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="space-y-3">
                    {autoAssignConflicts.map((conflict, idx) => (
                      <div key={idx} className="text-sm text-svj-navy-800">
                        <p className="font-semibold">{conflict.athleteName}</p>
                        <p>{conflict.message}</p>
                        {conflict.conflictingEntries.length > 0 && (
                          <ul className="mt-1 ml-4 text-xs">
                            {conflict.conflictingEntries.map((ce, i) => (
                              <li key={i}>
                                {ce.athleteName}
                                {ce.matNumber && ` (Mat ${ce.matNumber})`}
                                {ce.timeWindow && ` - ${ce.timeWindow}`}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-svj-gray-600 mt-3">
                    You can still apply these assignments. Review conflicts and adjust manually if needed.
                  </p>
                </div>
              )}

              {autoAssignProposals.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h4 className="eyebrow text-svj-gray-600">
                    Proposed Assignments ({autoAssignProposals.length})
                  </h4>
                  {autoAssignProposals.map(proposal => {
                    const entry = entries.find(e => e.id === proposal.entryId);
                    if (!entry) return null;
                    
                    const coachName = getCoachName(proposal.proposedCoachId);
                    
                    return (
                      <div
                        key={proposal.entryId}
                        className="bg-svj-paper p-4 rounded-svj-card border-2 border-svj-gray-200"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-svj-navy-900">
                              {entry.athlete.firstName} {entry.athlete.lastInitial}.
                            </p>
                            {entry.athlete.weightClass && (
                              <p className="text-xs text-svj-gray-600">{entry.athlete.weightClass}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-svj-blue-600">{coachName}</p>
                            <p className="text-xs text-svj-gray-600">{proposal.reason}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-svj-gray-600">
                          {entry.matNumber && (
                            <div>
                              <span className="font-semibold">Mat:</span> {entry.matNumber}
                            </div>
                          )}
                          {entry.timeWindow && (
                            <div>
                              <span className="font-semibold">Time:</span> {entry.timeWindow}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-svj-gray-600">
                  <p className="text-lg">All athletes are already assigned.</p>
                  <p className="text-sm mt-2">No new assignments needed.</p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t-2 border-svj-navy-900 bg-svj-paper assign-preview-actions shrink-0">
              <Button
                onClick={() => {
                  setShowAutoAssignPreview(false);
                  setAutoAssignProposals([]);
                  setAutoAssignConflicts([]);
                }}
                disabled={applyingAutoAssign}
                variant="secondary"
                className="min-h-[48px]"
              >
                Cancel
              </Button>
              {autoAssignProposals.length > 0 && (
                <Button
                  onClick={handleApplyAutoAssign}
                  disabled={applyingAutoAssign}
                  className="flex-1 min-h-[48px]"
                >
                  {applyingAutoAssign ? 'Applying...' : `Apply ${autoAssignProposals.length} Assignment${autoAssignProposals.length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-svj-paper px-3 py-2 rounded-svj-card border-2 border-svj-navy-900">
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-2xl font-bold leading-none text-svj-navy-900 tabular-nums">{value}</p>
    </div>
  );
}

function GroupRow({
  name,
  detail,
  href,
}: {
  name: string;
  detail: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-svj-paper rounded-svj-card border-2 border-svj-gray-200">
      <div className="min-w-0">
        <p className="font-semibold text-svj-navy-900">{name}</p>
        {detail ? (
          <p className="text-sm text-svj-gray-600">{detail}</p>
        ) : null}
      </div>
      <Button as={Link} href={href} variant="ghost" size="sm" className="flex-shrink-0">
        View
      </Button>
    </div>
  );
}
