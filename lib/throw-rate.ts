import type { CaptureScoreEvent, OpponentNote, ScoreRecipient, ScoreTechnique } from './types';

/** Hide the percentage until the sample is large enough to be more than noise. */
export const THROW_RATE_MIN_N = 3;

/**
 * scores / (attempts + scores). percent is null when n === 0 or n < THROW_RATE_MIN_N.
 * n is always attempts + scores (the denominator), even when percent is hidden.
 */
export type ThrowRate = {
  scores: number;
  attempts: number;
  n: number;
  percent: number | null;
};

export type TechniqueThrowRate = ThrowRate & {
  key: string;
  name: string;
  techniqueId?: string;
};

export function isNageScore(event: CaptureScoreEvent): boolean {
  void event;
  throw new Error('not implemented');
}

export function isNageAttempt(event: CaptureScoreEvent): boolean {
  void event;
  throw new Error('not implemented');
}

export function eventsForRecipient(
  notes: Pick<OpponentNote, 'scoreEvents'>[],
  recipient: ScoreRecipient,
): CaptureScoreEvent[] {
  void notes;
  void recipient;
  throw new Error('not implemented');
}

export function successRate(events: CaptureScoreEvent[]): ThrowRate {
  void events;
  throw new Error('not implemented');
}

export function perTechniqueRates(events: CaptureScoreEvent[]): TechniqueThrowRate[] {
  void events;
  throw new Error('not implemented');
}

export function formatThrowRate(rate: ThrowRate): string {
  void rate;
  throw new Error('not implemented');
}

export function techniqueKey(technique: ScoreTechnique): string {
  void technique;
  throw new Error('not implemented');
}
