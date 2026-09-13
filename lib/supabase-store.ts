import { Athlete, OpponentNote, AthleteWithNotes } from './types';
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
    .order('created_at', { ascending: false });

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
  });

  const alex = await createAthlete({
    firstName: 'Alex',
    lastInitial: 'K',
    tokuiWaza: 'Osoto-gari, Harai-goshi',
    developmentAreas: 'Left-side attacks, tournament cardio',
    notes: 'Powerful right-sided player. Currently working on switching stances. -66kg division.',
  });

  const jordan = await createAthlete({
    firstName: 'Jordan',
    lastInitial: 'T',
    tokuiWaza: 'Ko-uchi-gari, Sasae-tsurikomi-ashi',
    developmentAreas: 'Follow-through on attacks, defensive positioning',
    notes: 'Technical player with good footwork. Needs to commit more fully to attacks. -57kg division.',
  });

  await createOpponentNote({
    athleteId: maya.id,
    opponentLabel: 'Sarah M',
    club: 'Peninsula Judo',
    notes: 'Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake.',
    tournament: 'Bay Area Open 2024',
  });

  await createOpponentNote({
    athleteId: maya.id,
    opponentLabel: 'Emma L',
    club: 'San Jose Judo',
    notes: 'Strong ne-waza specialist. Stay standing, avoid ground exchanges unless winning.',
    tournament: 'NorCal Championships',
  });

  await createOpponentNote({
    athleteId: alex.id,
    opponentLabel: 'Ryan P',
    club: 'Monterey Judo Club',
    notes: 'Taller opponent, good at keeping distance. Close the gap fast, work inside grip.',
    tournament: 'Bay Area Open 2024',
  });

  await createOpponentNote({
    athleteId: jordan.id,
    opponentLabel: 'Taylor S',
    club: 'East Bay Judo',
    notes: 'Defensive player, hard to score on. Be patient, set up combinations.',
    tournament: null,
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
  created_at: string;
}): OpponentNote {
  return {
    id: dbNote.id,
    athleteId: dbNote.athlete_id,
    opponentLabel: dbNote.opponent_label,
    club: dbNote.club,
    notes: dbNote.notes,
    tournament: dbNote.tournament,
    createdAt: dbNote.created_at,
  };
}
