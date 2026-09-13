export type Stance = 'left' | 'right' | 'unknown' | null;

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
  createdAt: string;
  updatedAt: string;
};

export type OpponentNote = {
  id: string;
  athleteId: string;
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
  createdAt: string;
};

export type AthleteWithNotes = Athlete & {
  opponentNotes: OpponentNote[];
};
