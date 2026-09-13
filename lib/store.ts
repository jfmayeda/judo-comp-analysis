import { Athlete, OpponentNote, AthleteWithNotes } from './types';

const STORAGE_KEY_ATHLETES = 'judo-athletes';
const STORAGE_KEY_NOTES = 'judo-opponent-notes';
const STORAGE_KEY_INITIALIZED = 'judo-initialized';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Check if running in browser
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Athletes CRUD
export function getAllAthletes(): Athlete[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEY_ATHLETES);
  return data ? JSON.parse(data) : [];
}

export function getAthleteById(id: string): Athlete | null {
  const athletes = getAllAthletes();
  return athletes.find(a => a.id === id) || null;
}

export function getAthleteWithNotes(id: string): AthleteWithNotes | null {
  const athlete = getAthleteById(id);
  if (!athlete) return null;
  
  const notes = getOpponentNotesByAthleteId(id);
  return {
    ...athlete,
    opponentNotes: notes,
  };
}

export function getAllAthletesWithNotes(): AthleteWithNotes[] {
  const athletes = getAllAthletes();
  return athletes.map(athlete => ({
    ...athlete,
    opponentNotes: getOpponentNotesByAthleteId(athlete.id),
  }));
}

export function createAthlete(data: {
  firstName: string;
  lastInitial: string;
  tokuiWaza?: string;
  developmentAreas?: string;
  notes?: string;
}): Athlete {
  if (!isBrowser()) throw new Error('Cannot create athlete in non-browser environment');
  
  // Validate lastInitial is exactly one character
  if (data.lastInitial.length !== 1) {
    throw new Error('lastInitial must be exactly one character');
  }
  
  const athlete: Athlete = {
    id: generateId(),
    firstName: data.firstName,
    lastInitial: data.lastInitial.toUpperCase(),
    tokuiWaza: data.tokuiWaza || '',
    developmentAreas: data.developmentAreas || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const athletes = getAllAthletes();
  athletes.push(athlete);
  localStorage.setItem(STORAGE_KEY_ATHLETES, JSON.stringify(athletes));
  
  return athlete;
}

export function updateAthlete(id: string, data: Partial<Omit<Athlete, 'id' | 'createdAt'>>): Athlete {
  if (!isBrowser()) throw new Error('Cannot update athlete in non-browser environment');
  
  // Validate lastInitial if provided
  if (data.lastInitial && data.lastInitial.length !== 1) {
    throw new Error('lastInitial must be exactly one character');
  }
  
  const athletes = getAllAthletes();
  const index = athletes.findIndex(a => a.id === id);
  
  if (index === -1) {
    throw new Error('Athlete not found');
  }
  
  const updated: Athlete = {
    ...athletes[index],
    ...data,
    lastInitial: data.lastInitial ? data.lastInitial.toUpperCase() : athletes[index].lastInitial,
    updatedAt: new Date().toISOString(),
  };
  
  athletes[index] = updated;
  localStorage.setItem(STORAGE_KEY_ATHLETES, JSON.stringify(athletes));
  
  return updated;
}

export function deleteAthlete(id: string): void {
  if (!isBrowser()) throw new Error('Cannot delete athlete in non-browser environment');
  
  // Delete athlete
  const athletes = getAllAthletes();
  const filtered = athletes.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY_ATHLETES, JSON.stringify(filtered));
  
  // Cascade delete opponent notes
  const notes = getAllOpponentNotes();
  const filteredNotes = notes.filter(n => n.athleteId !== id);
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(filteredNotes));
}

// Opponent Notes CRUD
export function getAllOpponentNotes(): OpponentNote[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEY_NOTES);
  return data ? JSON.parse(data) : [];
}

export function getOpponentNotesByAthleteId(athleteId: string): OpponentNote[] {
  const notes = getAllOpponentNotes();
  return notes
    .filter(n => n.athleteId === athleteId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getOpponentNoteById(id: string): OpponentNote | null {
  const notes = getAllOpponentNotes();
  return notes.find(n => n.id === id) || null;
}

export function createOpponentNote(data: {
  athleteId: string;
  opponentLabel: string;
  club?: string | null;
  notes: string;
  tournament?: string | null;
}): OpponentNote {
  if (!isBrowser()) throw new Error('Cannot create opponent note in non-browser environment');
  
  const note: OpponentNote = {
    id: generateId(),
    athleteId: data.athleteId,
    opponentLabel: data.opponentLabel,
    club: data.club || null,
    notes: data.notes,
    tournament: data.tournament || null,
    createdAt: new Date().toISOString(),
  };
  
  const notes = getAllOpponentNotes();
  notes.push(note);
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  
  return note;
}

export function updateOpponentNote(id: string, data: Partial<Omit<OpponentNote, 'id' | 'athleteId' | 'createdAt'>>): OpponentNote {
  if (!isBrowser()) throw new Error('Cannot update opponent note in non-browser environment');
  
  const notes = getAllOpponentNotes();
  const index = notes.findIndex(n => n.id === id);
  
  if (index === -1) {
    throw new Error('Opponent note not found');
  }
  
  const updated: OpponentNote = {
    ...notes[index],
    ...data,
  };
  
  notes[index] = updated;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  
  return updated;
}

export function deleteOpponentNote(id: string): void {
  if (!isBrowser()) throw new Error('Cannot delete opponent note in non-browser environment');
  
  const notes = getAllOpponentNotes();
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(filtered));
}

// Seed data for first-time users
export function seedDataIfEmpty(): void {
  if (!isBrowser()) return;
  
  // Check if already initialized
  const initialized = localStorage.getItem(STORAGE_KEY_INITIALIZED);
  if (initialized) return;
  
  const athletes = getAllAthletes();
  if (athletes.length > 0) {
    // Data already exists, mark as initialized
    localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
    return;
  }
  
  // Create sample athletes
  const maya = createAthlete({
    firstName: 'Maya',
    lastInitial: 'H',
    tokuiWaza: 'Seoi-nage, Uchi-mata',
    developmentAreas: 'Ne-waza transitions, grip fighting speed',
    notes: 'Strong thrower, needs work on ground game. Competes in -48kg division.',
  });
  
  const alex = createAthlete({
    firstName: 'Alex',
    lastInitial: 'K',
    tokuiWaza: 'Osoto-gari, Harai-goshi',
    developmentAreas: 'Left-side attacks, tournament cardio',
    notes: 'Powerful right-sided player. Currently working on switching stances. -66kg division.',
  });
  
  const jordan = createAthlete({
    firstName: 'Jordan',
    lastInitial: 'T',
    tokuiWaza: 'Ko-uchi-gari, Sasae-tsurikomi-ashi',
    developmentAreas: 'Follow-through on attacks, defensive positioning',
    notes: 'Technical player with good footwork. Needs to commit more fully to attacks. -57kg division.',
  });
  
  // Create sample opponent notes
  createOpponentNote({
    athleteId: maya.id,
    opponentLabel: 'Sarah M',
    club: 'Peninsula Judo',
    notes: 'Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake.',
    tournament: 'Bay Area Open 2024',
  });
  
  createOpponentNote({
    athleteId: maya.id,
    opponentLabel: 'Emma L',
    club: 'San Jose Judo',
    notes: 'Strong ne-waza specialist. Stay standing, avoid ground exchanges unless winning.',
    tournament: 'NorCal Championships',
  });
  
  createOpponentNote({
    athleteId: alex.id,
    opponentLabel: 'Ryan P',
    club: 'Monterey Judo Club',
    notes: 'Taller opponent, good at keeping distance. Close the gap fast, work inside grip.',
    tournament: 'Bay Area Open 2024',
  });
  
  createOpponentNote({
    athleteId: jordan.id,
    opponentLabel: 'Taylor S',
    club: 'East Bay Judo',
    notes: 'Defensive player, hard to score on. Be patient, set up combinations.',
    tournament: null,
  });
  
  localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
}

// Clear all data (for testing/reset)
export function clearAllData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY_ATHLETES);
  localStorage.removeItem(STORAGE_KEY_NOTES);
  localStorage.removeItem(STORAGE_KEY_INITIALIZED);
}
