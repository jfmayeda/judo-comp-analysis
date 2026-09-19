'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AthleteWithNotes, TournamentDayEntry } from '@/lib/types';
import {
  getAllAthletesWithNotes,
  createAthlete,
  ensureMockDemoData,
  getAllTournamentDays,
  getTournamentDayEntries,
} from '@/lib/supabase-store';
import { useCoachGate } from '@/lib/use-coach-gate';
import { emptyAthleteForm } from '@/lib/athlete-form';
import { AppFrame } from '@/components/AppFrame';
import { AthleteCard } from '@/components/athlete/AthleteCard';
import { AthleteForm } from '@/components/athlete/AthleteForm';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconPlus, IconSearch } from '@/components/ui/Icons';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';

function matchesQuery(athlete: AthleteWithNotes, query: string): boolean {
  const haystack = [
    athlete.firstName,
    athlete.lastInitial,
    athlete.weightClass,
    athlete.ageDivision,
    athlete.tokuiWaza,
    athlete.currentBelt,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function Home() {
  const [athletes, setAthletes] = useState<AthleteWithNotes[]>([]);
  const [todayEntries, setTodayEntries] = useState<Map<string, TournamentDayEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);

  const loadAthletes = useCallback(async () => {
    try {
      setLoadError(null);
      await ensureMockDemoData();
      const [data, tournamentDays] = await Promise.all([getAllAthletesWithNotes(), getAllTournamentDays()]);
      setAthletes(data);
      const today = new Date().toISOString().split('T')[0];
      const todayDay = tournamentDays.find((day) => day.day === today);
      if (todayDay) {
        const entries = await getTournamentDayEntries(todayDay.id);
        setTodayEntries(new Map(entries.map((entry) => [entry.athleteId, entry])));
      } else {
        setTodayEntries(new Map());
      }
    } catch (error) {
      console.error('Error loading athletes:', error);
      setLoadError('Could not load the roster. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { ready, checking } = useCoachGate({ onReady: loadAthletes });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? athletes.filter((athlete) => matchesQuery(athlete, q)) : athletes;
  }, [athletes, query]);

  const openAddForm = () => {
    setSavedName(null);
    setShowAddForm(true);
    requestAnimationFrame(() => sheetRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  if (!ready || checking || loading) {
    return <LoadingScreen label="Loading roster" />;
  }

  return (
    <AppFrame eyebrow="Roster">
      <PageHeader
        kicker="Silicon Valley Judo"
        title="Roster"
        lead={`${athletes.length} athlete${athletes.length === 1 ? '' : 's'} · tap a card for the matside profile`}
        actions={
          !showAddForm ? (
            <Button onClick={openAddForm}>
              <IconPlus size={18} /> Add athlete
            </Button>
          ) : null
        }
      />

      <div className="stack-lg">
        {loadError ? (
          <Notice tone="danger" title="Roster unavailable">
            {loadError}{' '}
            <button type="button" className="btn-link" onClick={() => { setLoading(true); loadAthletes(); }}>
              Retry
            </button>
          </Notice>
        ) : null}

        {savedName ? (
          <Notice tone="success" title={`${savedName} added to the roster`}>
            Open the profile to add techniques, opponent notes and captures.
          </Notice>
        ) : null}

        {showAddForm ? (
          <div ref={sheetRef} className="sheet" role="region" aria-labelledby="add-athlete-title">
            <div className="sheet-header">
              <div>
                <h2 id="add-athlete-title" className="card-title">New athlete</h2>
                <p className="text-sm text-muted mt-1">Name and initial now; everything else can wait.</p>
              </div>
            </div>
            <AthleteForm
              mode="create"
              initial={emptyAthleteForm()}
              onCancel={() => setShowAddForm(false)}
              onSubmit={async (payload) => {
                await createAthlete(payload);
                setShowAddForm(false);
                setSavedName(`${payload.firstName} ${payload.lastInitial}.`);
                await loadAthletes();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        ) : null}

        {athletes.length > 0 ? (
          <div className="search-field">
            <IconSearch className="search-field-icon" />
            <label htmlFor="roster-search" className="visually-hidden">Search athletes</label>
            <input
              id="roster-search"
              type="search"
              className="form-input form-input--search"
              placeholder="Search by name, weight class, division…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}

        {athletes.length === 0 ? (
          <EmptyState
            title="No athletes yet"
            body="Add your first athlete with just a first name and last initial. Techniques and notes can come later."
            actions={<Button onClick={openAddForm}><IconPlus size={18} /> Add athlete</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            title={`No athletes match “${query.trim()}”`}
            body="Try a first name, weight class or division."
            actions={<Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button>}
          />
        ) : (
          <section aria-labelledby="roster-list-heading">
            <SectionHeading id="roster-list-heading" title="Athletes" count={filtered.length} />
            <div className="card-grid">
              {filtered.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete} todayEntry={todayEntries.get(athlete.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppFrame>
  );
}
