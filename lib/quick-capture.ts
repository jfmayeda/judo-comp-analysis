import { checkCoachAllowlist } from './auth-utils';
import {
  collectTechniqueIds,
  deriveScoreFlavor,
  formatCaptureScoreSummary,
  parseCaptureScoreEvents,
  parseScoreFlavor,
  SCORE_FLAVOR_LABELS,
  withDefaultRecipients,
  withSequenceOrders,
} from './capture-score';
import {
  createOpponentNote,
  getOpponentById,
  updateOpponentNote,
} from './supabase-store';
import {
  CaptureOpponent,
  CaptureResult,
  OpponentNote,
  QuickCaptureInput,
  ScoreFlavor,
} from './types';

export { parseScoreFlavor, SCORE_FLAVOR_LABELS };

export const UNKNOWN_OPPONENT_LABEL = 'Unknown';

export const CAPTURE_RESULT_LABELS: Record<CaptureResult, string> = {
  win: 'Win',
  loss: 'Loss',
  other: 'Other',
};

export function formatOpponentLabel(firstName: string, lastInitial: string): string {
  const first = firstName.trim();
  const initial = lastInitial.trim().toUpperCase();
  return `${first} ${initial}.`;
}

export function parseCaptureResult(value: unknown): CaptureResult | null {
  if (value === 'win' || value === 'loss' || value === 'other') {
    return value;
  }
  return null;
}

function resolveOneOffLabel(opponent: Extract<CaptureOpponent, { kind: 'oneOff' }>): string {
  const firstName = opponent.firstName.trim();
  const lastInitial = opponent.lastInitial.trim();
  if (!firstName) {
    throw new Error('One-off opponent needs a first name');
  }
  if (lastInitial.length !== 1) {
    throw new Error('One-off opponent uses last initial only');
  }
  return formatOpponentLabel(firstName, lastInitial);
}

async function resolveOpponent(opponent: CaptureOpponent): Promise<{
  opponentId: string | null;
  opponentLabel: string;
  club: string | null;
}> {
  if (opponent.kind === 'unknown') {
    return {
      opponentId: null,
      opponentLabel: UNKNOWN_OPPONENT_LABEL,
      club: null,
    };
  }

  if (opponent.kind === 'oneOff') {
    return {
      opponentId: null,
      opponentLabel: resolveOneOffLabel(opponent),
      club: null,
    };
  }

  const shared = await getOpponentById(opponent.opponentId);
  if (!shared) {
    throw new Error('Shared opponent not found');
  }

  return {
    opponentId: shared.id,
    opponentLabel: formatOpponentLabel(shared.firstName, shared.lastInitial),
    club: shared.club || null,
  };
}

async function persistCapture(
  input: QuickCaptureInput,
  mode: { kind: 'create' } | { kind: 'update'; noteId: string }
): Promise<OpponentNote> {
  const isCoach = await checkCoachAllowlist();
  if (!isCoach) {
    throw new Error('Quick capture is coach-only');
  }

  const { opponentId, opponentLabel, club } = await resolveOpponent(
    input.opponent
  );

  const drafted =
    mode.kind === 'create'
      ? withDefaultRecipients(input.scoreEvents ?? [], input.result)
      : (input.scoreEvents ?? []);
  const scoreEvents = withSequenceOrders(drafted);
  const howText = input.howText?.trim() ?? '';
  const note = input.note.trim();
  const summary = formatCaptureScoreSummary({
    result: input.result,
    events: scoreEvents,
  });
  const notes = [howText, note].filter(Boolean).join('\n') || summary;
  const payload = {
    opponentId,
    opponentLabel,
    club,
    notes,
    techniqueIds: collectTechniqueIds(scoreEvents),
    result: input.result,
    scoreFlavor: deriveScoreFlavor(scoreEvents),
    scoreEvents: parseCaptureScoreEvents(scoreEvents),
  };

  if (mode.kind === 'update') {
    return updateOpponentNote(mode.noteId, payload);
  }

  return createOpponentNote({
    athleteId: input.athleteId,
    ...payload,
  });
}

export async function saveQuickCapture(
  input: QuickCaptureInput
): Promise<OpponentNote> {
  return persistCapture(input, { kind: 'create' });
}

export async function updateQuickCapture(
  noteId: string,
  input: QuickCaptureInput
): Promise<OpponentNote> {
  return persistCapture(input, { kind: 'update', noteId });
}

export type { ScoreFlavor };
