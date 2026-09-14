import {
  CaptureResult,
  CaptureScoreEvent,
  CaptureScoreEventType,
  DraftScoreEvent,
  ScoreFlavor,
  ScoreRecipient,
} from './types';

export type {
  CaptureScoreEvent,
  CaptureScoreEventType,
  DraftScoreEvent,
  ScoreRecipient,
};

export const SCORE_EVENT_LABELS: Record<CaptureScoreEventType, string> = {
  ippon: 'Ippon',
  wazari: 'Waza-ari',
  osaekomi: 'Osaekomi',
  shido: 'Shido',
  golden_score: 'Golden score',
};

const SCORE_EVENT_TYPES = new Set<CaptureScoreEventType>([
  'ippon',
  'wazari',
  'osaekomi',
  'shido',
  'golden_score',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isScoreEventType(value: unknown): value is CaptureScoreEventType {
  return typeof value === 'string' && SCORE_EVENT_TYPES.has(value as CaptureScoreEventType);
}

function isRecipient(value: unknown): value is ScoreRecipient {
  return value === 'athlete' || value === 'opponent';
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseOneEvent(value: unknown): DraftScoreEvent | null {
  if (!isRecord(value) || !isScoreEventType(value.eventType)) {
    return null;
  }

  if (value.eventType === 'shido') {
    if (!isRecipient(value.recipient)) return null;
    return { eventType: 'shido', recipient: value.recipient };
  }

  const techniqueId = optionalString(value.techniqueId);
  const techniqueLabel = optionalString(value.techniqueLabel);
  return {
    eventType: value.eventType,
    ...(techniqueId ? { techniqueId } : {}),
    ...(techniqueLabel ? { techniqueLabel } : {}),
  };
}

export function withSequenceOrders(events: DraftScoreEvent[]): CaptureScoreEvent[] {
  return events.map((event, index) => ({
    ...event,
    sequenceOrder: index + 1,
  }));
}

export function parseCaptureScoreEvents(value: unknown): CaptureScoreEvent[] {
  if (!Array.isArray(value)) return [];
  const drafts = value
    .map((item) => parseOneEvent(item))
    .filter((item): item is DraftScoreEvent => item !== null);
  return withSequenceOrders(drafts);
}

export function deriveScoreFlavor(
  events: CaptureScoreEvent[]
): ScoreFlavor | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (!event || event.eventType === 'shido') continue;
    if (event.eventType === 'wazari') return 'waza_ari';
    return event.eventType;
  }
  return null;
}

function formatOneEvent(event: CaptureScoreEvent): string {
  if (event.eventType === 'shido') {
    const who = event.recipient === 'athlete' ? 'us' : 'them';
    return `${event.sequenceOrder}. Shido (${who})`;
  }

  const label = SCORE_EVENT_LABELS[event.eventType];
  if (event.techniqueLabel) {
    return `${event.sequenceOrder}. ${label} via ${event.techniqueLabel}`;
  }
  return `${event.sequenceOrder}. ${label}`;
}

export function formatCaptureScoreSummary(input: {
  result: CaptureResult;
  events: CaptureScoreEvent[];
}): string {
  const resultLabel =
    input.result === 'win' ? 'Win' : input.result === 'loss' ? 'Loss' : 'Other';
  const parts = [resultLabel, ...input.events.map(formatOneEvent)];
  return parts.join(' · ');
}

export function collectTechniqueIds(events: CaptureScoreEvent[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const event of events) {
    if (event.eventType === 'shido' || !event.techniqueId) continue;
    if (seen.has(event.techniqueId)) continue;
    seen.add(event.techniqueId);
    ids.push(event.techniqueId);
  }
  return ids;
}

const FLAVOR_LABELS: Record<ScoreFlavor, string> = {
  ippon: 'Ippon',
  waza_ari: 'Waza-ari',
  osaekomi: 'Osaekomi',
  golden_score: 'Golden score',
  other: 'Other',
};

export function noteCaptureHeadline(note: {
  result: CaptureResult | null;
  scoreEvents: CaptureScoreEvent[];
  scoreFlavor: ScoreFlavor | null;
}): string | null {
  if (note.result && note.scoreEvents.length > 0) {
    return formatCaptureScoreSummary({
      result: note.result,
      events: note.scoreEvents,
    });
  }

  const parts = [
    note.result === 'win' ? 'Win' : note.result === 'loss' ? 'Loss' : note.result === 'other' ? 'Other' : null,
    note.scoreFlavor ? FLAVOR_LABELS[note.scoreFlavor] : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(' · ') : null;
}
