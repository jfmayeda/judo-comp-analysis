export type Stance = 'left' | 'right' | 'unknown' | null;

export type JudoBelt = 
  | 'unset'
  | 'white'
  | 'yellow'
  | 'orange'
  | 'green'
  | 'blue'
  | 'brown'
  | 'shodan'
  | 'nidan'
  | 'sandan'
  | 'yondan'
  | 'godan'
  | 'rokudan'
  | 'shichidan'
  | 'hachidan'
  | 'kudan'
  | 'judan';

export type Technique = {
  id: string;
  name: string;
  category: 'Tachi-waza' | 'Ne-waza';
  subcategory: string;
  displayOrder: number;
  isCustom: boolean;
  createdBy?: string | null;
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
  currentBelt: JudoBelt;
  techniqueIds: string[];
  tokuiTechniqueIds: string[];
  newazaTechniqueIds: string[];
  preferredCoachId?: string | null;
  isCoachLocked: boolean;
  coachIsExclusive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Promotion = {
  id: string;
  athleteId: string;
  promotionDate: string;
  fromBelt: JudoBelt;
  toBelt: JudoBelt;
  notes: string;
  createdBy: string | null;
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
  notes: string;
  techniqueIds: string[];
  tokuiTechniqueIds: string[];
  newazaTechniqueIds: string[];
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
  techniqueIds: string[];
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
  assignedCoachId?: string | null;
  matNumber?: string | null;
  timeWindow?: string | null;
  noCoachNeeded: boolean;
  createdAt: string;
};

export type TournamentDayWithAthletes = TournamentDay & {
  athletes: AthleteWithNotes[];
};

export type Coach = {
  id: string;
  email: string;
  invitedAt: string;
  isAdmin: boolean;
};
