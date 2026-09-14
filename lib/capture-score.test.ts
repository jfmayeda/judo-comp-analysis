import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectTechniqueIds,
  deriveScoreFlavor,
  formatCaptureScoreSummary,
  noteCaptureHeadline,
  parseCaptureScoreEvents,
  withSequenceOrders,
} from './capture-score';

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

test('parseCaptureScoreEvents keeps shido with recipient and drops shido without one', () => {
  const events = parseCaptureScoreEvents([
    { sequenceOrder: 1, eventType: 'shido', recipient: 'opponent' },
    { sequenceOrder: 2, eventType: 'shido' },
    { sequenceOrder: 3, eventType: 'golden_score' },
  ]);

  assert.deepEqual(events, [
    { eventType: 'shido', sequenceOrder: 1, recipient: 'opponent' },
    { eventType: 'golden_score', sequenceOrder: 2 },
  ]);
});

test('withSequenceOrders numbers events from 1', () => {
  const events = withSequenceOrders([
    { eventType: 'wazari', techniqueLabel: 'Ko-uchi-gari' },
    { eventType: 'shido', recipient: 'athlete' },
    { eventType: 'ippon' },
  ]);

  assert.equal(events[0]?.sequenceOrder, 1);
  assert.equal(events[1]?.sequenceOrder, 2);
  assert.equal(events[2]?.sequenceOrder, 3);
  assert.equal(events[1]?.eventType, 'shido');
  if (events[1]?.eventType === 'shido') {
    assert.equal(events[1].recipient, 'athlete');
  }
});

test('deriveScoreFlavor uses the last scoring event and skips shido', () => {
  assert.equal(deriveScoreFlavor([]), null);
  assert.equal(
    deriveScoreFlavor([
      { eventType: 'wazari', sequenceOrder: 1 },
      { eventType: 'shido', sequenceOrder: 2, recipient: 'opponent' },
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
        { eventType: 'shido', sequenceOrder: 2, recipient: 'opponent' },
        { eventType: 'ippon', sequenceOrder: 3 },
      ],
    }),
    'Loss · 1. Waza-ari via Uchi-mata · 2. Shido (them) · 3. Ippon'
  );
});

test('collectTechniqueIds keeps unique ids in order', () => {
  assert.deepEqual(
    collectTechniqueIds([
      { eventType: 'wazari', sequenceOrder: 1, techniqueId: 'a' },
      { eventType: 'shido', sequenceOrder: 2, recipient: 'athlete' },
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

test('noteCaptureHeadline falls back to result and flavor', () => {
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
      result: null,
      scoreEvents: [],
      scoreFlavor: null,
    }),
    null
  );
});
