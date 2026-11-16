import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyStats,
  formatModifier,
  isStatKey,
  modifier,
  parseDbRow,
  parseScore,
  STAT_KEYS,
} from './athlete-stats';

test('modifier is D&D floor((score-10)/2)', () => {
  assert.equal(modifier(15), 2);
  assert.equal(formatModifier(15), '+2');
  assert.equal(modifier(10), 0);
  assert.equal(formatModifier(10), '+0');
  assert.equal(modifier(9), -1);
  assert.equal(formatModifier(9), '-1');
  assert.equal(modifier(1), -5);
  assert.equal(modifier(20), 5);
  assert.equal(formatModifier(20), '+5');
});

test('parseScore accepts integers 1-20 only', () => {
  assert.equal(parseScore(15), 15);
  assert.equal(parseScore('8'), 8);
  assert.equal(parseScore(0), null);
  assert.equal(parseScore(21), null);
  assert.equal(parseScore(12.5), null);
  assert.equal(parseScore('nope'), null);
});

test('isStatKey matches the four sheet keys', () => {
  assert.deepEqual([...STAT_KEYS], ['athleticism', 'strength', 'speed', 'technique']);
  assert.equal(isStatKey('strength'), true);
  assert.equal(isStatKey('charisma'), false);
});

test('parseDbRow rejects a missing score and keeps notes as strings', () => {
  const parsed = parseDbRow({
    athlete_id: 'a1',
    athleticism: 14,
    athleticism_note: 'engine',
    strength: 15,
    strength_note: null,
    speed: 11,
    speed_note: '',
    technique: 9,
    technique_note: 'grip',
    rated_at: '2026-10-01T00:00:00.000Z',
    rated_by_email: 'coach.dev@svjudo.test',
  });
  assert.ok(parsed);
  assert.equal(parsed.stats.strength.score, 15);
  assert.equal(parsed.stats.strength.note, '');
  assert.equal(parsed.stats.athleticism.note, 'engine');
  assert.equal(parseDbRow({
    athlete_id: 'a1',
    athleticism: 14,
    athleticism_note: '',
    strength: 99,
    strength_note: '',
    speed: 11,
    speed_note: '',
    technique: 9,
    technique_note: '',
    rated_at: '',
    rated_by_email: '',
  }), null);
});

test('emptyStats starts every key at 10 / +0', () => {
  const sheet = emptyStats('a1');
  for (const key of STAT_KEYS) {
    assert.equal(sheet.stats[key].score, 10);
    assert.equal(modifier(sheet.stats[key].score), 0);
  }
});
