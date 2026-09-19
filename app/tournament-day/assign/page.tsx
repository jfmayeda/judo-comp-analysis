'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { AthleteWithNotes, TournamentDay, TournamentDayEntry, Coach } from '@/lib/types';
import {
  getAllAthletesWithNotes,
  getAllTournamentDays,
  getTournamentDayEntries,
  updateTournamentDayEntry,
  getAllCoaches,
} from '@/lib/supabase-store';
import { useCoachGate } from '@/lib/use-coach-gate';
import {
  autoAssignCoaches,
  AssignmentProposal,
  ConflictWarning,
  getCoachName as getCoachNameUtil,
} from '@/lib/coach-auto-assign';
import { AppFrame } from '@/components/AppFrame';
import { athleteDisplayName } from '@/components/athlete/AthleteCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip, Pill } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatTile } from '@/components/ui/StatTile';

type EntryWithAthlete = TournamentDayEntry & { athlete: AthleteWithNotes };
type ViewMode = 'all' | 'by-coach' | 'by-mat';

function formatDay(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AssignmentBoardPage() {
  const [athletes, setAthletes] = useState<AthleteWithNotes[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [tournamentDays, setTournamentDays] = useState<TournamentDay[]>([]);
  const [selectedTournamentDay, setSelectedTournamentDay] = useState<TournamentDay | null>(null);
  const [entries, setEntries] = useState<EntryWithAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showAutoAssignPreview, setShowAutoAssignPreview] = useState(false);
  const [autoAssignProposals, setAutoAssignProposals] = useState<AssignmentProposal[]>([]);
  const [autoAssignConflicts, setAutoAssignConflicts] = useState<ConflictWarning[]>([]);
  const [applyingAutoAssign, setApplyingAutoAssign] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [applied, setApplied] = useState<number | null>(null);

  const loadTournamentDayEntries = useCallback(async (tournamentDayId: string, athletesData: AthleteWithNotes[]) => {
    try {
      const entriesData = await getTournamentDayEntries(tournamentDayId);
      const withAthletes = entriesData
        .map((entry) => {
          const athlete = athletesData.find((a) => a.id === entry.athleteId);
          return athlete ? { ...entry, athlete } : null;
        })
        .filter((e): e is EntryWithAthlete => e !== null);
      setEntries(withAthletes);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
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
      const todayTournament = tournamentDaysData.find((t) => t.day === today) ?? tournamentDaysData[0];
      if (todayTournament) {
        setSelectedTournamentDay(todayTournament);
        await loadTournamentDayEntries(todayTournament.id, athletesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadTournamentDayEntries]);

  const { ready, checking } = useCoachGate({ onReady: loadData });

  const handleTournamentDayChange = async (tournamentDayId: string) => {
    const tournament = tournamentDays.find((t) => t.id === tournamentDayId);
    if (tournament) {
      setSelectedTournamentDay(tournament);
      await loadTournamentDayEntries(tournamentDayId, athletes);
    }
  };

  const handleUpdateEntry = async (
    entryId: string,
    updates: { assignedCoachId?: string | null; matNumber?: string | null; timeWindow?: string | null; noCoachNeeded?: boolean },
  ) => {
    setSaving(entryId);
    setActionError(null);
    try {
      const updated = await updateTournamentDayEntry(entryId, updates);
      setEntries((current) => current.map((e) => (e.id === entryId ? { ...e, ...updated } : e)));
    } catch (error) {
      console.error('Error updating entry:', error);
      setActionError('Could not save that change. Check your connection and try again.');
    } finally {
      setSaving(null);
    }
  };

  const getCoachName = (coachId: string | null | undefined) => getCoachNameUtil(coachId, coaches);

  const handleAutoAssign = () => {
    const { proposals, conflicts } = autoAssignCoaches(entries, coaches);
    setAutoAssignProposals(proposals);
    setAutoAssignConflicts(conflicts);
    setShowAutoAssignPreview(true);
  };

  const closePreview = () => {
    setShowAutoAssignPreview(false);
    setAutoAssignProposals([]);
    setAutoAssignConflicts([]);
  };

  const handleApplyAutoAssign = async () => {
    setApplyingAutoAssign(true);
    setActionError(null);
    try {
      for (const proposal of autoAssignProposals) {
        await updateTournamentDayEntry(proposal.entryId, { assignedCoachId: proposal.proposedCoachId });
      }
      if (selectedTournamentDay) await loadTournamentDayEntries(selectedTournamentDay.id, athletes);
      setApplied(autoAssignProposals.length);
      closePreview();
    } catch (error) {
      console.error('Error applying auto-assignments:', error);
      setActionError('Could not apply the auto-assignments. Please try again.');
    } finally {
      setApplyingAutoAssign(false);
    }
  };

  const handleClearAllAssignments = async () => {
    setSaving('clearing');
    try {
      const toClear = entries.filter((e) => e.assignedCoachId && !e.athlete.isCoachLocked);
      for (const entry of toClear) {
        await updateTournamentDayEntry(entry.id, { assignedCoachId: null });
      }
      if (selectedTournamentDay) await loadTournamentDayEntries(selectedTournamentDay.id, athletes);
      setApplied(null);
    } finally {
      setSaving(null);
    }
  };

  const getConflicts = (entryId: string, coachId: string | null | undefined, timeWindow: string | null | undefined) => {
    if (!coachId || !timeWindow) return [];
    return entries.filter((e) => e.id !== entryId && e.assignedCoachId === coachId && e.timeWindow && e.timeWindow === timeWindow);
  };

  const getExclusiveCoachWarning = (coachId: string | null | undefined, currentAthleteId: string) => {
    if (!coachId) return null;
    const other = athletes.find((a) => a.preferredCoachId === coachId && a.coachIsExclusive && a.id !== currentAthleteId);
    return other ? `This coach is exclusive to ${athleteDisplayName(other)}` : null;
  };

  const groupedByCoach = () => {
    const groups: Record<string, EntryWithAthlete[]> = {
      Unassigned: entries.filter((e) => !e.assignedCoachId && !e.noCoachNeeded),
      'No coach needed': entries.filter((e) => e.noCoachNeeded),
    };
    coaches.forEach((coach) => {
      const coachEntries = entries.filter((e) => e.assignedCoachId === coach.id);
      if (coachEntries.length > 0) groups[coach.email.split('@')[0]] = coachEntries;
    });
    return groups;
  };

  const groupedByMat = () => {
    const groups: Record<string, EntryWithAthlete[]> = { 'No mat assigned': entries.filter((e) => !e.matNumber) };
    const mats = new Set(entries.filter((e) => e.matNumber).map((e) => e.matNumber!));
    Array.from(mats).sort().forEach((mat) => {
      groups[`Mat ${mat}`] = entries.filter((e) => e.matNumber === mat);
    });
    return groups;
  };

  if (!ready || checking || loading) {
    return <LoadingScreen label="Loading assignment board" />;
  }

  const assignedCount = entries.filter((e) => e.assignedCoachId || e.noCoachNeeded).length;
  const unassignedCount = entries.filter((e) => !e.assignedCoachId && !e.noCoachNeeded).length;
  const noCoachCount = entries.filter((e) => e.noCoachNeeded).length;
  const alreadyAssignedCount = entries.filter((e) => e.assignedCoachId && !e.noCoachNeeded).length;

  return (
    <AppFrame backHref="/tournament-day" eyebrow="Assign coaches">
      <PageHeader
        kicker="Tournament day"
        title="Coach assignments"
        lead={selectedTournamentDay ? `${formatDay(selectedTournamentDay.day)} · ${selectedTournamentDay.name}` : undefined}
        actions={
          entries.length > 0 ? (
            <>
              <Button onClick={handleAutoAssign} disabled={saving !== null} data-testid="auto-assign">
                Auto-assign coaches
              </Button>
              <Button variant="secondary" onClick={() => setConfirmClear(true)} disabled={saving !== null || alreadyAssignedCount === 0}>
                Clear assignments
              </Button>
            </>
          ) : null
        }
      />

      <div className="stack-lg">
        {tournamentDays.length > 1 && selectedTournamentDay ? (
          <Field label="Tournament day" className="max-w-md">
            <select className="form-input" value={selectedTournamentDay.id} onChange={(e) => handleTournamentDayChange(e.target.value)}>
              {tournamentDays.map((td) => (
                <option key={td.id} value={td.id}>
                  {formatDay(td.day)}{td.name ? ` — ${td.name}` : ''}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {applied !== null ? (
          <Notice tone="success" title={`${applied} assignment${applied === 1 ? '' : 's'} applied`}>
            Locked and exclusive coaches were respected. Adjust anything below.
          </Notice>
        ) : null}
        {actionError ? <Notice tone="danger" title="Something went wrong">{actionError}</Notice> : null}

        {entries.length === 0 ? (
          <EmptyState
            title="Nobody is competing on this day yet"
            body="Mark athletes as competing on the Today page first, then come back to assign coaches, mats and times."
            actions={<Button as={Link} href="/tournament-day">Choose athletes</Button>}
          />
        ) : (
          <>
            <div className="stat-grid">
              <StatTile label="Competing" value={entries.length} />
              <StatTile label="Assigned" value={assignedCount} tone="accent" />
              <StatTile label="Unassigned" value={unassignedCount} tone={unassignedCount > 0 ? 'warning' : undefined} />
              <StatTile label="No coach needed" value={noCoachCount} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading title="Athletes" count={entries.length} className="mb-0" />
              <div role="group" aria-label="View" className="flex gap-2">
                {([
                  ['all', 'All'],
                  ['by-coach', 'By coach'],
                  ['by-mat', 'By mat'],
                ] as const).map(([mode, label]) => (
                  <Chip key={mode} pressed={viewMode === mode} onClick={() => setViewMode(mode)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            {viewMode === 'all' ? (
              <div className="stack">
                {entries.map((entry) => {
                  const conflicts = getConflicts(entry.id, entry.assignedCoachId, entry.timeWindow);
                  const exclusiveWarning = getExclusiveCoachWarning(entry.assignedCoachId, entry.athlete.id);
                  const preferredCoachName = entry.athlete.preferredCoachId ? getCoachName(entry.athlete.preferredCoachId) : null;
                  const busy = saving === entry.id;
                  return (
                    <Card key={entry.id} as="section" aria-label={athleteDisplayName(entry.athlete)}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h3 className="card-title-sm">{athleteDisplayName(entry.athlete)}</h3>
                          <p className="text-sm text-muted">
                            {[entry.athlete.weightClass, entry.athlete.ageDivision].filter(Boolean).join(' · ') || 'No weight class'}
                          </p>
                          {preferredCoachName ? (
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                              <span className="text-muted">Prefers {preferredCoachName}</span>
                              {entry.athlete.isCoachLocked ? <Pill tone="navy">Locked</Pill> : null}
                              {entry.athlete.coachIsExclusive ? <Pill tone="outline">Exclusive</Pill> : null}
                            </div>
                          ) : null}
                        </div>
                        <label className="checkbox-row md:flex-none" style={{ padding: 0 }}>
                          <input
                            type="checkbox"
                            checked={entry.noCoachNeeded}
                            onChange={(e) =>
                              handleUpdateEntry(entry.id, {
                                noCoachNeeded: e.target.checked,
                                assignedCoachId: e.target.checked ? null : entry.assignedCoachId,
                              })
                            }
                            disabled={busy}
                          />
                          <span className="text-sm text-strong">No coach needed (SVJ vs SVJ)</span>
                        </label>
                      </div>

                      {!entry.noCoachNeeded ? (
                        <div className="form-grid-3 mt-4">
                          <Field label="Coach" hint={exclusiveWarning ?? undefined}>
                            <select
                              className="form-input"
                              value={entry.assignedCoachId || ''}
                              onChange={(e) => handleUpdateEntry(entry.id, { assignedCoachId: e.target.value || null })}
                              disabled={busy}
                            >
                              <option value="">Unassigned</option>
                              {coaches.map((coach) => (
                                <option key={coach.id} value={coach.id}>
                                  {coach.email.split('@')[0]}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Mat">
                            <input
                              type="text"
                              inputMode="numeric"
                              className="form-input"
                              value={entry.matNumber || ''}
                              onChange={(e) => handleUpdateEntry(entry.id, { matNumber: e.target.value || null })}
                              disabled={busy}
                              placeholder="e.g. 1"
                            />
                          </Field>
                          <Field label="Time window">
                            <input
                              type="text"
                              className="form-input"
                              value={entry.timeWindow || ''}
                              onChange={(e) => handleUpdateEntry(entry.id, { timeWindow: e.target.value || null })}
                              disabled={busy}
                              placeholder="e.g. 9:00-10:00 AM"
                            />
                          </Field>
                        </div>
                      ) : null}

                      {conflicts.length > 0 ? (
                        <Notice tone="warning" title="Possible conflict" className="mt-4">
                          {getCoachName(entry.assignedCoachId)} is also assigned to{' '}
                          {conflicts.map((c) => athleteDisplayName(c.athlete)).join(', ')} at this time.
                        </Notice>
                      ) : null}
                      {busy ? <p className="text-xs text-muted mt-2" role="status">Saving…</p> : null}
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {viewMode !== 'all' ? (
              <div className="stack">
                {Object.entries(viewMode === 'by-coach' ? groupedByCoach() : groupedByMat()).map(([groupName, groupEntries]) => (
                  <Card key={groupName} as="section" aria-label={groupName}>
                    <SectionHeading title={groupName} count={groupEntries.length} />
                    {groupEntries.length === 0 ? (
                      <p className="text-sm text-muted">None</p>
                    ) : (
                      <ul>
                        {groupEntries.map((entry) => (
                          <li key={entry.id} className="list-row">
                            <div className="list-row-main">
                              <p className="list-row-title">{athleteDisplayName(entry.athlete)}</p>
                              <p className="list-row-meta">
                                {(viewMode === 'by-coach'
                                  ? [entry.matNumber ? `Mat ${entry.matNumber}` : null, entry.timeWindow]
                                  : [entry.noCoachNeeded ? 'No coach needed' : entry.assignedCoachId ? getCoachName(entry.assignedCoachId) : 'No coach assigned', entry.timeWindow]
                                )
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </p>
                            </div>
                            <Button as={Link} href={`/athletes/${entry.athlete.id}`} variant="ghost" size="sm">Profile</Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      <Dialog
        open={showAutoAssignPreview}
        onClose={closePreview}
        locked={applyingAutoAssign}
        wide
        title="Auto-assign preview"
        subtitle="Review before applying. Locked and exclusive coaches are respected."
        footer={
          <>
            <Button variant="secondary" onClick={closePreview} disabled={applyingAutoAssign}>Cancel</Button>
            {autoAssignProposals.length > 0 ? (
              <Button onClick={handleApplyAutoAssign} disabled={applyingAutoAssign} data-testid="apply-auto-assign">
                {applyingAutoAssign ? 'Applying…' : `Apply ${autoAssignProposals.length} assignment${autoAssignProposals.length === 1 ? '' : 's'}`}
              </Button>
            ) : null}
          </>
        }
      >
        <div className="stat-grid">
          <StatTile label="Proposals" value={autoAssignProposals.length} tone="accent" />
          <StatTile label="Conflicts" value={autoAssignConflicts.length} tone={autoAssignConflicts.length ? 'warning' : undefined} />
          <StatTile label="Already assigned" value={alreadyAssignedCount} />
          <StatTile label="No coach needed" value={noCoachCount} />
        </div>

        {autoAssignConflicts.length > 0 ? (
          <Notice tone="warning" title={`${autoAssignConflicts.length} conflict warning${autoAssignConflicts.length === 1 ? '' : 's'}`}>
            <ul className="stack mt-1" style={{ gap: 'var(--svj-space-2)' }}>
              {autoAssignConflicts.map((conflict, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{conflict.athleteName}</span> — {conflict.message}
                  {conflict.conflictingEntries.length > 0 ? (
                    <ul className="list-disc pl-5 text-xs mt-1">
                      {conflict.conflictingEntries.map((ce, i) => (
                        <li key={i}>
                          {ce.athleteName}
                          {ce.matNumber ? ` (Mat ${ce.matNumber})` : ''}
                          {ce.timeWindow ? ` · ${ce.timeWindow}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2">You can still apply and adjust manually afterwards.</p>
          </Notice>
        ) : null}

        {autoAssignProposals.length > 0 ? (
          <ul>
            {autoAssignProposals.map((proposal) => {
              const entry = entries.find((e) => e.id === proposal.entryId);
              if (!entry) return null;
              return (
                <li key={proposal.entryId} className="list-row">
                  <div className="list-row-main">
                    <p className="list-row-title">{athleteDisplayName(entry.athlete)}</p>
                    <p className="list-row-meta">
                      {[entry.athlete.weightClass, entry.matNumber ? `Mat ${entry.matNumber}` : null, entry.timeWindow].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-blue">{getCoachName(proposal.proposedCoachId)}</p>
                    <p className="text-xs text-muted">{proposal.reason}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">Everyone is already assigned. Nothing to apply.</p>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmClear}
        destructive
        title="Clear all coach assignments?"
        body="Locked assignments are kept. Mats and time windows are not changed."
        confirmLabel="Clear assignments"
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAllAssignments}
      />
    </AppFrame>
  );
}
