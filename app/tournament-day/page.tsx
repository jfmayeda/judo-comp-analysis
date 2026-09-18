'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { AthleteWithNotes, TournamentDay, TournamentDayEntry } from '@/lib/types';
import {
  getAllAthletesWithNotes,
  getAllTournamentDays,
  createTournamentDay,
  getTournamentDayEntries,
  setTournamentDayAthletes,
} from '@/lib/supabase-store';
import { useCoachGate } from '@/lib/use-coach-gate';
import { AppFrame } from '@/components/AppFrame';
import { athleteDisplayName } from '@/components/athlete/AthleteCard';
import { OfflineBanner } from '@/components/offline-banner';
import { SyncButton } from '@/components/sync-button';
import { BeltMark } from '@/components/ui/BeltMark';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { IconCheck, IconPrint } from '@/components/ui/Icons';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MetaRow } from '@/components/ui/MetaRow';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StickyActions } from '@/components/ui/StickyActions';

function sameSet(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

function formatDay(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function TournamentDayPage() {
  const [athletes, setAthletes] = useState<AthleteWithNotes[]>([]);
  const [tournamentDays, setTournamentDays] = useState<TournamentDay[]>([]);
  const [selectedTournamentDay, setSelectedTournamentDay] = useState<TournamentDay | null>(null);
  const [entries, setEntries] = useState<TournamentDayEntry[]>([]);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [savedAthleteIds, setSavedAthleteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const loadTournamentDaySelections = useCallback(async (tournamentDayId: string) => {
    try {
      const data = await getTournamentDayEntries(tournamentDayId);
      setEntries(data);
      const ids = new Set(data.map((e) => e.athleteId));
      setSelectedAthleteIds(ids);
      setSavedAthleteIds(new Set(ids));
    } catch (error) {
      console.error('Error loading selections:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [athletesData, tournamentDaysData] = await Promise.all([getAllAthletesWithNotes(), getAllTournamentDays()]);
      setAthletes(athletesData);
      setTournamentDays(tournamentDaysData);

      // Auto-select (or create) today's tournament day — unchanged behaviour.
      const today = new Date().toISOString().split('T')[0];
      const todayTournament = tournamentDaysData.find((t) => t.day === today);
      if (todayTournament) {
        setSelectedTournamentDay(todayTournament);
        await loadTournamentDaySelections(todayTournament.id);
      } else {
        const newTournament = await createTournamentDay({ name: `Tournament ${new Date().toLocaleDateString()}`, day: today });
        setTournamentDays([newTournament, ...tournamentDaysData]);
        setSelectedTournamentDay(newTournament);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadTournamentDaySelections]);

  const { ready, checking } = useCoachGate({ onReady: loadData });

  const handleTournamentDayChange = async (tournamentDayId: string) => {
    const tournament = tournamentDays.find((t) => t.id === tournamentDayId);
    if (tournament) {
      setSelectedTournamentDay(tournament);
      setSavedAt(null);
      await loadTournamentDaySelections(tournamentDayId);
    }
  };

  const toggleAthlete = (athleteId: string) => {
    setSelectedAthleteIds((current) => {
      const next = new Set(current);
      if (next.has(athleteId)) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedTournamentDay) return;
    setSaving(true);
    setSaveError(null);
    try {
      await setTournamentDayAthletes(selectedTournamentDay.id, Array.from(selectedAthleteIds));
      await loadTournamentDaySelections(selectedTournamentDay.id);
      setSavedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    } catch (error) {
      console.error('Error saving selections:', error);
      setSaveError('Could not save the selection. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPack = () => {
    if (!selectedTournamentDay || savedAthleteIds.size === 0) return;
    const ids = athletes.filter((a) => savedAthleteIds.has(a.id)).map((a) => a.id).join(',');
    window.open(`/tournament-day/print?athletes=${encodeURIComponent(ids)}`, '_blank');
  };

  const dirty = useMemo(() => !sameSet(selectedAthleteIds, savedAthleteIds), [selectedAthleteIds, savedAthleteIds]);
  const rosterAthletes = athletes.filter((a) => savedAthleteIds.has(a.id));
  const entryByAthlete = new Map(entries.map((e) => [e.athleteId, e]));

  if (!ready || checking || loading) {
    return <LoadingScreen label="Loading tournament day" />;
  }

  return (
    <AppFrame eyebrow="Today" banner={<OfflineBanner />}>
      <PageHeader
        kicker="Tournament day"
        title={selectedTournamentDay ? selectedTournamentDay.name : 'Today'}
        lead={selectedTournamentDay ? `${formatDay(selectedTournamentDay.day)} · ${rosterAthletes.length} competing` : undefined}
        actions={
          rosterAthletes.length > 0 ? (
            <>
              <Button as={Link} href="/tournament-day/assign">Assign coaches</Button>
              <Button variant="secondary" onClick={handlePrintPack}>
                <IconPrint size={18} /> Print pack ({rosterAthletes.length})
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

        {rosterAthletes.length > 0 ? (
          <Card as="section" aria-labelledby="today-roster-heading">
            <SectionHeading id="today-roster-heading" title="Competing today" count={rosterAthletes.length} />
            <ul>
              {rosterAthletes.map((athlete) => {
                const entry = entryByAthlete.get(athlete.id);
                return (
                  <li key={athlete.id} className="list-row flex-wrap">
                    <div className="list-row-main">
                      <p className="list-row-title">{athleteDisplayName(athlete)}</p>
                      <p className="list-row-meta">
                        {[
                          athlete.weightClass,
                          entry?.matNumber ? `Mat ${entry.matNumber}` : 'No mat yet',
                          entry?.timeWindow,
                          entry?.noCoachNeeded ? 'No coach needed' : entry?.assignedCoachId ? 'Coach assigned' : 'No coach yet',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="list-row-actions w-full sm:w-auto">
                      <Button as={Link} href={`/athletes/${athlete.id}#quick-capture`} size="sm" className="flex-1 sm:flex-none">Capture</Button>
                      <Button as={Link} href={`/athletes/${athlete.id}`} variant="secondary" size="sm" className="flex-1 sm:flex-none">Profile</Button>
                      <Button as={Link} href={`/athletes/${athlete.id}/print`} target="_blank" variant="secondary" size="sm" aria-label={`Print ${athleteDisplayName(athlete)}`}>
                        <IconPrint size={16} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {selectedTournamentDay ? (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="meta-key block mb-2">Offline readiness</span>
                <SyncButton tournamentDayId={selectedTournamentDay.id} athleteIds={Array.from(savedAthleteIds)} disabled={savedAthleteIds.size === 0} />
              </div>
            ) : null}
          </Card>
        ) : (
          <Notice tone="muted" title="Nobody is marked as competing yet">
            Pick athletes below and save. Then assign coaches, cache profiles for offline, or print the pack.
          </Notice>
        )}

        <section aria-labelledby="select-heading">
          <SectionHeading id="select-heading" title="Who is competing?" count={`${selectedAthleteIds.size} of ${athletes.length}`} />
          {athletes.length === 0 ? (
            <EmptyState
              title="No athletes in the roster"
              body="Add athletes first, then pick who is competing today."
              actions={<Button as={Link} href="/">Go to roster</Button>}
            />
          ) : (
            <div className="card-grid" role="group" aria-label="Athletes competing today">
              {athletes.map((athlete) => {
                const isSelected = selectedAthleteIds.has(athlete.id);
                return (
                  <Card
                    key={athlete.id}
                    as="button"
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => toggleAthlete(athlete.id)}
                    variant={isSelected ? 'selected' : 'default'}
                    className="text-left w-full"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="card-title-sm">{athleteDisplayName(athlete)}</h3>
                        <BeltMark belt={athlete.currentBelt} short className="mt-1" />
                      </div>
                      <span
                        className={`flex-none w-7 h-7 rounded-sm border-2 flex items-center justify-center ${isSelected ? 'bg-brand-blue border-brand-blue text-white' : 'border-gray-300 bg-white'}`}
                        aria-hidden
                      >
                        {isSelected ? <IconCheck size={18} /> : null}
                      </span>
                    </div>
                    <MetaRow
                      items={[
                        { label: 'Weight', value: athlete.weightClass },
                        { label: 'Stance', value: athlete.stance, capitalize: true },
                        { label: 'Notes', value: athlete.opponentNotes.length ? String(athlete.opponentNotes.length) : null },
                      ]}
                    />
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {saveError ? <Notice tone="danger" title="Not saved">{saveError}</Notice> : null}

        {athletes.length > 0 ? (
          <StickyActions
            status={
              dirty
                ? `${selectedAthleteIds.size} selected · unsaved changes`
                : savedAt
                  ? `Saved at ${savedAt}`
                  : `${savedAthleteIds.size} saved for this day`
            }
          >
            <Button onClick={handleSave} disabled={saving || !dirty || !selectedTournamentDay} data-testid="save-selection">
              {saving ? 'Saving…' : 'Save selection'}
            </Button>
          </StickyActions>
        ) : null}
      </div>
    </AppFrame>
  );
}
