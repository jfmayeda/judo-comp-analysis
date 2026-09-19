import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capturedResults, isSampleAthlete, stripSampleMarker, tallyResults } from './development';
import type { OpponentNote } from './types';

const base: OpponentNote = {
  id: 'n', athleteId: 'a', opponentId: null, opponentLabel: 'Unknown', club: null, notes: '', tournament: null,
  stance: null, kumiKata: '', neWaza: '', commonCounters: '', weightClass: '', ageDivision: '', techniqueIds: [],
  tokuiTechniqueIds: [], newazaTechniqueIds: [], result: null, scoreFlavor: null, scoreEvents: [], createdAt: '2026-01-01T00:00:00Z',
};

test('capturedResults keeps only notes with a result, newest first', () => {
  const notes: OpponentNote[] = [
    { ...base, id: 'scout', notes: 'scouting only' },
    { ...base, id: 'old', result: 'loss', createdAt: '2026-01-02T00:00:00Z' },
    { ...base, id: 'new', result: 'win', scoreFlavor: 'ippon', createdAt: '2026-01-03T00:00:00Z',
      scoreEvents: [{ eventType: 'ippon', sequenceOrder: 1, techniqueLabel: 'Seoi-nage' }] },
  ];
  const results = capturedResults(notes);
  assert.deepEqual(results.map((r) => r.id), ['new', 'old']);
  assert.equal(results[0].headline, 'Win · 1. Ippon via Seoi-nage');
  assert.equal(results[1].headline, 'Loss');
});

test('tallyResults counts wins, losses, other and ippon wins', () => {
  const tally = tallyResults([
    { ...base, result: 'win', scoreFlavor: 'ippon' },
    { ...base, result: 'win', scoreFlavor: 'waza_ari' },
    { ...base, result: 'loss' },
    { ...base, result: 'other' },
    { ...base },
  ]);
  assert.deepEqual(tally, { total: 4, wins: 2, losses: 1, other: 1, ipponWins: 1 });
});

test('sample athletes are detected and the marker is stripped from prose', () => {
  assert.equal(isSampleAthlete({ firstName: 'Demo', lastInitial: 'A', notes: '' }), true);
  assert.equal(isSampleAthlete({ firstName: 'Maya', lastInitial: 'H', notes: 'x [SAMPLE DATA - Mock demo athlete]' }), true);
  assert.equal(isSampleAthlete({ firstName: 'Maya', lastInitial: 'H', notes: 'real' }), false);
  assert.equal(stripSampleMarker('Strong thrower. [SAMPLE DATA - Mock demo athlete]'), 'Strong thrower.');
});
