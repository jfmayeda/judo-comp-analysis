import { noteCaptureHeadline } from './capture-score';
import type { Athlete, CaptureResult, OpponentNote } from './types';

export type CapturedResult = {
  id: string;
  result: CaptureResult;
  headline: string;
  opponentLabel: string;
  club: string | null;
  createdAt: string;
  note: string;
};

const SAMPLE_MARKER = '[SAMPLE DATA';

/** Same heuristic the activity/badge stores use, kept in one place for the UI. */
export function isSampleAthlete(athlete: Pick<Athlete, 'firstName' | 'lastInitial' | 'notes'>): boolean {
  return (
    athlete.notes.includes(SAMPLE_MARKER) ||
    (athlete.firstName === 'Demo' && athlete.lastInitial === 'A') ||
    (athlete.firstName === 'Sample' && athlete.lastInitial === 'B')
  );
}

/** Strip the sample marker from free text so it never renders as a sentence. */
export function stripSampleMarker(text: string): string {
  return text.replace(/\s*\[SAMPLE DATA[^\]]*\]\s*/g, ' ').trim();
}

/** Opponent notes that came from Quick Capture (they carry a result), newest first. */
export function capturedResults(notes: OpponentNote[]): CapturedResult[] {
  return notes
    .filter((note): note is OpponentNote & { result: CaptureResult } => note.result !== null)
    .map((note) => ({
      id: note.id,
      result: note.result,
      headline: noteCaptureHeadline(note) ?? (note.result === 'win' ? 'Win' : note.result === 'loss' ? 'Loss' : 'Other'),
      opponentLabel: note.opponentLabel,
      club: note.club,
      createdAt: note.createdAt,
      note: stripSampleMarker(note.notes),
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export type ResultTally = {
  total: number;
  wins: number;
  losses: number;
  other: number;
  /** Wins where the deciding score was ippon (from score_flavor). */
  ipponWins: number;
};

export function tallyResults(notes: OpponentNote[]): ResultTally {
  const tally: ResultTally = { total: 0, wins: 0, losses: 0, other: 0, ipponWins: 0 };
  for (const note of notes) {
    if (!note.result) continue;
    tally.total += 1;
    if (note.result === 'win') {
      tally.wins += 1;
      if (note.scoreFlavor === 'ippon') tally.ipponWins += 1;
    } else if (note.result === 'loss') {
      tally.losses += 1;
    } else {
      tally.other += 1;
    }
  }
  return tally;
}

export function formatResultLabel(result: CaptureResult): 'W' | 'L' | '–' {
  return result === 'win' ? 'W' : result === 'loss' ? 'L' : '–';
}
