import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../..', import.meta.url);

test('technique picker results stay opaque and in-flow', () => {
  const css = readFileSync(new URL('app/globals.css', root), 'utf8');
  const picker = readFileSync(new URL('components/TechniquePicker.tsx', root), 'utf8');

  const panelBlock = css.match(/\.technique-picker-panel\s*\{[^}]+\}/)?.[0] ?? '';
  assert.match(panelBlock, /background-color:\s*var\(--svj-white\)/);
  assert.equal(/transparent|rgba\(|blur|backdrop-filter/.test(panelBlock), false);
  assert.match(panelBlock, /border-radius:\s*var\(--svj-radius-card\)/);
  assert.match(panelBlock, /box-shadow:\s*var\(--svj-shadow-neo\)/);

  assert.equal(picker.includes('fixed inset-0'), false);
  assert.equal(picker.includes('rounded-lg'), false);
  assert.equal(picker.includes('shadow-lg'), false);
  assert.match(picker, /className="technique-picker-panel"/);
  assert.match(picker, /rootRef/);
});

test('form inputs and page shells reserve bottom chrome and clip inside cards', () => {
  const css = readFileSync(new URL('app/globals.css', root), 'utf8');
  const athlete = readFileSync(new URL('app/athletes/[id]/page.tsx', root), 'utf8');
  const opponents = readFileSync(new URL('app/opponents/page.tsx', root), 'utf8');

  assert.match(css, /\.form-input\s*\{[^}]*max-width:\s*100%/s);
  assert.match(css, /\.form-input:focus\s*\{[^}]*outline-offset:\s*-2px/s);
  assert.match(css, /\.page-shell\s*\{[^}]*safe-area-inset-bottom/s);
  assert.match(css, /\.has-bottom-chrome\s*\{[^}]*safe-area-inset-bottom/s);
  assert.match(css, /\.card form[\s\S]*overflow-x:\s*clip/);
  assert.match(athlete, /has-bottom-chrome/);
  assert.match(opponents, /has-bottom-chrome/);
});
