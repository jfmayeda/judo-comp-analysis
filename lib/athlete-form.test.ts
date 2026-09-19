import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  athleteFormToPayload,
  emptyAthleteForm,
  normalizeLastInitial,
  validateAthleteForm,
} from './athlete-form';

test('validateAthleteForm requires first name and exactly one initial', () => {
  const empty = emptyAthleteForm();
  assert.deepEqual(Object.keys(validateAthleteForm(empty)).sort(), ['firstName', 'lastInitial']);
  const ok = { ...empty, firstName: 'Maya', lastInitial: 'h' };
  assert.deepEqual(validateAthleteForm(ok), {});
  const fullName = { ...empty, firstName: 'Maya', lastInitial: 'Hernandez' };
  // normalized to one letter, so it validates — the payload never carries the full name
  assert.deepEqual(validateAthleteForm(fullName), {});
  assert.equal(athleteFormToPayload(fullName).lastInitial, 'H');
});

test('normalizeLastInitial strips non-letters and upper-cases', () => {
  assert.equal(normalizeLastInitial(' h.'), 'H');
  assert.equal(normalizeLastInitial('12'), '');
});

test('athleteFormToPayload keeps the createAthlete contract', () => {
  const values = {
    ...emptyAthleteForm(),
    firstName: ' Maya ',
    lastInitial: 'h',
    stance: 'right' as const,
    tokuiTechniqueIds: ['a', 'b'],
    newazaTechniqueIds: ['b', 'c'],
  };
  const payload = athleteFormToPayload(values);
  assert.equal(payload.firstName, 'Maya');
  assert.equal(payload.lastInitial, 'H');
  assert.equal(payload.stance, 'right');
  assert.deepEqual(payload.techniqueIds, ['a', 'b', 'c']);
  assert.deepEqual(payload.tokuiTechniqueIds, ['a', 'b']);
  assert.deepEqual(payload.newazaTechniqueIds, ['b', 'c']);
  assert.equal(athleteFormToPayload(emptyAthleteForm()).stance, null);
  assert.deepEqual(
    Object.keys(payload).sort(),
    [
      'ageDivision', 'coachIsExclusive', 'currentBelt', 'developmentAreas', 'firstName', 'isCoachLocked',
      'kumiKata', 'lastInitial', 'neWaza', 'newazaTechniqueIds', 'notes', 'preferredCoachId', 'stance',
      'techniqueIds', 'tokuiTechniqueIds', 'tokuiWaza', 'weightClass',
    ],
  );
});
