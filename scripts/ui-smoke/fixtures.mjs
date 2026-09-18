// Local demo fixtures for the UI smoke / screenshot harness.
// Privacy rules hold here too: first name + last initial only, no photos.
// Nothing in this file is production data.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const TECHNIQUES = JSON.parse(readFileSync(join(here, 'techniques.json'), 'utf8'));

export const MOCK_DEMO_MARKER = '[SAMPLE DATA - Mock demo athlete]';

export function uuid(n) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

const T = (name) => {
  const t = TECHNIQUES.find((x) => x.name === name);
  if (!t) throw new Error(`fixture technique missing: ${name}`);
  return t.id;
};

export function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function buildFixtures({ empty = false } = {}) {
  const techniques = TECHNIQUES.map((t, i) => ({
    id: uuid(1000 + i),
    name: t.name,
    category: t.category,
    subcategory: t.subcategory,
    display_order: t.display_order,
    is_custom: false,
    created_by: null,
    created_at: daysAgo(400),
  }));
  // let T() resolve ids
  techniques.forEach((t, i) => {
    TECHNIQUES[i].id = t.id;
  });

  const coachIds = { jorge: uuid(1), amy: uuid(2), dev: uuid(3) };
  const coach_allowlist = [
    { id: coachIds.jorge, email: 'sensei.jorge@svjudo.test', invited_by: null, invited_at: daysAgo(300), is_admin: true },
    { id: coachIds.amy, email: 'coach.amy@svjudo.test', invited_by: coachIds.jorge, invited_at: daysAgo(200), is_admin: false },
    { id: coachIds.dev, email: 'coach.dev@svjudo.test', invited_by: coachIds.jorge, invited_at: daysAgo(100), is_admin: true },
  ];

  if (empty) {
    return { techniques, coach_allowlist, athletes: [], opponents: [], opponent_notes: [], promotions: [], tournament_days: [], tournament_day_entries: [], coachIds };
  }

  const A = { maya: uuid(10), demo: uuid(11), sample: uuid(12), kenji: uuid(13), lucas: uuid(14), priya: uuid(15) };

  const athlete = (over) => ({
    tokui_waza: '', development_areas: '', notes: '', stance: null, kumi_kata: '', ne_waza: '',
    weight_class: '', age_division: '', current_belt: 'unset', technique_ids: [], tokui_technique_ids: [],
    newaza_technique_ids: [], preferred_coach_id: null, is_coach_locked: false, coach_is_exclusive: false,
    created_by: coachIds.dev, ...over,
  });

  const athletes = [
    athlete({
      id: A.maya, first_name: 'Maya', last_initial: 'H', current_belt: 'blue', stance: 'right',
      weight_class: '-48kg', age_division: 'Juvenile',
      tokui_waza: 'Strong right-sided entries', ne_waza: 'Fast to kesa from a failed throw',
      development_areas: 'Ne-waza transitions, grip fighting speed',
      kumi_kata: 'High lapel grip, quick hand changes',
      notes: 'Competes best when she attacks early. Tends to stall after leading by waza-ari.',
      tokui_technique_ids: [T('Seoi-nage'), T('Uchi-mata'), T('Ko-uchi-gari')],
      newaza_technique_ids: [T('Kesa-gatame'), T('Ude-hishigi-juji-gatame')],
      technique_ids: [T('Seoi-nage'), T('Uchi-mata'), T('Ko-uchi-gari'), T('Kesa-gatame'), T('Ude-hishigi-juji-gatame')],
      preferred_coach_id: coachIds.jorge, is_coach_locked: true,
      created_at: daysAgo(90), updated_at: daysAgo(2),
    }),
    athlete({
      id: A.demo, first_name: 'Demo', last_initial: 'A', current_belt: 'green', stance: 'right',
      weight_class: '-48kg', age_division: 'Juvenile',
      tokui_waza: 'Seoi-nage, Uchi-mata', development_areas: 'Ne-waza transitions, grip fighting speed',
      notes: `Strong thrower, needs work on ground game. Competes in -48kg division. ${MOCK_DEMO_MARKER}`,
      kumi_kata: 'Traditional high lapel grip, quick hand changes', ne_waza: 'Working on turtle attacks, solid pins',
      created_at: daysAgo(80), updated_at: daysAgo(80),
    }),
    athlete({
      id: A.sample, first_name: 'Sample', last_initial: 'B', current_belt: 'orange', stance: 'right',
      weight_class: '-66kg', age_division: 'Cadet',
      tokui_waza: 'Osoto-gari, Harai-goshi', development_areas: 'Left-side attacks, tournament cardio',
      notes: `Powerful right-sided player. Currently working on switching stances. -66kg division. ${MOCK_DEMO_MARKER}`,
      kumi_kata: 'Deep sleeve control, defensive posture', ne_waza: 'Strong top game, needs escape work',
      created_at: daysAgo(79), updated_at: daysAgo(79),
    }),
    athlete({
      id: A.kenji, first_name: 'Kenji', last_initial: 'T', current_belt: 'white',
      created_at: daysAgo(3), updated_at: daysAgo(3),
    }),
    athlete({
      id: A.lucas, first_name: 'Lucas', last_initial: 'R', current_belt: 'green', stance: 'left',
      weight_class: '-73kg', age_division: 'Cadet',
      development_areas: 'Finishing from turtle; stop dropping the head on uchi-mata',
      kumi_kata: 'Sleeve-lapel, likes cross grip',
      tokui_technique_ids: [T('Uchi-mata'), T('O-soto-gari')],
      newaza_technique_ids: [T('Sankaku-jime')],
      technique_ids: [T('Uchi-mata'), T('O-soto-gari'), T('Sankaku-jime')],
      preferred_coach_id: coachIds.amy, coach_is_exclusive: true,
      created_at: daysAgo(40), updated_at: daysAgo(10),
    }),
    athlete({
      id: A.priya, first_name: 'Priya', last_initial: 'S', current_belt: 'yellow', stance: 'unknown',
      weight_class: '-40kg', age_division: 'Juvenile', development_areas: 'Confidence in randori; first tournament this season',
      created_at: daysAgo(20), updated_at: daysAgo(20),
    }),
  ];

  const O = { sarah: uuid(20), ryan: uuid(21), elena: uuid(22) };
  const opponents = [
    { id: O.sarah, first_name: 'Sarah', last_initial: 'M', club: 'Peninsula Judo', stance: 'left', kumi_kata: 'High collar grip, pulls down', ne_waza: 'Strong pins, avoid bottom position', common_counters: 'Ko-soto-gake, tai-otoshi on failed attacks', weight_class: '-48kg', age_division: 'Juvenile', notes: 'Very aggressive, likes left uchi-mata.', technique_ids: [T('Uchi-mata'), T('Ko-soto-gake')], tokui_technique_ids: [T('Uchi-mata')], newaza_technique_ids: [], created_at: daysAgo(60), updated_at: daysAgo(60), created_by: coachIds.jorge },
    { id: O.ryan, first_name: 'Ryan', last_initial: 'P', club: 'Monterey Judo Club', stance: 'right', kumi_kata: 'Long-arm control, stiff arms', ne_waza: 'Average ground game', common_counters: 'Uchi-mata when you close distance', weight_class: '-66kg', age_division: 'Cadet', notes: 'Taller opponent, good at keeping distance.', technique_ids: [T('Uchi-mata')], tokui_technique_ids: [T('Uchi-mata')], newaza_technique_ids: [], created_at: daysAgo(50), updated_at: daysAgo(50), created_by: coachIds.amy },
    { id: O.elena, first_name: 'Elena', last_initial: 'K', club: 'Sacramento Judo', stance: null, kumi_kata: '', ne_waza: '', common_counters: '', weight_class: '-48kg', age_division: 'Juvenile', notes: '', technique_ids: [], tokui_technique_ids: [], newaza_technique_ids: [], created_at: daysAgo(5), updated_at: daysAgo(5), created_by: coachIds.dev },
  ];

  const note = (over) => ({
    opponent_id: null, club: null, tournament: null, stance: null, kumi_kata: '', ne_waza: '', common_counters: '',
    weight_class: '', age_division: '', technique_ids: [], tokui_technique_ids: [], newaza_technique_ids: [],
    result: null, score_flavor: null, score_events: [], created_by: coachIds.dev, ...over,
  });

  const opponent_notes = [
    note({
      id: uuid(30), athlete_id: A.maya, opponent_id: O.sarah, opponent_label: 'Sarah M.', club: 'Peninsula Judo',
      tournament: 'Bay Area Open', stance: 'left',
      notes: 'Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake. Start with sleeve control and attack first.',
      technique_ids: [T('Uchi-mata'), T('Ko-soto-gake')], tokui_technique_ids: [T('Uchi-mata')],
      created_at: daysAgo(30),
    }),
    note({
      id: uuid(31), athlete_id: A.maya, opponent_label: 'Elena K.', club: 'Sacramento Judo',
      notes: 'Clean drop seoi after she reached over the top.',
      result: 'win', score_flavor: 'ippon',
      score_events: [{ eventType: 'ippon', sequenceOrder: 1, techniqueId: T('Seoi-nage'), techniqueLabel: 'Seoi-nage' }],
      technique_ids: [T('Seoi-nage')], created_at: daysAgo(7),
    }),
    note({
      id: uuid(32), athlete_id: A.maya, opponent_label: 'Unknown',
      notes: 'Went passive after the waza-ari. Two shidos then caught in osaekomi.',
      result: 'loss', score_flavor: 'osaekomi',
      score_events: [
        { eventType: 'wazari', sequenceOrder: 1, techniqueId: T('Uchi-mata'), techniqueLabel: 'Uchi-mata' },
        { eventType: 'shido', sequenceOrder: 2, recipient: 'athlete' },
        { eventType: 'shido', sequenceOrder: 3, recipient: 'athlete' },
        { eventType: 'osaekomi', sequenceOrder: 4 },
      ],
      technique_ids: [T('Uchi-mata')], created_at: daysAgo(6),
    }),
    note({
      id: uuid(33), athlete_id: A.demo, opponent_label: 'Sarah M', club: 'Peninsula Judo', tournament: 'Bay Area Open 2024', stance: 'left',
      kumi_kata: 'High collar grip, pulls down', ne_waza: 'Strong pins, avoid bottom position', common_counters: 'Ko-soto-gake, tai-otoshi on failed attacks',
      weight_class: '-48kg', age_division: 'Juvenile',
      notes: `Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake. ${MOCK_DEMO_MARKER}`, created_at: daysAgo(70),
    }),
    note({
      id: uuid(34), athlete_id: A.sample, opponent_label: 'Ryan P', club: 'Monterey Judo Club', tournament: 'Bay Area Open 2024', stance: 'right',
      kumi_kata: 'Long-arm control, stiff arms', ne_waza: 'Average ground game', common_counters: 'Uchi-mata when you close distance',
      weight_class: '-66kg', age_division: 'Cadet',
      notes: `Taller opponent, good at keeping distance. Close the gap fast, work inside grip. ${MOCK_DEMO_MARKER}`, created_at: daysAgo(70),
    }),
    note({
      id: uuid(35), athlete_id: A.lucas, opponent_id: O.ryan, opponent_label: 'Ryan P.', club: 'Monterey Judo Club',
      notes: 'Lost on shidos. Needs to attack inside the first 30 seconds.', result: 'loss', score_flavor: null,
      score_events: [{ eventType: 'shido', sequenceOrder: 1, recipient: 'athlete' }, { eventType: 'shido', sequenceOrder: 2, recipient: 'athlete' }, { eventType: 'shido', sequenceOrder: 3, recipient: 'athlete' }],
      created_at: daysAgo(12),
    }),
  ];

  const promotions = [
    { id: uuid(40), athlete_id: A.maya, promotion_date: '2024-03-16', from_belt: 'yellow', to_belt: 'orange', notes: 'Spring grading', created_by: coachIds.jorge, created_at: daysAgo(80), updated_at: daysAgo(80) },
    { id: uuid(41), athlete_id: A.maya, promotion_date: '2025-01-11', from_belt: 'orange', to_belt: 'green', notes: '', created_by: coachIds.jorge, created_at: daysAgo(60), updated_at: daysAgo(60) },
    { id: uuid(42), athlete_id: A.maya, promotion_date: '2026-02-07', from_belt: 'green', to_belt: 'blue', notes: 'Passed nage-no-kata set 1', created_by: coachIds.jorge, created_at: daysAgo(20), updated_at: daysAgo(20) },
    { id: uuid(43), athlete_id: A.demo, promotion_date: '2022-06-04', from_belt: 'white', to_belt: 'yellow', notes: '', created_by: coachIds.jorge, created_at: daysAgo(70), updated_at: daysAgo(70) },
    { id: uuid(44), athlete_id: A.demo, promotion_date: '2024-01-20', from_belt: 'yellow', to_belt: 'green', notes: '', created_by: coachIds.jorge, created_at: daysAgo(70), updated_at: daysAgo(70) },
  ];

  const TD = uuid(50);
  const tournament_days = [
    { id: TD, name: 'Bay Area Open', day: todayIso(), created_at: daysAgo(1), created_by: coachIds.dev },
    { id: uuid(51), name: 'NorCal Spring Championships', day: '2026-03-14', created_at: daysAgo(190), created_by: coachIds.jorge },
  ];
  const tournament_day_entries = [
    { id: uuid(60), tournament_day_id: TD, athlete_id: A.maya, assigned_coach_id: coachIds.jorge, mat_number: '1', time_window: '9:00-10:00 AM', no_coach_needed: false, created_at: daysAgo(1) },
    { id: uuid(61), tournament_day_id: TD, athlete_id: A.lucas, assigned_coach_id: null, mat_number: '3', time_window: '10:00-11:00 AM', no_coach_needed: false, created_at: daysAgo(1) },
    { id: uuid(62), tournament_day_id: TD, athlete_id: A.priya, assigned_coach_id: null, mat_number: '1', time_window: '9:00-10:00 AM', no_coach_needed: false, created_at: daysAgo(1) },
    { id: uuid(63), tournament_day_id: TD, athlete_id: A.kenji, assigned_coach_id: null, mat_number: null, time_window: null, no_coach_needed: true, created_at: daysAgo(1) },
  ];

  return { techniques, coach_allowlist, athletes, opponents, opponent_notes, promotions, tournament_days, tournament_day_entries, coachIds, ids: { athletes: A, opponents: O, tournamentDay: TD } };
}
