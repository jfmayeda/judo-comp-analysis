const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('  fail:', msg);
    failed += 1;
  } else {
    console.log('  ok:', msg);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('Quick capture wiring');

const types = read('lib/types.ts');
assert(types.includes('export type CaptureResult'), 'CaptureResult type');
assert(types.includes('export type QuickCaptureInput'), 'QuickCaptureInput type');
assert(types.includes('result: CaptureResult | null'), 'OpponentNote.result');

const capture = read('lib/quick-capture.ts');
assert(capture.includes('export async function saveQuickCapture'), 'saveQuickCapture');
assert(capture.includes('checkCoachAllowlist'), 'coach-only save');
assert(!capture.includes('smoothcomp'), 'no SmoothComp');

const store = read('lib/supabase-store.ts');
assert(store.includes('result: data.result ?? null'), 'createOpponentNote writes result');
assert(store.includes('score_flavor: data.scoreFlavor ?? null'), 'createOpponentNote writes score flavor');

const ui = read('components/QuickCapture.tsx');
assert(ui.includes('saveQuickCapture'), 'form calls saveQuickCapture');
assert(ui.includes('TechniquePicker'), 'reuses TechniquePicker');

const athlete = read('app/athletes/[id]/page.tsx');
assert(athlete.includes('<QuickCapture'), 'athlete profile entry');
assert(athlete.includes('onQuickCapture'), 'matside card opens capture');

const card = read('components/MatSideCoachCard.tsx');
assert(card.includes('Quick capture'), 'matside Quick capture button');

const roster = read('app/tournament-day/page.tsx');
assert(roster.includes('#quick-capture'), 'tournament roster capture link');

const migration = read('supabase/migrations/20260914_quick_capture_fields.sql');
assert(migration.includes("result in ('win', 'loss', 'other')"), 'result check');
assert(migration.includes('golden_score'), 'score flavor check');

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll wiring checks passed');
