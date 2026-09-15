import { test } from 'node:test';
import assert from 'node:assert/strict';
import { techniqueChipLabels } from './technique-chips.ts';

test('technique chips use names, never UUIDs', () => {
  const uuid = '51215cc7-0f11-4cfe-a0d8-8a5e01bc0100';
  const labels = techniqueChipLabels('', [uuid, 'Uchi-mata', 'O-uchi-gari']);
  assert.deepEqual(labels, ['Uchi-mata', 'O-uchi-gari']);
  assert.equal(labels.some((label) => label.includes('-0F11-') || LOOKS_LIKE_UUID(label)), false);
});

test('free-text notes stay, duplicate names are skipped', () => {
  const labels = techniqueChipLabels('Uchi-mata, strong right', ['Uchi-mata', 'Seoi-nage']);
  assert.deepEqual(labels, ['Uchi-mata, strong right', 'Seoi-nage']);
});

test('UUID-only free text is dropped', () => {
  assert.deepEqual(
    techniqueChipLabels('0FCDAE16-62FF-427C-8C1E-8BA6F2BE780D', ['Yoko-shiho-gatame']),
    ['Yoko-shiho-gatame'],
  );
});

function LOOKS_LIKE_UUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
