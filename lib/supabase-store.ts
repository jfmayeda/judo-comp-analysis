import { Athlete, OpponentNote, AthleteWithNotes, Stance, TournamentDay, TournamentDayEntry, TournamentDayWithAthletes, Opponent, Technique, JudoBelt, Promotion, Coach } from './types';
import { getSupabaseClient } from './supabase';
import type { Database } from './supabase';

// Athletes CRUD
export async function getAllAthletes(): Promise<Athlete[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching athletes:', error);
    throw new Error('Failed to fetch athletes');
  }

  return (data || []).map(dbAthleteToAthlete);
}

export async function getAthleteById(id: string): Promise<Athlete | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching athlete:', error);
    return null;
  }

  return data ? dbAthleteToAthlete(data) : null;
}

export async function getAthleteWithNotes(id: string): Promise<AthleteWithNotes | null> {
  const athlete = await getAthleteById(id);
  if (!athlete) return null;
  
  const notes = await getOpponentNotesByAthleteId(id);
  return {
    ...athlete,
    opponentNotes: notes,
  };
}

export async function getAllAthletesWithNotes(): Promise<AthleteWithNotes[]> {
  const athletes = await getAllAthletes();
  const athletesWithNotes = await Promise.all(
    athletes.map(async (athlete) => ({
      ...athlete,
      opponentNotes: await getOpponentNotesByAthleteId(athlete.id),
    }))
  );
  return athletesWithNotes;
}

export async function createAthlete(data: {
  firstName: string;
  lastInitial: string;
  tokuiWaza?: string;
  developmentAreas?: string;
  notes?: string;
  stance?: Stance;
  kumiKata?: string;
  neWaza?: string;
  weightClass?: string;
  ageDivision?: string;
  currentBelt?: JudoBelt;
  techniqueIds?: string[];
  tokuiTechniqueIds?: string[];
  newazaTechniqueIds?: string[];
}): Promise<Athlete> {
  const supabase = getSupabaseClient();
  
  if (data.lastInitial.length !== 1) {
    throw new Error('lastInitial must be exactly one character');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create athletes');
  }

  const { data: newAthlete, error } = await supabase
    .from('athletes')
    .insert([{
      first_name: data.firstName,
      last_initial: data.lastInitial.toUpperCase(),
      tokui_waza: data.tokuiWaza || '',
      development_areas: data.developmentAreas || '',
      notes: data.notes || '',
      stance: data.stance || null,
      kumi_kata: data.kumiKata || '',
      ne_waza: data.neWaza || '',
      weight_class: data.weightClass || '',
      age_division: data.ageDivision || '',
      current_belt: data.currentBelt || 'unset',
      technique_ids: data.techniqueIds || [],
      tokui_technique_ids: data.tokuiTechniqueIds || [],
      newaza_technique_ids: data.newazaTechniqueIds || [],
      created_by: user.id,
    }] as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating athlete:', error);
    throw new Error('Failed to create athlete');
  }

  return dbAthleteToAthlete(newAthlete);
}

export async function updateAthlete(
  id: string,
  data: Partial<Omit<Athlete, 'id' | 'createdAt'>>
): Promise<Athlete> {
  const supabase = getSupabaseClient();
  
  if (data.lastInitial && data.lastInitial.length !== 1) {
    throw new Error('lastInitial must be exactly one character');
  }

  const updateData: Record<string, unknown> = {};
  
  if (data.firstName !== undefined) updateData.first_name = data.firstName;
  if (data.lastInitial !== undefined) updateData.last_initial = data.lastInitial.toUpperCase();
  if (data.tokuiWaza !== undefined) updateData.tokui_waza = data.tokuiWaza;
  if (data.developmentAreas !== undefined) updateData.development_areas = data.developmentAreas;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.stance !== undefined) updateData.stance = data.stance;
  if (data.kumiKata !== undefined) updateData.kumi_kata = data.kumiKata;
  if (data.neWaza !== undefined) updateData.ne_waza = data.neWaza;
  if (data.weightClass !== undefined) updateData.weight_class = data.weightClass;
  if (data.ageDivision !== undefined) updateData.age_division = data.ageDivision;
  if (data.currentBelt !== undefined) updateData.current_belt = data.currentBelt;
  if (data.techniqueIds !== undefined) updateData.technique_ids = data.techniqueIds;
  if (data.tokuiTechniqueIds !== undefined) updateData.tokui_technique_ids = data.tokuiTechniqueIds;
  if (data.newazaTechniqueIds !== undefined) updateData.newaza_technique_ids = data.newazaTechniqueIds;
  if (data.preferredCoachId !== undefined) updateData.preferred_coach_id = data.preferredCoachId;
  if (data.isCoachLocked !== undefined) updateData.is_coach_locked = data.isCoachLocked;
  if (data.coachIsExclusive !== undefined) updateData.coach_is_exclusive = data.coachIsExclusive;
  
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('athletes')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating athlete:', error);
    throw new Error('Failed to update athlete');
  }

  return dbAthleteToAthlete(updated);
}

export async function getDeletePreview(athleteId: string): Promise<{
  athleteName: string;
  opponentNotesCount: number;
  promotionsCount: number;
  tournamentEntriesCount: number;
}> {
  const supabase = getSupabaseClient();
  
  const [athlete, notes, promotions, entries] = await Promise.all([
    getAthleteById(athleteId),
    getOpponentNotesByAthleteId(athleteId),
    getPromotionsByAthleteId(athleteId),
    supabase.from('tournament_day_entries').select('id').eq('athlete_id', athleteId),
  ]);

  return {
    athleteName: athlete ? `${athlete.firstName} ${athlete.lastInitial}` : 'Unknown',
    opponentNotesCount: notes.length,
    promotionsCount: promotions.length,
    tournamentEntriesCount: entries.data?.length || 0,
  };
}

export async function deleteAthlete(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting athlete:', error);
    throw new Error('Failed to delete athlete');
  }
}

// Opponent Notes CRUD
export async function getAllOpponentNotes(): Promise<OpponentNote[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('opponent_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opponent notes:', error);
    throw new Error('Failed to fetch opponent notes');
  }

  return (data || []).map(dbOpponentNoteToOpponentNote);
}

export async function getOpponentNotesByAthleteId(athleteId: string): Promise<OpponentNote[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('opponent_notes')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false});

  if (error) {
    console.error('Error fetching opponent notes:', error);
    return [];
  }

  const notes = (data || []).map(dbOpponentNoteToOpponentNote);
  
  // Fetch linked opponent data to populate labels
  const notesWithOpponents = await Promise.all(
    notes.map(async (note) => {
      if (note.opponentId) {
        const opponent = await getOpponentById(note.opponentId);
        if (opponent) {
          return {
            ...note,
            opponentLabel: `${opponent.firstName} ${opponent.lastInitial}.`,
            club: opponent.club || note.club,
            stance: opponent.stance || note.stance,
            kumiKata: opponent.kumiKata || note.kumiKata,
            neWaza: opponent.neWaza || note.neWaza,
            commonCounters: opponent.commonCounters || note.commonCounters,
            weightClass: opponent.weightClass || note.weightClass,
            ageDivision: opponent.ageDivision || note.ageDivision,
          };
        }
      }
      return note;
    })
  );
  
  return notesWithOpponents;
}

export async function getOpponentNoteById(id: string): Promise<OpponentNote | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('opponent_notes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching opponent note:', error);
    return null;
  }

  return data ? dbOpponentNoteToOpponentNote(data) : null;
}

export async function createOpponentNote(data: {
  athleteId: string;
  opponentId?: string | null;
  opponentLabel: string;
  club?: string | null;
  notes: string;
  tournament?: string | null;
  stance?: Stance;
  kumiKata?: string;
  neWaza?: string;
  commonCounters?: string;
  weightClass?: string;
  ageDivision?: string;
  techniqueIds?: string[];
  tokuiTechniqueIds?: string[];
  newazaTechniqueIds?: string[];
}): Promise<OpponentNote> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create opponent notes');
  }

  const { data: newNote, error } = await supabase
    .from('opponent_notes')
    .insert([{
      athlete_id: data.athleteId,
      opponent_id: data.opponentId || null,
      opponent_label: data.opponentLabel,
      club: data.club || null,
      notes: data.notes,
      tournament: data.tournament || null,
      stance: data.stance || null,
      kumi_kata: data.kumiKata || '',
      ne_waza: data.neWaza || '',
      common_counters: data.commonCounters || '',
      weight_class: data.weightClass || '',
      age_division: data.ageDivision || '',
      technique_ids: data.techniqueIds || [],
      tokui_technique_ids: data.tokuiTechniqueIds || [],
      newaza_technique_ids: data.newazaTechniqueIds || [],
      created_by: user.id,
    }] as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating opponent note:', error);
    throw new Error('Failed to create opponent note');
  }

  return dbOpponentNoteToOpponentNote(newNote);
}

export async function updateOpponentNote(
  id: string,
  data: Partial<Omit<OpponentNote, 'id' | 'athleteId' | 'createdAt'>>
): Promise<OpponentNote> {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};
  
  if (data.opponentLabel !== undefined) updateData.opponent_label = data.opponentLabel;
  if (data.club !== undefined) updateData.club = data.club;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.tournament !== undefined) updateData.tournament = data.tournament;
  if (data.stance !== undefined) updateData.stance = data.stance;
  if (data.kumiKata !== undefined) updateData.kumi_kata = data.kumiKata;
  if (data.neWaza !== undefined) updateData.ne_waza = data.neWaza;
  if (data.commonCounters !== undefined) updateData.common_counters = data.commonCounters;
  if (data.weightClass !== undefined) updateData.weight_class = data.weightClass;
  if (data.ageDivision !== undefined) updateData.age_division = data.ageDivision;
  if (data.techniqueIds !== undefined) updateData.technique_ids = data.techniqueIds;

  const { data: updated, error } = await supabase
    .from('opponent_notes')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opponent note:', error);
    throw new Error('Failed to update opponent note');
  }

  return dbOpponentNoteToOpponentNote(updated);
}

export async function deleteOpponentNote(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('opponent_notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting opponent note:', error);
    throw new Error('Failed to delete opponent note');
  }
}

// Marker to identify mock demo athletes in the database
const MOCK_DEMO_MARKER = '[SAMPLE DATA - DO NOT MODIFY]';

// Check if an athlete is a mock demo athlete
function isMockDemoAthlete(athlete: Athlete): boolean {
  return (
    athlete.notes.includes(MOCK_DEMO_MARKER) ||
    (athlete.firstName === 'Demo' && athlete.lastInitial === 'A') ||
    (athlete.firstName === 'Sample' && athlete.lastInitial === 'B')
  );
}

// Ensure mock demo data exists (idempotent)
export async function ensureMockDemoData(): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to ensure demo data');
  }

  const existingAthletes = await getAllAthletes();
  
  const hasDemoA = existingAthletes.some(a => a.firstName === 'Demo' && a.lastInitial === 'A');
  const hasSampleB = existingAthletes.some(a => a.firstName === 'Sample' && a.lastInitial === 'B');

  if (!hasDemoA) {
    await createAthlete({
      firstName: 'Demo',
      lastInitial: 'A',
      tokuiWaza: 'Seoi-nage, Uchi-mata',
      developmentAreas: 'Ne-waza transitions, grip fighting speed',
      notes: `Strong thrower, needs work on ground game. Competes in -48kg division. ${MOCK_DEMO_MARKER}`,
      stance: 'right',
      kumiKata: 'Traditional high lapel grip, quick hand changes',
      neWaza: 'Working on turtle attacks, solid pins',
      weightClass: '-48kg',
      ageDivision: 'Juvenile',
    });
  }

  if (!hasSampleB) {
    await createAthlete({
      firstName: 'Sample',
      lastInitial: 'B',
      tokuiWaza: 'Osoto-gari, Harai-goshi',
      developmentAreas: 'Left-side attacks, tournament cardio',
      notes: `Powerful right-sided player. Currently working on switching stances. -66kg division. ${MOCK_DEMO_MARKER}`,
      stance: 'right',
      kumiKata: 'Deep sleeve control, defensive posture',
      neWaza: 'Strong top game, needs escape work',
      weightClass: '-66kg',
      ageDivision: 'Cadet',
    });
  }

  const updatedAthletes = await getAllAthletes();
  const demoA = updatedAthletes.find(a => a.firstName === 'Demo' && a.lastInitial === 'A');
  const sampleB = updatedAthletes.find(a => a.firstName === 'Sample' && a.lastInitial === 'B');

  if (demoA) {
    const existingNotes = await getOpponentNotesByAthleteId(demoA.id);
    if (existingNotes.length === 0) {
      await createOpponentNote({
        athleteId: demoA.id,
        opponentLabel: 'Sarah M',
        club: 'Peninsula Judo',
        notes: `Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake. ${MOCK_DEMO_MARKER}`,
        tournament: 'Bay Area Open 2024',
        stance: 'left',
        kumiKata: 'High collar grip, pulls down',
        neWaza: 'Strong pins, avoid bottom position',
        commonCounters: 'Ko-soto-gake, tai-otoshi on failed attacks',
        weightClass: '-48kg',
        ageDivision: 'Juvenile',
      });
    }
  }

  if (sampleB) {
    const existingNotes = await getOpponentNotesByAthleteId(sampleB.id);
    if (existingNotes.length === 0) {
      await createOpponentNote({
        athleteId: sampleB.id,
        opponentLabel: 'Ryan P',
        club: 'Monterey Judo Club',
        notes: `Taller opponent, good at keeping distance. Close the gap fast, work inside grip. ${MOCK_DEMO_MARKER}`,
        tournament: 'Bay Area Open 2024',
        stance: 'right',
        kumiKata: 'Long-arm control, stiff arms',
        neWaza: 'Average ground game',
        commonCounters: 'Uchi-mata when you close distance',
        weightClass: '-66kg',
        ageDivision: 'Cadet',
      });
    }
  }
}

// Seed data for authenticated coaches (legacy - kept for compatibility)
export async function seedData(): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to seed data');
  }

  const existingAthletes = await getAllAthletes();
  if (existingAthletes.length > 0) {
    throw new Error('Data already exists. Clear existing data before seeding.');
  }

  const maya = await createAthlete({
    firstName: 'Maya',
    lastInitial: 'H',
    tokuiWaza: 'Seoi-nage, Uchi-mata',
    developmentAreas: 'Ne-waza transitions, grip fighting speed',
    notes: 'Strong thrower, needs work on ground game. Competes in -48kg division.',
    stance: 'right',
    kumiKata: 'Traditional high lapel grip, quick hand changes',
    neWaza: 'Working on turtle attacks, solid pins',
    weightClass: '-48kg',
    ageDivision: 'Juvenile',
  });

  const alex = await createAthlete({
    firstName: 'Alex',
    lastInitial: 'K',
    tokuiWaza: 'Osoto-gari, Harai-goshi',
    developmentAreas: 'Left-side attacks, tournament cardio',
    notes: 'Powerful right-sided player. Currently working on switching stances. -66kg division.',
    stance: 'right',
    kumiKata: 'Deep sleeve control, defensive posture',
    neWaza: 'Strong top game, needs escape work',
    weightClass: '-66kg',
    ageDivision: 'Cadet',
  });

  const jordan = await createAthlete({
    firstName: 'Jordan',
    lastInitial: 'T',
    tokuiWaza: 'Ko-uchi-gari, Sasae-tsurikomi-ashi',
    developmentAreas: 'Follow-through on attacks, defensive positioning',
    notes: 'Technical player with good footwork. Needs to commit more fully to attacks. -57kg division.',
    stance: 'left',
    kumiKata: 'Over-the-top grip, good at breaking grips',
    neWaza: 'Prefers standing, learning submissions',
    weightClass: '-57kg',
    ageDivision: 'Junior',
  });

  await createOpponentNote({
    athleteId: maya.id,
    opponentLabel: 'Sarah M',
    club: 'Peninsula Judo',
    notes: 'Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake.',
    tournament: 'Bay Area Open 2024',
    stance: 'left',
    kumiKata: 'High collar grip, pulls down',
    neWaza: 'Strong pins, avoid bottom position',
    commonCounters: 'Ko-soto-gake, tai-otoshi on failed attacks',
    weightClass: '-48kg',
    ageDivision: 'Juvenile',
  });

  await createOpponentNote({
    athleteId: maya.id,
    opponentLabel: 'Emma L',
    club: 'San Jose Judo',
    notes: 'Strong ne-waza specialist. Stay standing, avoid ground exchanges unless winning.',
    tournament: 'NorCal Championships',
    stance: 'right',
    kumiKata: 'Low posture, defensive grips',
    neWaza: 'Excellent transitions, multiple submission threats',
    commonCounters: 'Pulls guard, arm bars from bottom',
    weightClass: '-48kg',
    ageDivision: 'Juvenile',
  });

  await createOpponentNote({
    athleteId: alex.id,
    opponentLabel: 'Ryan P',
    club: 'Monterey Judo Club',
    notes: 'Taller opponent, good at keeping distance. Close the gap fast, work inside grip.',
    tournament: 'Bay Area Open 2024',
    stance: 'right',
    kumiKata: 'Long-arm control, stiff arms',
    neWaza: 'Average ground game',
    commonCounters: 'Uchi-mata when you close distance',
    weightClass: '-66kg',
    ageDivision: 'Cadet',
  });

  await createOpponentNote({
    athleteId: jordan.id,
    opponentLabel: 'Taylor S',
    club: 'East Bay Judo',
    notes: 'Defensive player, hard to score on. Be patient, set up combinations.',
    tournament: null,
    stance: 'unknown',
    kumiKata: 'Defensive, breaks grips constantly',
    neWaza: 'Turtles up immediately',
    commonCounters: 'Counter-attacks off your entries',
    weightClass: '-57kg',
    ageDivision: 'Junior',
  });
}

// Tournament Day CRUD
export async function getAllTournamentDays(): Promise<TournamentDay[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tournament_days')
    .select('*')
    .order('day', { ascending: false });

  if (error) {
    console.error('Error fetching tournament days:', error);
    throw new Error('Failed to fetch tournament days');
  }

  return (data || []).map(dbTournamentDayToTournamentDay);
}

export async function getTournamentDayById(id: string): Promise<TournamentDay | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tournament_days')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching tournament day:', error);
    return null;
  }

  return data ? dbTournamentDayToTournamentDay(data) : null;
}

export async function getTournamentDayWithAthletes(id: string): Promise<TournamentDayWithAthletes | null> {
  const tournamentDay = await getTournamentDayById(id);
  if (!tournamentDay) return null;

  const entries = await getTournamentDayEntries(id);
  const athleteIds = entries.map(e => e.athleteId);
  
  const athletes = await Promise.all(
    athleteIds.map(async (athleteId) => {
      const athlete = await getAthleteWithNotes(athleteId);
      return athlete;
    })
  );

  return {
    ...tournamentDay,
    athletes: athletes.filter(a => a !== null) as AthleteWithNotes[],
  };
}

export async function createTournamentDay(data: {
  name?: string;
  day?: string;
}): Promise<TournamentDay> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create tournament days');
  }

  const { data: newTournamentDay, error } = await supabase
    .from('tournament_days')
    .insert([{
      name: data.name || '',
      day: data.day || new Date().toISOString().split('T')[0],
      created_by: user.id,
    }] as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating tournament day:', error);
    throw new Error('Failed to create tournament day');
  }

  return dbTournamentDayToTournamentDay(newTournamentDay);
}

export async function updateTournamentDay(
  id: string,
  data: Partial<{ name: string; day: string }>
): Promise<TournamentDay> {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.day !== undefined) updateData.day = data.day;

  const { data: updated, error } = await supabase
    .from('tournament_days')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tournament day:', error);
    throw new Error('Failed to update tournament day');
  }

  return dbTournamentDayToTournamentDay(updated);
}

export async function deleteTournamentDay(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('tournament_days')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting tournament day:', error);
    throw new Error('Failed to delete tournament day');
  }
}

// Tournament Day Entries CRUD
export async function getTournamentDayEntries(tournamentDayId: string): Promise<TournamentDayEntry[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tournament_day_entries')
    .select('*')
    .eq('tournament_day_id', tournamentDayId);

  if (error) {
    console.error('Error fetching tournament day entries:', error);
    return [];
  }

  return (data || []).map(dbTournamentDayEntryToTournamentDayEntry);
}

export async function addAthleteToTournamentDay(
  tournamentDayId: string,
  athleteId: string
): Promise<TournamentDayEntry> {
  const supabase = getSupabaseClient();

  const { data: newEntry, error } = await supabase
    .from('tournament_day_entries')
    .insert([{
      tournament_day_id: tournamentDayId,
      athlete_id: athleteId,
    }] as never)
    .select()
    .single();

  if (error) {
    console.error('Error adding athlete to tournament day:', error);
    throw new Error('Failed to add athlete to tournament day');
  }

  return dbTournamentDayEntryToTournamentDayEntry(newEntry);
}

export async function removeAthleteFromTournamentDay(
  tournamentDayId: string,
  athleteId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('tournament_day_entries')
    .delete()
    .eq('tournament_day_id', tournamentDayId)
    .eq('athlete_id', athleteId);

  if (error) {
    console.error('Error removing athlete from tournament day:', error);
    throw new Error('Failed to remove athlete from tournament day');
  }
}

export async function setTournamentDayAthletes(
  tournamentDayId: string,
  athleteIds: string[]
): Promise<void> {
  const supabase = getSupabaseClient();

  // Delete all existing entries
  await supabase
    .from('tournament_day_entries')
    .delete()
    .eq('tournament_day_id', tournamentDayId);

  // Insert new entries
  if (athleteIds.length > 0) {
    const { error } = await supabase
      .from('tournament_day_entries')
      .insert(
        athleteIds.map(athleteId => ({
          tournament_day_id: tournamentDayId,
          athlete_id: athleteId,
        })) as never[]
      );

    if (error) {
      console.error('Error setting tournament day athletes:', error);
      throw new Error('Failed to set tournament day athletes');
    }
  }
}

export async function updateTournamentDayEntry(
  entryId: string,
  data: {
    assignedCoachId?: string | null;
    matNumber?: string | null;
    timeWindow?: string | null;
    noCoachNeeded?: boolean;
  }
): Promise<TournamentDayEntry> {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};
  if (data.assignedCoachId !== undefined) updateData.assigned_coach_id = data.assignedCoachId;
  if (data.matNumber !== undefined) updateData.mat_number = data.matNumber;
  if (data.timeWindow !== undefined) updateData.time_window = data.timeWindow;
  if (data.noCoachNeeded !== undefined) updateData.no_coach_needed = data.noCoachNeeded;

  const { data: updated, error } = await supabase
    .from('tournament_day_entries')
    .update(updateData as never)
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating tournament day entry:', error);
    throw new Error('Failed to update tournament day entry');
  }

  return dbTournamentDayEntryToTournamentDayEntry(updated);
}

// Opponents CRUD
export async function getAllOpponents(): Promise<Opponent[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('opponents')
    .select('*')
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching opponents:', error);
    throw new Error('Failed to fetch opponents');
  }

  return (data || []).map(dbOpponentToOpponent);
}

export async function getOpponentById(id: string): Promise<Opponent | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('opponents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching opponent:', error);
    return null;
  }

  return data ? dbOpponentToOpponent(data) : null;
}

export async function searchOpponents(query: string): Promise<Opponent[]> {
  const supabase = getSupabaseClient();
  
  const searchTerm = query.toLowerCase();
  
  const { data, error } = await supabase
    .from('opponents')
    .select('*')
    .or(`first_name.ilike.%${searchTerm}%,last_initial.ilike.%${searchTerm}%,club.ilike.%${searchTerm}%`)
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error searching opponents:', error);
    return [];
  }

  return (data || []).map(dbOpponentToOpponent);
}

export async function createOpponent(data: {
  firstName: string;
  lastInitial: string;
  club?: string;
  stance?: Stance;
  kumiKata?: string;
  neWaza?: string;
  commonCounters?: string;
  weightClass?: string;
  ageDivision?: string;
  notes?: string;
  techniqueIds?: string[];
}): Promise<Opponent> {
  const supabase = getSupabaseClient();
  
  if (data.lastInitial.length !== 1) {
    throw new Error('lastInitial must be exactly one character');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create opponents');
  }

  const { data: newOpponent, error } = await supabase
    .from('opponents')
    .insert([{
      first_name: data.firstName,
      last_initial: data.lastInitial.toUpperCase(),
      club: data.club || '',
      stance: data.stance || null,
      kumi_kata: data.kumiKata || '',
      ne_waza: data.neWaza || '',
      common_counters: data.commonCounters || '',
      weight_class: data.weightClass || '',
      age_division: data.ageDivision || '',
      notes: data.notes || '',
      technique_ids: data.techniqueIds || [],
      created_by: user.id,
    }] as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating opponent:', error);
    throw new Error('Failed to create opponent');
  }

  return dbOpponentToOpponent(newOpponent);
}

export async function updateOpponent(
  id: string,
  data: Partial<Omit<Opponent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>
): Promise<Opponent> {
  const supabase = getSupabaseClient();
  
  if (data.lastInitial && data.lastInitial.length !== 1) {
    throw new Error('lastInitial must be exactly one character');
  }

  const updateData: Record<string, unknown> = {};
  
  if (data.firstName !== undefined) updateData.first_name = data.firstName;
  if (data.lastInitial !== undefined) updateData.last_initial = data.lastInitial.toUpperCase();
  if (data.club !== undefined) updateData.club = data.club;
  if (data.stance !== undefined) updateData.stance = data.stance;
  if (data.kumiKata !== undefined) updateData.kumi_kata = data.kumiKata;
  if (data.neWaza !== undefined) updateData.ne_waza = data.neWaza;
  if (data.commonCounters !== undefined) updateData.common_counters = data.commonCounters;
  if (data.weightClass !== undefined) updateData.weight_class = data.weightClass;
  if (data.ageDivision !== undefined) updateData.age_division = data.ageDivision;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.techniqueIds !== undefined) updateData.technique_ids = data.techniqueIds;
  
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('opponents')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opponent:', error);
    throw new Error('Failed to update opponent');
  }

  return dbOpponentToOpponent(updated);
}

export async function deleteOpponent(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('opponents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting opponent:', error);
    throw new Error('Failed to delete opponent');
  }
}

// Techniques CRUD
export async function getAllTechniques(): Promise<Technique[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('techniques')
    .select('id, name, category, subcategory, display_order, is_custom, created_by, created_at')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching techniques:', error);
    throw new Error('Failed to fetch techniques');
  }

  return (data || []).map(dbTechniqueToTechnique);
}

export async function getTechniquesByIds(ids: string[]): Promise<Technique[]> {
  if (ids.length === 0) return [];
  
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('techniques')
    .select('*')
    .in('id', ids)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching techniques by ids:', error);
    return [];
  }

  return (data || []).map(dbTechniqueToTechnique);
}

export async function getTechniquesByCategory(category: 'Tachi-waza' | 'Ne-waza'): Promise<Technique[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('techniques')
    .select('*')
    .eq('category', category)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching techniques by category:', error);
    return [];
  }

  return (data || []).map(dbTechniqueToTechnique);
}

export async function getTechniquesBySubcategory(subcategory: string): Promise<Technique[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('techniques')
    .select('*')
    .eq('subcategory', subcategory)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching techniques by subcategory:', error);
    return [];
  }

  return (data || []).map(dbTechniqueToTechnique);
}

export async function searchTechniques(query: string): Promise<Technique[]> {
  const supabase = getSupabaseClient();
  
  const searchTerm = query.toLowerCase();
  
  const { data, error } = await supabase
    .from('techniques')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error searching techniques:', error);
    return [];
  }

  return (data || []).map(dbTechniqueToTechnique);
}

export async function createTechnique(data: {
  name: string;
  category: 'Tachi-waza' | 'Ne-waza';
  subcategory?: string;
}): Promise<Technique> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create techniques');
  }

  const { data: maxOrder } = await supabase
    .from('techniques')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = ((maxOrder as { display_order: number } | null)?.display_order || 0) + 1;

  const { data: newTechnique, error } = await supabase
    .from('techniques')
    .insert([{
      name: data.name,
      category: data.category,
      subcategory: data.subcategory || 'Custom',
      display_order: nextOrder,
      is_custom: true,
      created_by: user.id,
    }] as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating technique:', error);
    throw new Error('Failed to create technique');
  }

  return dbTechniqueToTechnique(newTechnique);
}

export async function deleteTechnique(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('techniques')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting technique:', error);
    throw new Error('Failed to delete technique');
  }
}

// Helper functions to convert between DB schema and app types
function dbAthleteToAthlete(dbAthlete: {
  id: string;
  first_name: string;
  last_initial: string;
  tokui_waza: string;
  development_areas: string;
  notes: string;
  stance: 'left' | 'right' | 'unknown' | null;
  kumi_kata: string;
  ne_waza: string;
  weight_class: string;
  age_division: string;
  current_belt?: JudoBelt;
  technique_ids: string[];
  tokui_technique_ids?: string[];
  newaza_technique_ids?: string[];
  preferred_coach_id?: string | null;
  is_coach_locked: boolean;
  coach_is_exclusive: boolean;
  created_at: string;
  updated_at: string;
}): Athlete {
  return {
    id: dbAthlete.id,
    firstName: dbAthlete.first_name,
    lastInitial: dbAthlete.last_initial,
    tokuiWaza: dbAthlete.tokui_waza,
    developmentAreas: dbAthlete.development_areas,
    notes: dbAthlete.notes,
    stance: dbAthlete.stance,
    kumiKata: dbAthlete.kumi_kata,
    neWaza: dbAthlete.ne_waza,
    weightClass: dbAthlete.weight_class,
    ageDivision: dbAthlete.age_division,
    currentBelt: dbAthlete.current_belt || 'unset',
    techniqueIds: dbAthlete.technique_ids || [],
    tokuiTechniqueIds: dbAthlete.tokui_technique_ids || [],
    newazaTechniqueIds: dbAthlete.newaza_technique_ids || [],
    preferredCoachId: dbAthlete.preferred_coach_id,
    isCoachLocked: dbAthlete.is_coach_locked || false,
    coachIsExclusive: dbAthlete.coach_is_exclusive || false,
    createdAt: dbAthlete.created_at,
    updatedAt: dbAthlete.updated_at,
  };
}

function dbOpponentNoteToOpponentNote(dbNote: {
  id: string;
  athlete_id: string;
  opponent_id?: string | null;
  opponent_label: string;
  club: string | null;
  notes: string;
  tournament: string | null;
  stance: 'left' | 'right' | 'unknown' | null;
  kumi_kata: string;
  ne_waza: string;
  common_counters: string;
  weight_class: string;
  age_division: string;
  technique_ids: string[];
  tokui_technique_ids?: string[];
  newaza_technique_ids?: string[];
  created_at: string;
}): OpponentNote {
  return {
    id: dbNote.id,
    athleteId: dbNote.athlete_id,
    opponentId: dbNote.opponent_id || null,
    opponentLabel: dbNote.opponent_label,
    club: dbNote.club,
    notes: dbNote.notes,
    tournament: dbNote.tournament,
    stance: dbNote.stance,
    kumiKata: dbNote.kumi_kata,
    neWaza: dbNote.ne_waza,
    commonCounters: dbNote.common_counters,
    weightClass: dbNote.weight_class,
    ageDivision: dbNote.age_division,
    techniqueIds: dbNote.technique_ids || [],
    tokuiTechniqueIds: dbNote.tokui_technique_ids || [],
    newazaTechniqueIds: dbNote.newaza_technique_ids || [],
    createdAt: dbNote.created_at,
  };
}

function dbTournamentDayToTournamentDay(dbTournamentDay: {
  id: string;
  name: string;
  day: string;
  created_at: string;
  created_by: string;
}): TournamentDay {
  return {
    id: dbTournamentDay.id,
    name: dbTournamentDay.name,
    day: dbTournamentDay.day,
    createdAt: dbTournamentDay.created_at,
    createdBy: dbTournamentDay.created_by,
  };
}

function dbTournamentDayEntryToTournamentDayEntry(dbEntry: {
  id: string;
  tournament_day_id: string;
  athlete_id: string;
  assigned_coach_id?: string | null;
  mat_number?: string | null;
  time_window?: string | null;
  no_coach_needed: boolean;
  created_at: string;
}): TournamentDayEntry {
  return {
    id: dbEntry.id,
    tournamentDayId: dbEntry.tournament_day_id,
    athleteId: dbEntry.athlete_id,
    assignedCoachId: dbEntry.assigned_coach_id,
    matNumber: dbEntry.mat_number,
    timeWindow: dbEntry.time_window,
    noCoachNeeded: dbEntry.no_coach_needed || false,
    createdAt: dbEntry.created_at,
  };
}

function dbOpponentToOpponent(dbOpponent: {
  id: string;
  first_name: string;
  last_initial: string;
  club: string;
  stance: 'left' | 'right' | 'unknown' | null;
  kumi_kata: string;
  ne_waza: string;
  common_counters: string;
  weight_class: string;
  age_division: string;
  notes: string;
  technique_ids: string[];
  tokui_technique_ids?: string[];
  newaza_technique_ids?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}): Opponent {
  return {
    id: dbOpponent.id,
    firstName: dbOpponent.first_name,
    lastInitial: dbOpponent.last_initial,
    club: dbOpponent.club,
    stance: dbOpponent.stance,
    kumiKata: dbOpponent.kumi_kata,
    neWaza: dbOpponent.ne_waza,
    commonCounters: dbOpponent.common_counters,
    weightClass: dbOpponent.weight_class,
    ageDivision: dbOpponent.age_division,
    notes: dbOpponent.notes,
    techniqueIds: dbOpponent.technique_ids || [],
    tokuiTechniqueIds: dbOpponent.tokui_technique_ids || [],
    newazaTechniqueIds: dbOpponent.newaza_technique_ids || [],
    createdAt: dbOpponent.created_at,
    updatedAt: dbOpponent.updated_at,
    createdBy: dbOpponent.created_by,
  };
}

// Promotions CRUD
export async function getPromotionsByAthleteId(athleteId: string): Promise<Promotion[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('promotion_date', { ascending: false });

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }

  return (data || []).map(dbPromotionToPromotion);
}

export async function createPromotion(data: {
  athleteId: string;
  promotionDate: string;
  fromBelt: JudoBelt;
  toBelt: JudoBelt;
  notes?: string;
}): Promise<Promotion> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create promotions');
  }

  const { data: newPromotion, error } = await supabase
    .from('promotions')
    .insert([{
      athlete_id: data.athleteId,
      promotion_date: data.promotionDate,
      from_belt: data.fromBelt,
      to_belt: data.toBelt,
      notes: data.notes || '',
      created_by: user.id,
    }] as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating promotion:', error);
    throw new Error('Failed to create promotion');
  }

  return dbPromotionToPromotion(newPromotion);
}

export async function updatePromotion(
  id: string,
  data: Partial<{
    promotionDate: string;
    fromBelt: JudoBelt;
    toBelt: JudoBelt;
    notes: string;
  }>
): Promise<Promotion> {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};
  
  if (data.promotionDate !== undefined) updateData.promotion_date = data.promotionDate;
  if (data.fromBelt !== undefined) updateData.from_belt = data.fromBelt;
  if (data.toBelt !== undefined) updateData.to_belt = data.toBelt;
  if (data.notes !== undefined) updateData.notes = data.notes;
  
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('promotions')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating promotion:', error);
    throw new Error('Failed to update promotion');
  }

  return dbPromotionToPromotion(updated);
}

export async function deletePromotion(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promotion:', error);
    throw new Error('Failed to delete promotion');
  }
}

// Coach Allowlist CRUD
export async function inviteCoach(email: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to invite coaches');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { error: insertError } = await supabase
    .from('coach_allowlist')
    .insert([{
      email: normalizedEmail,
      invited_by: user.id,
      is_admin: false,
    }] as never);

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('This email is already in the allowlist');
    }
    console.error('Error inviting coach:', insertError);
    throw new Error('Failed to invite coach');
  }

  const { error: magicLinkError } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
    },
  });

  if (magicLinkError) {
    console.error('Error sending magic link:', magicLinkError);
  }
}

export async function getAllCoaches(): Promise<Array<{ id: string; email: string; invitedAt: string; isAdmin: boolean }>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('coach_allowlist')
    .select('*')
    .order('invited_at', { ascending: false }) as { data: Array<{ id: string; email: string; invited_at: string; is_admin: boolean }> | null; error: any };

  if (error) {
    console.error('Error fetching coaches:', error);
    throw new Error('Failed to fetch coaches');
  }

  return (data || []).map(coach => ({
    id: coach.id,
    email: coach.email,
    invitedAt: coach.invited_at,
    isAdmin: coach.is_admin,
  }));
}

export async function removeCoach(coachId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('coach_allowlist')
    .delete()
    .eq('id', coachId);

  if (error) {
    console.error('Error removing coach:', error);
    throw new Error('Failed to remove coach');
  }
}

function dbTechniqueToTechnique(dbTechnique: {
  id: string;
  name: string;
  category: 'Tachi-waza' | 'Ne-waza';
  subcategory: string;
  display_order: number;
  is_custom: boolean;
  created_by?: string | null;
  created_at: string;
}): Technique {
  return {
    id: dbTechnique.id,
    name: dbTechnique.name,
    category: dbTechnique.category,
    subcategory: dbTechnique.subcategory,
    displayOrder: dbTechnique.display_order,
    isCustom: dbTechnique.is_custom,
    createdBy: dbTechnique.created_by,
    createdAt: dbTechnique.created_at,
  };
}

function dbPromotionToPromotion(dbPromotion: {
  id: string;
  athlete_id: string;
  promotion_date: string;
  from_belt: JudoBelt;
  to_belt: JudoBelt;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}): Promotion {
  return {
    id: dbPromotion.id,
    athleteId: dbPromotion.athlete_id,
    promotionDate: dbPromotion.promotion_date,
    fromBelt: dbPromotion.from_belt,
    toBelt: dbPromotion.to_belt,
    notes: dbPromotion.notes,
    createdBy: dbPromotion.created_by,
    createdAt: dbPromotion.created_at,
    updatedAt: dbPromotion.updated_at,
  };
}
