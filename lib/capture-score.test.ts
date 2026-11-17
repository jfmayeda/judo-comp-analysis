import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureOpponentFromNote,
  collectTechniqueIds,
  defaultScoreRecipient,
  deriveScoreFlavor,
  formatCaptureScoreSummary,
  noteCaptureHeadline,
  parseCaptureScoreEvents,
  parseScoreFlavor,
  seedCaptureNoteText,
  toggleScoreRecipient,
  toDraftScoreEvents,
  withDefaultRecipients,
  withSequenceOrders,
} from './capture-score';
import type { OpponentNote } from './types';

test('parseCaptureScoreEvents returns empty for junk', () => {
  assert.deepEqual(parseCaptureScoreEvents(null), []);
  assert.deepEqual(parseCaptureScoreEvents(undefined), []);
  assert.deepEqual(parseCaptureScoreEvents('ippon'), []);
  assert.deepEqual(parseCaptureScoreEvents({ eventType: 'ippon' }), []);
});

test('parseCaptureScoreEvents keeps a scoring sequence with techniques', () => {
  const events = parseCaptureScoreEvents([
    {
      sequenceOrder: 1,
      eventType: 'wazari',
      techniqueId: 'tech-1',
      techniqueLabel: 'Uchi-mata',
    },
    {
      sequenceOrder: 2,
      eventType: 'ippon',
      techniqueLabel: 'Osaekomi',
    },
  ]);

  assert.deepEqual(events, [
    {
      eventType: 'wazari',
      sequenceOrder: 1,
      techniqueId: 'tech-1',
      techniqueLabel: 'Uchi-mata',
    },
    {
      eventType: 'ippon',
      sequenceOrder: 2,
      techniqueLabel: 'Osaekomi',
    },
  ]);
});

test('parseCaptureScoreEvents keeps scoring events without recipient (legacy)', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'wazari' },
    { sequenceOrder: 2, eventType: 'ippon' },
  ]);
  assert.equal(events[0]?.recipient, undefined);
  assert.equal(events[1]?.recipient, undefined);
});

test('parseCaptureScoreEvents keeps us/them on every event type including yuko', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'yuko', recipient: 'us' },
    { sequenceOrder: 2, eventType: 'wazari', recipient: 'them' },
    { sequenceOrder: 3, eventType: 'shido', recipient: 'us' },
  ]);

  assert.deepEqual(events, [
    { eventType: 'yuko', sequenceOrder: 1, recipient: 'us' },
    { eventType: 'wazari', sequenceOrder: 2, recipient: 'them' },
    { eventType: 'shido', sequenceOrder: 3, recipient: 'us' },
  ]);
});

test('parseCaptureScoreEvents maps legacy athlete/opponent recipients to us/them', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'shido', recipient: 'athlete' },
    { sequenceOrder: 2, eventType: 'shido', recipient: 'opponent' },
    { sequenceOrder: 3, eventType: 'ippon', recipient: 'athlete' },
  ]);

  assert.deepEqual(events, [
    { eventType: 'shido', sequenceOrder: 1, recipient: 'us' },
    { eventType: 'shido', sequenceOrder: 2, recipient: 'them' },
    { eventType: 'ippon', sequenceOrder: 3, recipient: 'us' },
  ]);
});

test('parseCaptureScoreEvents keeps shido without recipient instead of guessing', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'shido' },
    { sequenceOrder: 2, eventType: 'golden_score' },
  ]);

  assert.deepEqual(events, [
    { eventType: 'shido', sequenceOrder: 1 },
    { eventType: 'golden_score', sequenceOrder: 2 },
  ]);
});

test('withSequenceOrders numbers events from 1', () => {
  const events = withSequenceOrders([
    { eventType: 'wazari', techniqueLabel: 'Ko-uchi-gari' },
    { eventType: 'shido', recipient: 'us' },
    { eventType: 'ippon' },
  ]);

  assert.equal(events[0]?.sequenceOrder, 1);
  assert.equal(events[1]?.sequenceOrder, 2);
  assert.equal(events[2]?.sequenceOrder, 3);
  assert.equal(events[1]?.eventType, 'shido');
  assert.equal(events[1]?.recipient, 'us');
});

test('defaultScoreRecipient uses us on win/other and them on loss', () => {
  assert.equal(defaultScoreRecipient('win'), 'us');
  assert.equal(defaultScoreRecipient('loss'), 'them');
  assert.equal(defaultScoreRecipient('other'), 'us');
  assert.equal(defaultScoreRecipient(null), 'us');
});

test('toggleScoreRecipient flips us/them and fills a default when missing', () => {
  assert.equal(toggleScoreRecipient('us', 'win'), 'them');
  assert.equal(toggleScoreRecipient('them', 'win'), 'us');
  assert.equal(toggleScoreRecipient(undefined, 'loss'), 'them');
  assert.equal(toggleScoreRecipient(undefined, 'win'), 'us');
});

test('withDefaultRecipients fills missing recipients on new writes only', () => {
  assert.deepEqual(
    withDefaultRecipients(
      [{ eventType: 'ippon' }, { eventType: 'yuko', recipient: 'them' }],
      'win'
    ),
    [
      { eventType: 'ippon', recipient: 'us' },
      { eventType: 'yuko', recipient: 'them' },
    ]
  );
  assert.deepEqual(
    withDefaultRecipients([{ eventType: 'wazari' }], 'loss'),
    [{ eventType: 'wazari', recipient: 'them' }]
  );
});

test('toDraftScoreEvents drops sequenceOrder', () => {
  assert.deepEqual(
    toDraftScoreEvents([
      { eventType: 'ippon', sequenceOrder: 1, recipient: 'us', techniqueLabel: 'Seoi-nage' },
    ]),
    [{ eventType: 'ippon', recipient: 'us', techniqueLabel: 'Seoi-nage' }]
  );
});

test('deriveScoreFlavor uses the last scoring event and skips shido', () => {
  assert.equal(deriveScoreFlavor([]), null);
  assert.equal(
    deriveScoreFlavor([
      { eventType: 'wazari', sequenceOrder: 1 },
      { eventType: 'shido', sequenceOrder: 2, recipient: 'them' },
    ]),
    'waza_ari'
  );
  assert.equal(
    deriveScoreFlavor([
      { eventType: 'wazari', sequenceOrder: 1 },
      { eventType: 'ippon', sequenceOrder: 2 },
    ]),
    'ippon'
  );
  assert.equal(
    deriveScoreFlavor([{ eventType: 'osaekomi', sequenceOrder: 1 }]),
    'osaekomi'
  );
  assert.equal(
    deriveScoreFlavor([{ eventType: 'golden_score', sequenceOrder: 1 }]),
    'golden_score'
  );
  assert.equal(
    deriveScoreFlavor([{ eventType: 'yuko', sequenceOrder: 1, recipient: 'us' }]),
    'yuko'
  );
});

test('formatCaptureScoreSummary lists result then events', () => {
  assert.equal(formatCaptureScoreSummary({ result: 'win', events: [] }), 'Win');
  assert.equal(
    formatCaptureScoreSummary({
      result: 'loss',
      events: [
        {
          eventType: 'wazari',
          sequenceOrder: 1,
          techniqueLabel: 'Uchi-mata',
        },
        { eventType: 'shido', sequenceOrder: 2, recipient: 'them' },
        { eventType: 'ippon', sequenceOrder: 3 },
      ],
    }),
    'Loss · 1. Waza-ari via Uchi-mata · 2. Shido (them) · 3. Ippon'
  );
});

test('formatCaptureScoreSummary attributes when recipient is present and skips when absent', () => {
  assert.equal(
    formatCaptureScoreSummary({
      result: 'win',
      events: [
        { eventType: 'yuko', sequenceOrder: 1, recipient: 'us' },
        { eventType: 'wazari', sequenceOrder: 2, recipient: 'them', techniqueLabel: 'Uchi-mata' },
        { eventType: 'osaekomi', sequenceOrder: 3 },
      ],
    }),
    'Win · 1. Yuko (us) · 2. Waza-ari (them) via Uchi-mata · 3. Osaekomi'
  );
});

test('collectTechniqueIds keeps unique ids in order', () => {
  assert.deepEqual(
    collectTechniqueIds([
      { eventType: 'wazari', sequenceOrder: 1, techniqueId: 'a' },
      { eventType: 'shido', sequenceOrder: 2, recipient: 'us' },
      { eventType: 'ippon', sequenceOrder: 3, techniqueId: 'a' },
      { eventType: 'osaekomi', sequenceOrder: 4, techniqueId: 'b' },
    ]),
    ['a', 'b']
  );
});

test('noteCaptureHeadline prefers the event sequence', () => {
  assert.equal(
    noteCaptureHeadline({
      result: 'win',
      scoreEvents: [
        {
          eventType: 'wazari',
          sequenceOrder: 1,
          techniqueLabel: 'Uchi-mata',
        },
        { eventType: 'ippon', sequenceOrder: 2 },
      ],
      scoreFlavor: 'ippon',
    }),
    'Win · 1. Waza-ari via Uchi-mata · 2. Ippon'
  );
});

test('parseScoreFlavor accepts yuko and rejects koka', () => {
  assert.equal(parseScoreFlavor('yuko'), 'yuko');
  assert.equal(parseScoreFlavor('ippon'), 'ippon');
  assert.equal(parseScoreFlavor('koka'), null);
  assert.equal(parseScoreFlavor('waza_ari'), 'waza_ari');
});

test('captureOpponentFromNote prefers a shared id, then initials, then unknown', () => {
  assert.deepEqual(
    captureOpponentFromNote({ opponentId: 'opp-1', opponentLabel: 'Sarah M.' }),
    { kind: 'shared', opponentId: 'opp-1' }
  );
  assert.deepEqual(
    captureOpponentFromNote({ opponentId: null, opponentLabel: 'Elena K.' }),
    { kind: 'oneOff', firstName: 'Elena', lastInitial: 'K' }
  );
  assert.deepEqual(
    captureOpponentFromNote({ opponentId: null, opponentLabel: 'Unknown' }),
    { kind: 'unknown' }
  );
});

test('seedCaptureNoteText clears auto-generated summaries so an edit can rewrite them', () => {
  const baseNote: OpponentNote = {
    id: 'n1',
    athleteId: 'a1',
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
    scoreFlavor: 'ippon',
    scoreEvents: [{ eventType: 'ippon', sequenceOrder: 1, recipient: 'us' }],
    createdAt: '2026-01-01T00:00:00Z',
  };
  assert.equal(
    seedCaptureNoteText({
      ...baseNote,
      notes: 'Win · 1. Ippon (us)',
    }),
    ''
  );
  assert.equal(
    seedCaptureNoteText({
      ...baseNote,
      notes: 'Caught her reaching.',
    }),
    'Caught her reaching.'
  );
});

test('noteCaptureHeadline falls back to result and flavor including yuko', () => {
  assert.equal(
    noteCaptureHeadline({
      result: 'loss',
      scoreEvents: [],
      scoreFlavor: 'waza_ari',
    }),
    'Loss · Waza-ari'
  );
  assert.equal(
    noteCaptureHeadline({
      result: 'win',
      scoreEvents: [],
      scoreFlavor: 'yuko',
    }),
    'Win · Yuko'
  );
  assert.equal(
    noteCaptureHeadline({
      result: null,
      scoreEvents: [],
      scoreFlavor: null,
    }),
    null
  );
});
