import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureOpponentFromNote,
  collectTechniqueIds,
  defaultScoreRecipient,
  defaultScoreTechniqueCategory,
  deriveScoreFlavor,
  formatCaptureScoreSummary,
  listTechniquesWithoutQuery,
  noteCaptureHeadline,
  parseCaptureScoreEvents,
  parseScoreFlavor,
  parseScoreTechnique,
  scoreTechniqueFromKodokan,
  seedCaptureNoteText,
  techniqueMatchesScoreCategory,
  toggleScoreRecipient,
  toDraftScoreEvents,
  withDefaultRecipients,
  withSequenceOrders,
} from './capture-score';
import type { OpponentNote, Technique } from './types';

test('parseCaptureScoreEvents returns empty for junk', () => {
  assert.deepEqual(parseCaptureScoreEvents(null), []);
  assert.deepEqual(parseCaptureScoreEvents(undefined), []);
  assert.deepEqual(parseCaptureScoreEvents('ippon'), []);
  assert.deepEqual(parseCaptureScoreEvents({ eventType: 'ippon' }), []);
});

test('parseCaptureScoreEvents keeps a scoring sequence with nested techniques', () => {
  const events = parseCaptureScoreEvents([
    {
      sequenceOrder: 1,
      eventType: 'wazari',
      technique: { id: 'tech-1', name: 'Uchi-mata', category: 'nage' },
    },
    {
      sequenceOrder: 2,
      eventType: 'ippon',
      technique: { name: 'Kesa-gatame', category: 'osaekomi' },
    },
  ]);

  assert.deepEqual(events, [
    {
      eventType: 'wazari',
      sequenceOrder: 1,
      technique: { id: 'tech-1', name: 'Uchi-mata', category: 'nage' },
    },
    {
      eventType: 'ippon',
      sequenceOrder: 2,
      technique: { name: 'Kesa-gatame', category: 'osaekomi' },
    },
  ]);
});

test('parseCaptureScoreEvents maps legacy techniqueId/techniqueLabel into technique', () => {
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
      techniqueLabel: 'Kesa-gatame',
    },
  ]);

  assert.deepEqual(events, [
    {
      eventType: 'wazari',
      sequenceOrder: 1,
      technique: { id: 'tech-1', name: 'Uchi-mata', category: 'other' },
    },
    {
      eventType: 'ippon',
      sequenceOrder: 2,
      technique: { name: 'Kesa-gatame', category: 'other' },
    },
  ]);
});

test('parseCaptureScoreEvents keeps scoring events without technique (legacy)', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'wazari', recipient: 'us' },
    { sequenceOrder: 2, eventType: 'osaekomi' },
  ]);
  assert.equal(events[0]?.technique, undefined);
  assert.equal(events[1]?.technique, undefined);
  assert.deepEqual(events[0], { eventType: 'wazari', sequenceOrder: 1, recipient: 'us' });
});

test('parseCaptureScoreEvents keeps scoring events without recipient (legacy)', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'wazari' },
    { sequenceOrder: 2, eventType: 'ippon' },
  ]);
  assert.equal(events[0]?.recipient, undefined);
  assert.equal(events[1]?.recipient, undefined);
});

test('parseCaptureScoreEvents keeps attempt events with recipient and technique', () => {
  const events = parseCaptureScoreEvents([
    {
      sequenceOrder: 1,
      eventType: 'attempt',
      recipient: 'us',
      technique: { id: 'tech-1', name: 'Seoi-nage', category: 'nage' },
    },
    { sequenceOrder: 2, eventType: 'attempt', recipient: 'them' },
    { sequenceOrder: 3, eventType: 'wazari', recipient: 'us' },
  ]);
  assert.deepEqual(events, [
    {
      eventType: 'attempt',
      sequenceOrder: 1,
      recipient: 'us',
      technique: { id: 'tech-1', name: 'Seoi-nage', category: 'nage' },
    },
    { eventType: 'attempt', sequenceOrder: 2, recipient: 'them' },
    { eventType: 'wazari', sequenceOrder: 3, recipient: 'us' },
  ]);
});

test('parseCaptureScoreEvents still drops unknown event types next to attempts', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'koka' },
    { sequenceOrder: 2, eventType: 'attempt', recipient: 'us' },
  ]);
  assert.deepEqual(events, [{ eventType: 'attempt', sequenceOrder: 1, recipient: 'us' }]);
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
    { eventType: 'wazari', technique: { name: 'Ko-uchi-gari', category: 'nage' } },
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

test('toDraftScoreEvents drops sequenceOrder and keeps nested technique', () => {
  assert.deepEqual(
    toDraftScoreEvents([
      {
        eventType: 'ippon',
        sequenceOrder: 1,
        recipient: 'us',
        technique: { id: 't1', name: 'Seoi-nage', category: 'nage' },
      },
    ]),
    [
      {
        eventType: 'ippon',
        recipient: 'us',
        technique: { id: 't1', name: 'Seoi-nage', category: 'nage' },
      },
    ]
  );
});

test('deriveScoreFlavor uses the last scoring event and skips shido', () => {
  assert.equal(deriveScoreFlavor([]), null);
  assert.equal(
    deriveScoreFlavor([
      { eventType: 'wazari', sequenceOrder: 1 },
      { eventType: 'attempt', sequenceOrder: 2, recipient: 'us', technique: { name: 'Seoi-nage', category: 'nage' } },
      { eventType: 'shido', sequenceOrder: 3, recipient: 'them' },
    ]),
    'waza_ari'
  );
  assert.equal(
    deriveScoreFlavor([
      { eventType: 'attempt', sequenceOrder: 1, recipient: 'us' },
    ]),
    null
  );
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
          eventType: 'attempt',
          sequenceOrder: 1,
          recipient: 'us',
          technique: { name: 'Seoi-nage', category: 'nage' },
        },
        {
          eventType: 'wazari',
          sequenceOrder: 2,
          technique: { name: 'Uchi-mata', category: 'nage' },
        },
        { eventType: 'shido', sequenceOrder: 3, recipient: 'them' },
        { eventType: 'ippon', sequenceOrder: 4 },
      ],
    }),
    'Loss · 1. Attempt (us) via Seoi-nage · 2. Waza-ari via Uchi-mata · 3. Shido (them) · 4. Ippon'
  );
});

test('formatCaptureScoreSummary attributes when recipient is present and skips when absent', () => {
  assert.equal(
    formatCaptureScoreSummary({
      result: 'win',
      events: [
        { eventType: 'yuko', sequenceOrder: 1, recipient: 'us' },
        {
          eventType: 'wazari',
          sequenceOrder: 2,
          recipient: 'them',
          technique: { name: 'Uchi-mata', category: 'nage' },
        },
        { eventType: 'osaekomi', sequenceOrder: 3 },
      ],
    }),
    'Win · 1. Yuko (us) · 2. Waza-ari (them) via Uchi-mata · 3. Osaekomi'
  );
});

test('collectTechniqueIds keeps unique ids in order', () => {
  assert.deepEqual(
    collectTechniqueIds([
      { eventType: 'wazari', sequenceOrder: 1, technique: { id: 'a', name: 'Uchi-mata', category: 'nage' } },
      { eventType: 'shido', sequenceOrder: 2, recipient: 'us' },
      { eventType: 'ippon', sequenceOrder: 3, technique: { id: 'a', name: 'Seoi-nage', category: 'nage' } },
      { eventType: 'osaekomi', sequenceOrder: 4, technique: { id: 'b', name: 'Kesa-gatame', category: 'osaekomi' } },
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
          technique: { name: 'Uchi-mata', category: 'nage' },
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

function kodokan(over: Partial<Technique> & Pick<Technique, 'name' | 'category' | 'subcategory'>): Technique {
  return {
    id: over.id ?? 'id',
    name: over.name,
    category: over.category,
    subcategory: over.subcategory,
    displayOrder: over.displayOrder ?? 1,
    isCustom: over.isCustom ?? false,
    createdAt: over.createdAt ?? '2026-01-01T00:00:00Z',
  };
}

test('parseScoreTechnique reads nested objects and ignores junk', () => {
  assert.deepEqual(
    parseScoreTechnique({ id: 't1', name: 'Seoi-nage', category: 'nage' }),
    { id: 't1', name: 'Seoi-nage', category: 'nage' }
  );
  assert.equal(parseScoreTechnique(null), undefined);
  assert.equal(parseScoreTechnique('seoi-nage'), undefined);
  assert.equal(parseScoreTechnique({ category: 'nage' }), undefined);
  assert.deepEqual(
    parseScoreTechnique({ name: '  Kesa-gatame  ', category: 'not-a-category' }),
    { name: 'Kesa-gatame', category: 'other' }
  );
});

test('scoreTechniqueFromKodokan maps standing, pins, chokes, armlocks and custom', () => {
  assert.deepEqual(
    scoreTechniqueFromKodokan(kodokan({ id: '1', name: 'Seoi-nage', category: 'Tachi-waza', subcategory: 'Te-waza' })),
    { id: '1', name: 'Seoi-nage', category: 'nage' }
  );
  assert.equal(
    scoreTechniqueFromKodokan(kodokan({ name: 'Kesa-gatame', category: 'Ne-waza', subcategory: 'Osaekomi-waza' })).category,
    'osaekomi'
  );
  assert.equal(
    scoreTechniqueFromKodokan(kodokan({ name: 'Hadaka-jime', category: 'Ne-waza', subcategory: 'Shime-waza' })).category,
    'shime'
  );
  assert.equal(
    scoreTechniqueFromKodokan(kodokan({ name: 'Ude-garami', category: 'Ne-waza', subcategory: 'Kansetsu-waza' })).category,
    'kansetsu'
  );
  assert.equal(
    scoreTechniqueFromKodokan(kodokan({ name: 'Handcuff Turnover', category: 'Ne-waza', subcategory: 'Custom', isCustom: true })).category,
    'other'
  );
});

test('defaultScoreTechniqueCategory only defaults osaekomi to the pin list', () => {
  assert.equal(defaultScoreTechniqueCategory('osaekomi'), 'osaekomi');
  assert.equal(defaultScoreTechniqueCategory('attempt'), 'nage');
  assert.equal(defaultScoreTechniqueCategory('wazari'), null);
  assert.equal(defaultScoreTechniqueCategory('yuko'), null);
  assert.equal(defaultScoreTechniqueCategory('ippon'), null);
  assert.equal(defaultScoreTechniqueCategory('golden_score'), null);
  assert.equal(defaultScoreTechniqueCategory('shido'), null);
});

test('listTechniquesWithoutQuery is true for small ne-waza buckets', () => {
  assert.equal(listTechniquesWithoutQuery('osaekomi'), true);
  assert.equal(listTechniquesWithoutQuery('shime'), true);
  assert.equal(listTechniquesWithoutQuery('kansetsu'), true);
  assert.equal(listTechniquesWithoutQuery('other'), true);
  assert.equal(listTechniquesWithoutQuery('nage'), false);
  assert.equal(listTechniquesWithoutQuery(null), false);
});

test('techniqueMatchesScoreCategory includes dojo custom in every Kodokan bucket', () => {
  const seoi = kodokan({ name: 'Seoi-nage', category: 'Tachi-waza', subcategory: 'Te-waza' });
  const kesa = kodokan({ name: 'Kesa-gatame', category: 'Ne-waza', subcategory: 'Osaekomi-waza' });
  const custom = kodokan({ name: 'Handcuff Turnover', category: 'Ne-waza', subcategory: 'Custom', isCustom: true });
  assert.equal(techniqueMatchesScoreCategory(seoi, 'nage'), true);
  assert.equal(techniqueMatchesScoreCategory(seoi, 'osaekomi'), false);
  assert.equal(techniqueMatchesScoreCategory(kesa, 'osaekomi'), true);
  assert.equal(techniqueMatchesScoreCategory(custom, 'osaekomi'), true);
  assert.equal(techniqueMatchesScoreCategory(custom, 'nage'), true);
  assert.equal(techniqueMatchesScoreCategory(custom, 'other'), true);
  assert.equal(techniqueMatchesScoreCategory(seoi, 'other'), false);
  assert.equal(techniqueMatchesScoreCategory(seoi, null), true);
});
