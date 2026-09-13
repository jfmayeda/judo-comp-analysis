export type Stance = 'left' | 'right' | 'unknown' | null;

export type Technique = {
  id: string;
  name: string;
  category: 'Tachi-waza' | 'Ne-waza';
  subcategory: string;
  displayOrder: number;
  createdAt: string;
};

export type Athlete = {
  id: string;
  firstName: string;
  lastInitial: string;
  tokuiWaza: string;
  developmentAreas: string;
  notes: string;
  stance: Stance;
  kumiKata: string;
  neWaza: string;
  weightClass: string;
  ageDivision: string;
  tokuiTechniqueIds: string[];
  newazaTechniqueIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Opponent = {
  id: string;
  firstName: string;
  lastInitial: string;
  club: string;
  stance: Stance;
  kumiKata: string;
  neWaza: string;
  commonCounters: string;
  weightClass: string;
  ageDivision: string;
  tokuiTechniqueIds: string[];
  newazaTechniqueIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type OpponentNote = {
  id: string;
  athleteId: string;
  opponentId: string | null;
  opponentLabel: string;
  club: string | null;
  notes: string;
  tournament: string | null;
  stance: Stance;
  kumiKata: string;
  neWaza: string;
  commonCounters: string;
  weightClass: string;
  ageDivision: string;
  tokuiTechniqueIds: string[];
  newazaTechniqueIds: string[];
  createdAt: string;
};

export type AthleteWithNotes = Athlete & {
  opponentNotes: OpponentNote[];
};

export type TournamentDay = {
  id: string;
  name: string;
  day: string;
  createdAt: string;
  createdBy: string;
};

export type TournamentDayEntry = {
  id: string;
  tournamentDayId: string;
  athleteId: string;
  createdAt: string;
};

export type TournamentDayWithAthletes = TournamentDay & {
  athletes: AthleteWithNotes[];
};
