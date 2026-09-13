export type Athlete = {
  id: string;
  firstName: string;
  lastInitial: string;
  tokuiWaza: string;
  developmentAreas: string;
  notes: string;
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
  createdAt: string;
};

export type AthleteWithNotes = Athlete & {
  opponentNotes: OpponentNote[];
};
