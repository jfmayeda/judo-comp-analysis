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
assert(types.includes("export type ScoreRecipient = 'us' | 'them'"), 'recipient is us|them');
assert(types.includes("| 'yuko'"), 'yuko on capture event types');
assert(types.includes('scoreEvents: CaptureScoreEvent[]'), 'OpponentNote.scoreEvents');
assert(types.includes("| 'wazari'"), 'wazari aligns with activity mock');
assert(types.includes('export type ScoreTechniqueCategory'), 'ScoreTechniqueCategory type');
assert(types.includes('technique?: ScoreTechnique'), 'optional nested technique on score events');
assert(read('lib/capture-score.ts').includes("yuko: 'Yuko'"), 'yuko label in capture formatter');
assert(!read('lib/capture-score.ts').includes("'koka'"), 'koka not in capture parser');

const capture = read('lib/quick-capture.ts');
assert(capture.includes('export async function saveQuickCapture'), 'saveQuickCapture');
assert(capture.includes('export async function updateQuickCapture'), 'updateQuickCapture');
assert(capture.includes('checkCoachAllowlist'), 'coach-only save');
assert(capture.includes('scoreEvents: parseCaptureScoreEvents'), 'save writes score events');
assert(capture.includes('withDefaultRecipients'), 'new writes default recipient');
assert(!capture.includes('smoothcomp'), 'no SmoothComp');

const store = read('lib/supabase-store.ts');
assert(store.includes('result: data.result ?? null'), 'createOpponentNote writes result');
assert(store.includes('score_flavor: data.scoreFlavor ?? null'), 'createOpponentNote writes score flavor');
assert(store.includes('score_events: data.scoreEvents ?? []'), 'createOpponentNote writes score events');
assert(store.includes('if (data.result !== undefined) updateData.result = data.result'), 'updateOpponentNote writes result');
assert(store.includes('if (data.scoreFlavor !== undefined) updateData.score_flavor = data.scoreFlavor'), 'updateOpponentNote writes score flavor');
assert(store.includes('if (data.scoreEvents !== undefined) updateData.score_events = data.scoreEvents'), 'updateOpponentNote writes score events');

const ui = read('components/QuickCapture.tsx');
assert(ui.includes('saveQuickCapture'), 'form calls saveQuickCapture');
assert(ui.includes('updateQuickCapture'), 'form can update a saved capture');
assert(ui.includes('existingNote'), 'edit mode seeds from existing note');
assert(ui.includes('TechniquePicker'), 'reuses TechniquePicker');
assert(ui.includes('aria-pressed'), 'selected controls set aria-pressed');
assert(read('components/ui/Chip.tsx').includes('chip-toggle'), 'selected chips use chip-toggle');
assert(ui.includes('list-choice'), 'opponent list uses list-choice');
assert(ui.includes('data-testid="capture-summary"'), 'pre-save summary');
assert(ui.includes("addShido('them')"), 'can log opponent shido');
assert(ui.includes("eventType: 'wazari'"), 'can log waza-ari');
assert(ui.includes("eventType: 'ippon'"), 'can log ippon');
assert(ui.includes("eventType: 'yuko'"), 'can log yuko');
assert(ui.includes('data-testid={`add-${item.eventType}`}'), 'add chips are testable');
assert(ui.includes('data-testid={`recipient-${index}`}'), 'recipient toggle on event row');
assert(ui.includes('data-testid={`how-${index}`}'), 'technique chip on event row');
assert(ui.includes('scoreCategory={pickerCategory}'), 'picker receives score category');
assert(read('lib/capture-score.ts').includes('parseScoreTechnique'), 'nested technique parser');
assert(read('lib/capture-score.ts').includes('event.technique?.name'), 'formatter uses nested technique name');

const css = read('app/globals.css');
assert(css.includes(".chip-toggle[aria-pressed='true']"), 'pressed chips are filled navy');
assert(css.includes('background: var(--svj-navy-800)'), 'selected fill uses navy');
assert(css.includes('.bg-brand-blue'), 'bg-brand-blue utility exists');

const athlete = read('app/athletes/[id]/page.tsx');
assert(athlete.includes('<QuickCapture'), 'athlete profile entry');
assert(athlete.includes('onQuickCapture'), 'hero opens capture');
assert(athlete.includes('existingNote={editingNote}'), 'edit mode wired on athlete page');
assert(athlete.includes('onEditCapture'), 'saved captures can be edited');

const intel = read('components/athlete/OpponentIntelCard.tsx');
assert(intel.includes('noteCaptureHeadline'), 'saved capture summary on opponent intel');
assert(intel.includes('Edit capture vs'), 'opponent intel has edit');

const hero = read('components/athlete/AthleteHero.tsx');
assert(hero.includes('Quick capture'), 'hero Quick capture button');

const roster = read('app/tournament-day/page.tsx');
assert(roster.includes('#quick-capture'), 'tournament roster capture link');

const migration = read('supabase/migrations/20260914_quick_capture_fields.sql');
assert(migration.includes("result in ('win', 'loss', 'other')"), 'result check');
assert(migration.includes('golden_score'), 'score flavor check');

const eventsMigration = read(
  'supabase/migrations/20260914_quick_capture_score_events.sql'
);
assert(eventsMigration.includes('score_events jsonb'), 'score_events column');

const yukoMigration = read('supabase/migrations/20261011_score_flavor_yuko.sql');
assert(yukoMigration.includes("'yuko'"), 'yuko added to score flavor check');
assert(!yukoMigration.includes('koka'), 'koka not added');

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll wiring checks passed');
