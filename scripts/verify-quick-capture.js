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
assert(types.includes('export type CaptureScoreEvent'), 'CaptureScoreEvent type');
assert(types.includes('scoreEvents: CaptureScoreEvent[]'), 'OpponentNote.scoreEvents');
assert(types.includes("| 'wazari'"), 'wazari aligns with activity mock');

const capture = read('lib/quick-capture.ts');
assert(capture.includes('export async function saveQuickCapture'), 'saveQuickCapture');
assert(capture.includes('checkCoachAllowlist'), 'coach-only save');
assert(capture.includes('scoreEvents: parseCaptureScoreEvents'), 'save writes score events');
assert(!capture.includes('smoothcomp'), 'no SmoothComp');

const store = read('lib/supabase-store.ts');
assert(store.includes('result: data.result ?? null'), 'createOpponentNote writes result');
assert(store.includes('score_flavor: data.scoreFlavor ?? null'), 'createOpponentNote writes score flavor');
assert(store.includes('score_events: data.scoreEvents ?? []'), 'createOpponentNote writes score events');

const ui = read('components/QuickCapture.tsx');
assert(ui.includes('saveQuickCapture'), 'form calls saveQuickCapture');
assert(ui.includes('TechniquePicker'), 'reuses TechniquePicker');
assert(ui.includes('aria-pressed'), 'selected controls set aria-pressed');
assert(ui.includes('chip-toggle'), 'selected chips use chip-toggle');
assert(ui.includes('list-choice'), 'opponent list uses list-choice');
assert(ui.includes('data-testid="capture-summary"'), 'pre-save summary');
assert(ui.includes("addShido('opponent')"), 'can log opponent shido');
assert(ui.includes("eventType: 'wazari'"), 'can log waza-ari');
assert(ui.includes("eventType: 'ippon'"), 'can log ippon');

const css = read('app/globals.css');
assert(css.includes('.chip-toggle[aria-pressed="true"]'), 'pressed chips are filled navy');
assert(css.includes('background: var(--color-navy-2)'), 'selected fill uses navy');
assert(css.includes('.bg-brand-blue'), 'bg-brand-blue utility exists');

const athlete = read('app/athletes/[id]/page.tsx');
assert(athlete.includes('<QuickCapture'), 'athlete profile entry');
assert(athlete.includes('onQuickCapture'), 'matside card opens capture');
assert(athlete.includes('noteCaptureHeadline'), 'saved capture summary on athlete');

const card = read('components/MatSideCoachCard.tsx');
assert(card.includes('Quick capture'), 'matside Quick capture button');

const roster = read('app/tournament-day/page.tsx');
assert(roster.includes('#quick-capture'), 'tournament roster capture link');

const migration = read('supabase/migrations/20260914_quick_capture_fields.sql');
assert(migration.includes("result in ('win', 'loss', 'other')"), 'result check');
assert(migration.includes('golden_score'), 'score flavor check');

const eventsMigration = read(
  'supabase/migrations/20260914_quick_capture_score_events.sql'
);
assert(eventsMigration.includes('score_events jsonb'), 'score_events column');

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll wiring checks passed');
