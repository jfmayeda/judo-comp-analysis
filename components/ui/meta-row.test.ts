import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metaRowPlainText, visibleMetaItems } from './meta-row';

test('stance and weight stay separated (no RightWEIGHT concat)', () => {
  const text = metaRowPlainText([
    { label: 'Stance', value: 'right', capitalize: true },
    { label: 'Weight', value: '-66kg' },
  ]);
  const visual = text.replace(/Stance:/g, 'STANCE:').replace(/Weight:/g, 'WEIGHT:');

  assert.equal(text, 'Stance: Right Weight: -66kg');
  assert.equal(visual.includes('RightWEIGHT'), false);
  assert.equal(visual, 'STANCE: Right WEIGHT: -66kg');
});

test('visibleMetaItems drops empty values', () => {
  assert.deepEqual(
    visibleMetaItems([
      { label: 'Stance', value: 'left', capitalize: true },
      { label: 'Weight', value: '' },
      { label: 'Division', value: '  ' },
    ]),
    [{ label: 'Stance', value: 'left', capitalize: true }],
  );
});
