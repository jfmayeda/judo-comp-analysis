import { Athlete, OpponentNote, AthleteWithNotes, Stance } from './types';
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

  return (data || []).map(dbOpponentNoteToOpponentNote);
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

// Seed data for authenticated coaches
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
    createdAt: dbAthlete.created_at,
    updatedAt: dbAthlete.updated_at,
  };
}

function dbOpponentNoteToOpponentNote(dbNote: {
  id: string;
  athlete_id: string;
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
  created_at: string;
}): OpponentNote {
  return {
    id: dbNote.id,
    athleteId: dbNote.athlete_id,
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
    createdAt: dbNote.created_at,
  };
}
