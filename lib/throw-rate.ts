import type { CaptureScoreEvent, OpponentNote, ScoreRecipient, ScoreTechnique } from './types';

/** Hide the percentage until the sample is large enough to be more than noise. */
export const THROW_RATE_MIN_N = 3;

const NAGE_SCORE_TYPES = new Set<CaptureScoreEvent['eventType']>([
  'ippon',
  'wazari',
  'yuko',
  'golden_score',
]);

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

function isNageTechnique(event: CaptureScoreEvent): boolean {
  return event.technique?.category === 'nage';
}

export function isNageScore(event: CaptureScoreEvent): boolean {
  return NAGE_SCORE_TYPES.has(event.eventType) && isNageTechnique(event);
}

export function isNageAttempt(event: CaptureScoreEvent): boolean {
  return event.eventType === 'attempt' && isNageTechnique(event);
}

export function eventsForRecipient(
  notes: Pick<OpponentNote, 'scoreEvents'>[],
  recipient: ScoreRecipient,
): CaptureScoreEvent[] {
  const events: CaptureScoreEvent[] = [];
  for (const note of notes) {
    for (const event of note.scoreEvents) {
      if (event.recipient === recipient) events.push(event);
    }
  }
  return events;
}

function toRate(scores: number, attempts: number): ThrowRate {
  const n = scores + attempts;
  const percent = n >= THROW_RATE_MIN_N ? (scores / n) * 100 : null;
  return { scores, attempts, n, percent };
}

export function successRate(events: CaptureScoreEvent[]): ThrowRate {
  let scores = 0;
  let attempts = 0;
  for (const event of events) {
    if (isNageScore(event)) scores += 1;
    else if (isNageAttempt(event)) attempts += 1;
  }
  return toRate(scores, attempts);
}

export function techniqueKey(technique: ScoreTechnique): string {
  return technique.id ?? technique.name.trim().toLowerCase();
}

export function perTechniqueRates(events: CaptureScoreEvent[]): TechniqueThrowRate[] {
  const groups = new Map<string, TechniqueThrowRate>();
  for (const event of events) {
    const nage = isNageScore(event) || isNageAttempt(event);
    if (!nage || !event.technique) continue;
    const key = techniqueKey(event.technique);
    const existing = groups.get(key);
    const row: TechniqueThrowRate = existing ?? {
      key,
      name: event.technique.name,
      ...(event.technique.id ? { techniqueId: event.technique.id } : {}),
      scores: 0,
      attempts: 0,
      n: 0,
      percent: null,
    };
    if (isNageScore(event)) row.scores += 1;
    else row.attempts += 1;
    groups.set(key, row);
  }

  return [...groups.values()]
    .map((row) => ({ ...row, ...toRate(row.scores, row.attempts) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

export function formatThrowRate(rate: ThrowRate): string {
  const fraction = `${rate.scores}/${rate.n}`;
  if (rate.percent === null) {
    return rate.n === 0 ? `0/0 · n=0` : `${fraction} · n=${rate.n}`;
  }
  return `${fraction} (${Math.round(rate.percent)}%) · n=${rate.n}`;
}

export function collectRecentTechniqueIds(notes: Pick<OpponentNote, 'scoreEvents' | 'createdAt'>[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const newestFirst = [...notes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  for (const note of newestFirst) {
    for (const event of [...note.scoreEvents].sort((a, b) => b.sequenceOrder - a.sequenceOrder)) {
      const id = event.technique?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}
