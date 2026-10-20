import {
  CaptureOpponent,
  CaptureResult,
  CaptureScoreEvent,
  CaptureScoreEventType,
  DraftScoreEvent,
  OpponentNote,
  ScoreFlavor,
  ScoreRecipient,
  ScoreTechnique,
  ScoreTechniqueCategory,
  Technique,
} from './types';

export type {
  CaptureScoreEvent,
  CaptureScoreEventType,
  DraftScoreEvent,
  ScoreRecipient,
  ScoreTechnique,
  ScoreTechniqueCategory,
};

export const SCORE_EVENT_LABELS: Record<CaptureScoreEventType, string> = {
  ippon: 'Ippon',
  wazari: 'Waza-ari',
  yuko: 'Yuko',
  osaekomi: 'Osaekomi',
  shido: 'Shido',
  golden_score: 'Golden score',
};

const SCORE_EVENT_TYPES = new Set<CaptureScoreEventType>([
  'ippon',
  'wazari',
  'yuko',
  'osaekomi',
  'shido',
  'golden_score',
]);

export const SCORE_FLAVOR_LABELS: Record<ScoreFlavor, string> = {
  ippon: 'Ippon',
  waza_ari: 'Waza-ari',
  yuko: 'Yuko',
  osaekomi: 'Osaekomi',
  golden_score: 'Golden score',
  other: 'Other',
};

export const SCORE_TECHNIQUE_CATEGORIES: ScoreTechniqueCategory[] = [
  'nage',
  'osaekomi',
  'shime',
  'kansetsu',
  'other',
];

export const SCORE_TECHNIQUE_CATEGORY_LABELS: Record<ScoreTechniqueCategory, string> = {
  nage: 'Throws',
  osaekomi: 'Pins',
  shime: 'Chokes',
  kansetsu: 'Armlocks',
  other: 'Other',
};

const SCORE_TECHNIQUE_CATEGORIES_SET = new Set<ScoreTechniqueCategory>(SCORE_TECHNIQUE_CATEGORIES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isScoreEventType(value: unknown): value is CaptureScoreEventType {
  return typeof value === 'string' && SCORE_EVENT_TYPES.has(value as CaptureScoreEventType);
}

export function parseScoreRecipient(value: unknown): ScoreRecipient | undefined {
  if (value === 'us' || value === 'athlete') return 'us';
  if (value === 'them' || value === 'opponent') return 'them';
  return undefined;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseScoreTechniqueCategory(value: unknown): ScoreTechniqueCategory | undefined {
  if (typeof value === 'string' && SCORE_TECHNIQUE_CATEGORIES_SET.has(value as ScoreTechniqueCategory)) {
    return value as ScoreTechniqueCategory;
  }
  return undefined;
}

/** Nested `technique` object, or legacy flat techniqueId/techniqueLabel. */
export function parseScoreTechnique(value: unknown, legacy?: unknown): ScoreTechnique | undefined {
  if (isRecord(value)) {
    const name = optionalString(value.name);
    if (!name) return undefined;
    const id = optionalString(value.id);
    return {
      ...(id ? { id } : {}),
      name,
      category: parseScoreTechniqueCategory(value.category) ?? 'other',
    };
  }

  if (!isRecord(legacy)) return undefined;
  const name = optionalString(legacy.techniqueLabel);
  if (!name) return undefined;
  const id = optionalString(legacy.techniqueId);
  return {
    ...(id ? { id } : {}),
    name,
    category: 'other',
  };
}

function scoreTechniqueCategoryFromKodokan(
  technique: Pick<Technique, 'category' | 'subcategory' | 'isCustom'>
): ScoreTechniqueCategory {
  if (technique.isCustom || technique.subcategory === 'Custom') return 'other';
  if (technique.category === 'Tachi-waza') return 'nage';
  if (technique.subcategory === 'Osaekomi-waza') return 'osaekomi';
  if (technique.subcategory === 'Shime-waza') return 'shime';
  if (technique.subcategory === 'Kansetsu-waza') return 'kansetsu';
  return 'other';
}

export function scoreTechniqueFromKodokan(
  technique: Pick<Technique, 'id' | 'name' | 'category' | 'subcategory' | 'isCustom'>
): ScoreTechnique {
  return {
    id: technique.id,
    name: technique.name,
    category: scoreTechniqueCategoryFromKodokan(technique),
  };
}

/** Only osaekomi obviously maps to the pin list. Other scores stay unfiltered. */
export function defaultScoreTechniqueCategory(
  eventType: CaptureScoreEventType
): ScoreTechniqueCategory | null {
  return eventType === 'osaekomi' ? 'osaekomi' : null;
}

export function listTechniquesWithoutQuery(
  category: ScoreTechniqueCategory | null
): boolean {
  return category !== null && category !== 'nage';
}

export function techniqueMatchesScoreCategory(
  technique: Pick<Technique, 'category' | 'subcategory' | 'isCustom'>,
  category: ScoreTechniqueCategory | null
): boolean {
  if (category === null) return true;
  const mapped = scoreTechniqueCategoryFromKodokan(technique);
  if (mapped === category) return true;
  return mapped === 'other' && category !== 'other';
}

function parseOneEvent(value: unknown): DraftScoreEvent | null {
  if (!isRecord(value) || !isScoreEventType(value.eventType)) {
    return null;
  }

  const recipient = parseScoreRecipient(value.recipient);
  const technique =
    value.eventType === 'shido' ? undefined : parseScoreTechnique(value.technique, value);
  return {
    eventType: value.eventType,
    ...(recipient ? { recipient } : {}),
    ...(technique ? { technique } : {}),
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

function recipientSuffix(event: CaptureScoreEvent | DraftScoreEvent): string {
  if (event.recipient === 'us' || event.recipient === 'them') {
    return ` (${event.recipient})`;
  }
  return '';
}

export function formatOneEvent(
  event: CaptureScoreEvent | (DraftScoreEvent & { sequenceOrder?: number }),
  index?: number
): string {
  const order = event.sequenceOrder ?? (index !== undefined ? index + 1 : 1);
  const label = SCORE_EVENT_LABELS[event.eventType];
  const who = recipientSuffix(event);
  if (event.eventType !== 'shido' && event.technique?.name) {
    return `${order}. ${label}${who} via ${event.technique.name}`;
  }
  return `${order}. ${label}${who}`;
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
    if (event.eventType === 'shido' || !event.technique?.id) continue;
    if (seen.has(event.technique.id)) continue;
    seen.add(event.technique.id);
    ids.push(event.technique.id);
  }
  return ids;
}

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
    note.scoreFlavor ? SCORE_FLAVOR_LABELS[note.scoreFlavor] : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function defaultScoreRecipient(result: CaptureResult | null): ScoreRecipient {
  return result === 'loss' ? 'them' : 'us';
}

export function toggleScoreRecipient(
  current: ScoreRecipient | undefined,
  result: CaptureResult | null
): ScoreRecipient {
  if (current === 'us') return 'them';
  if (current === 'them') return 'us';
  return defaultScoreRecipient(result);
}

export function withDefaultRecipients(
  events: DraftScoreEvent[],
  result: CaptureResult
): DraftScoreEvent[] {
  const recipient = defaultScoreRecipient(result);
  return events.map((event) => (event.recipient ? event : { ...event, recipient }));
}

export function toDraftScoreEvents(events: CaptureScoreEvent[]): DraftScoreEvent[] {
  return events.map((event) => ({
    eventType: event.eventType,
    ...(event.recipient ? { recipient: event.recipient } : {}),
    ...(event.technique ? { technique: event.technique } : {}),
  }));
}

export function parseScoreFlavor(value: unknown): ScoreFlavor | null {
  if (
    value === 'ippon' ||
    value === 'waza_ari' ||
    value === 'yuko' ||
    value === 'osaekomi' ||
    value === 'golden_score' ||
    value === 'other'
  ) {
    return value;
  }
  return null;
}

export function captureOpponentFromNote(note: {
  opponentId: string | null;
  opponentLabel: string;
}): CaptureOpponent {
  if (note.opponentId) {
    return { kind: 'shared', opponentId: note.opponentId };
  }
  const label = note.opponentLabel.trim();
  if (!label || /^unknown$/i.test(label)) {
    return { kind: 'unknown' };
  }
  const match = label.match(/^(.+?)\s+([A-Za-z])\.?$/);
  if (match && match[1] && match[2]) {
    return { kind: 'oneOff', firstName: match[1].trim(), lastInitial: match[2].toUpperCase() };
  }
  return { kind: 'unknown' };
}

export function seedCaptureNoteText(note: Pick<OpponentNote, 'notes' | 'result' | 'scoreEvents' | 'scoreFlavor'>): string {
  const headline = noteCaptureHeadline(note);
  const text = note.notes.trim();
  if (!text || (headline && text === headline)) return '';
  return note.notes;
}
