import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCaptureScoreEvents } from './capture-score';
import {
  collectRecentTechniqueIds,
  eventsForRecipient,
  formatThrowRate,
  isNageAttempt,
  isNageScore,
  perTechniqueRates,
  successRate,
  techniqueKey,
} from './throw-rate';
import type { CaptureScoreEvent, OpponentNote } from './types';

const seoi = { id: 'seoi', name: 'Seoi-nage', category: 'nage' as const };
const uchi = { id: 'uchi', name: 'Uchi-mata', category: 'nage' as const };
const kesa = { id: 'kesa', name: 'Kesa-gatame', category: 'osaekomi' as const };

function ev(over: Partial<CaptureScoreEvent> & Pick<CaptureScoreEvent, 'eventType'>): CaptureScoreEvent {
  return { sequenceOrder: 1, ...over };
}

const baseNote: OpponentNote = {
  id: 'n',
  athleteId: 'a',
  opponentId: null,
  opponentLabel: 'Unknown',
  club: null,
  notes: '',
  tournament: null,
  stance: null,
  kumiKata: '',
  neWaza: '',
  commonCounters: '',
  weightClass: '',
  ageDivision: '',
  techniqueIds: [],
  tokuiTechniqueIds: [],
  newazaTechniqueIds: [],
  result: 'win',
  scoreFlavor: 'waza_ari',
  scoreEvents: [],
  createdAt: '2026-01-01T00:00:00Z',
};

test('successRate is 0/0 with null percent when there are no nage events', () => {
  assert.deepEqual(successRate([]), { scores: 0, attempts: 0, n: 0, percent: null });
  assert.deepEqual(
    successRate([
      ev({ eventType: 'shido', recipient: 'us' }),
      ev({ eventType: 'osaekomi', recipient: 'us', technique: kesa }),
      ev({ eventType: 'ippon', recipient: 'us' }),
    ]),
    { scores: 0, attempts: 0, n: 0, percent: null },
  );
});

test('successRate counts nage scores over attempts plus scores (proof: 1/4 = 25%)', () => {
  const events = [
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi, sequenceOrder: 1 }),
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi, sequenceOrder: 2 }),
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi, sequenceOrder: 3 }),
    ev({ eventType: 'wazari', recipient: 'us', technique: seoi, sequenceOrder: 4 }),
  ];
  assert.deepEqual(successRate(events), { scores: 1, attempts: 3, n: 4, percent: 25 });
  assert.equal(formatThrowRate(successRate(events)), '1/4 (25%) · n=4');
});

test('successRate hides percent below 3 samples and still reports n=', () => {
  const oneScore = [ev({ eventType: 'ippon', recipient: 'us', technique: seoi })];
  assert.deepEqual(successRate(oneScore), { scores: 1, attempts: 0, n: 1, percent: null });
  assert.equal(formatThrowRate(successRate(oneScore)), '1/1 · n=1');

  const two = [
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
    ev({ eventType: 'wazari', recipient: 'us', technique: seoi }),
  ];
  assert.deepEqual(successRate(two), { scores: 1, attempts: 1, n: 2, percent: null });
  assert.equal(formatThrowRate(successRate(two)), '1/2 · n=2');
});

test('successRate does not treat a score as an attempt', () => {
  const events = [
    ev({ eventType: 'ippon', recipient: 'us', technique: seoi }),
    ev({ eventType: 'wazari', recipient: 'us', technique: uchi }),
    ev({ eventType: 'yuko', recipient: 'us', technique: seoi }),
  ];
  assert.deepEqual(successRate(events), { scores: 3, attempts: 0, n: 3, percent: 100 });
});

test('successRate ignores pins, shido, golden-score without nage, and other-category throws', () => {
  const events = [
    ev({ eventType: 'attempt', recipient: 'us', technique: kesa }),
    ev({ eventType: 'osaekomi', recipient: 'us', technique: kesa }),
    ev({ eventType: 'shido', recipient: 'us' }),
    ev({ eventType: 'golden_score', recipient: 'us' }),
    ev({ eventType: 'ippon', recipient: 'us', technique: { name: 'Seoi-nage', category: 'other' } }),
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
    ev({ eventType: 'ippon', recipient: 'us', technique: seoi }),
  ];
  assert.deepEqual(successRate(events), { scores: 1, attempts: 1, n: 2, percent: null });
});

test('successRate includes golden_score when it carries a nage technique', () => {
  const events = [
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
    ev({ eventType: 'golden_score', recipient: 'us', technique: seoi }),
  ];
  assert.deepEqual(successRate(events), { scores: 1, attempts: 2, n: 3, percent: 100 / 3 });
});

test('legacy rows without technique or recipient do not inflate rates', () => {
  const parsed = parseCaptureScoreEvents([
    { eventType: 'ippon', sequenceOrder: 1, recipient: 'us' },
    { eventType: 'wazari', sequenceOrder: 2, techniqueId: 'seoi', techniqueLabel: 'Seoi-nage' },
    { eventType: 'ippon', sequenceOrder: 3 },
    { eventType: 'attempt', sequenceOrder: 4, recipient: 'us' },
  ]);
  assert.equal(parsed[0]?.technique, undefined);
  assert.equal(parsed[1]?.technique?.category, 'other');
  assert.equal(parsed[2]?.recipient, undefined);
  assert.equal(parsed[3]?.eventType, 'attempt');
  assert.deepEqual(successRate(parsed), { scores: 0, attempts: 0, n: 0, percent: null });
  assert.deepEqual(successRate(eventsForRecipient([{ scoreEvents: parsed }], 'us')), {
    scores: 0,
    attempts: 0,
    n: 0,
    percent: null,
  });
});

test('eventsForRecipient keeps only matching recipient and skips legacy missing ones', () => {
  const notes: Pick<OpponentNote, 'scoreEvents'>[] = [
    {
      scoreEvents: [
        ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
        ev({ eventType: 'wazari', recipient: 'them', technique: uchi }),
        ev({ eventType: 'ippon', technique: seoi }),
      ],
    },
  ];
  assert.equal(eventsForRecipient(notes, 'us').length, 1);
  assert.equal(eventsForRecipient(notes, 'them')[0]?.eventType, 'wazari');
});

test('perTechniqueRates groups by technique and hides percent below n=3', () => {
  const events = [
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
    ev({ eventType: 'attempt', recipient: 'us', technique: seoi }),
    ev({ eventType: 'wazari', recipient: 'us', technique: seoi }),
    ev({ eventType: 'attempt', recipient: 'us', technique: uchi }),
    ev({ eventType: 'ippon', recipient: 'us', technique: uchi }),
  ];
  const rows = perTechniqueRates(events);
  assert.equal(rows[0]?.name, 'Seoi-nage');
  assert.deepEqual(
    { scores: rows[0]?.scores, attempts: rows[0]?.attempts, n: rows[0]?.n, percent: rows[0]?.percent },
    { scores: 1, attempts: 3, n: 4, percent: 25 },
  );
  assert.equal(rows[1]?.name, 'Uchi-mata');
  assert.equal(rows[1]?.percent, null);
  assert.equal(rows[1]?.n, 2);
  assert.equal(formatThrowRate(rows[0]!), '1/4 (25%) · n=4');
  assert.equal(formatThrowRate(rows[1]!), '1/2 · n=2');
});

test('perTechniqueRates keys unnamed custom throws by lowercase name', () => {
  const custom = { name: 'Drop Seoi', category: 'nage' as const };
  assert.equal(techniqueKey(custom), 'drop seoi');
  const rows = perTechniqueRates([
    ev({ eventType: 'attempt', technique: custom }),
    ev({ eventType: 'ippon', technique: { name: 'Drop Seoi', category: 'nage' } }),
    ev({ eventType: 'attempt', technique: custom }),
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.n, 3);
  assert.equal(rows[0]?.percent, 100 / 3);
});

test('isNageScore / isNageAttempt are strict about category and event type', () => {
  assert.equal(isNageScore(ev({ eventType: 'wazari', technique: seoi })), true);
  assert.equal(isNageScore(ev({ eventType: 'attempt', technique: seoi })), false);
  assert.equal(isNageAttempt(ev({ eventType: 'attempt', technique: seoi })), true);
  assert.equal(isNageAttempt(ev({ eventType: 'wazari', technique: seoi })), false);
  assert.equal(isNageAttempt(ev({ eventType: 'attempt', technique: kesa })), false);
});

test('collectRecentTechniqueIds walks newest notes first and de-dupes', () => {
  const ids = collectRecentTechniqueIds([
    { ...baseNote, createdAt: '2026-01-01T00:00:00Z', scoreEvents: [ev({ eventType: 'ippon', technique: seoi, sequenceOrder: 1 })] },
    {
      ...baseNote,
      createdAt: '2026-01-03T00:00:00Z',
      scoreEvents: [
        ev({ eventType: 'attempt', technique: uchi, sequenceOrder: 1 }),
        ev({ eventType: 'wazari', technique: seoi, sequenceOrder: 2 }),
      ],
    },
  ]);
  assert.deepEqual(ids, ['seoi', 'uchi']);
});
