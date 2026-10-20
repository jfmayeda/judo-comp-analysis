// Browser smoke suite: runs against a server (default http://localhost:3000)
// with the Supabase mock. Exit code 1 on any failure.
//   npm run smoke
import { launch, openApp, goto, VIEWPORTS, hasHorizontalOverflow, smallTouchTargets, MOCK_FAMILY_USER } from './harness.mjs';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await launch();

async function withApp(opts, fn) {
  const app = await openApp(browser, opts);
  try {
    await fn(app);
  } catch (err) {
    check(`${opts.label ?? 'scenario'} threw`, false, String(err.message).split('\n')[0]);
  } finally {
    await app.context.close();
  }
}

// 1. Auth gate: unauthenticated visit redirects to /login.
await withApp({ login: false, label: 'auth gate' }, async ({ page }) => {
  await page.goto(`${process.env.SMOKE_BASE_URL || 'http://localhost:3000'}/`, { waitUntil: 'networkidle' });
  await page.waitForURL((u) => u.pathname === '/login', { timeout: 10000 }).catch(() => {});
  check('unauthenticated / redirects to /login', new URL(page.url()).pathname === '/login');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const el = document.activeElement; const s = getComputedStyle(el);
    return { type: el.getAttribute('type'), labelled: Boolean(el.id && document.querySelector(`label[for="${el.id}"]`)), outlineWidth: s.outlineWidth };
  });
  check('login: first Tab lands on a labelled email field with a focus ring', focused.type === 'email' && focused.labelled && focused.outlineWidth !== '0px', JSON.stringify(focused));
});

// 2. Every core route at every width: no horizontal overflow, no console errors, small targets.
const ROUTES = [
  ['/', 'roster'],
  ['/opponents', 'opponents'],
  ['/tournament-day', 'tournament-day'],
  ['/tournament-day/assign', 'assign'],
  ['/invite', 'invite'],
  ['/admin/design-tokens', 'design-tokens'],
];
for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  await withApp({ viewport, label: `routes@${vpName}` }, async ({ page, fixtures, consoleErrors }) => {
    const all = [...ROUTES, [`/athletes/${fixtures.ids.athletes.maya}`, 'athlete'], [`/athletes/${fixtures.ids.athletes.demo}`, 'athlete-sample'], [`/athletes/${fixtures.ids.athletes.kenji}`, 'athlete-sparse'], [`/athletes/${fixtures.ids.athletes.maya}/print`, 'print'], [`/tournament-day/print?athletes=${fixtures.ids.athletes.maya}`, 'print-pack']];
    for (const [path, label] of all) {
      await goto(page, path);
      const overflow = await hasHorizontalOverflow(page);
      check(`${label}@${vpName}: no horizontal overflow`, !overflow);
      const h1s = await page.locator('h1').count();
      check(`${label}@${vpName}: exactly one h1`, h1s === 1, `found ${h1s}`);
      if (vpName === 'phone' && !label.startsWith('print')) {
        const small = await smallTouchTargets(page, 44);
        check(`${label}@phone: no primary target under 40px`, small.length === 0, small.slice(0, 4).map((s) => `${s.tag}:${s.text}(${s.h}px)`).join(', '));
      }
    }
    check(`routes@${vpName}: no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  });
}

// 3. Quick Capture: tap count and write shape.
await withApp({ viewport: VIEWPORTS.phone, label: 'quick capture' }, async ({ page, mock, fixtures }) => {
  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  let taps = 0;
  const tap = async (locator) => { await locator.click(); taps += 1; await page.waitForTimeout(150); };
  await tap(page.getByTestId('open-quick-capture'));
  const save = page.getByTestId('save-capture');
  const saveVisible = await save.isVisible();
  const saveInViewport = await save.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  check('quick capture: save button visible without scrolling on phone', saveVisible && saveInViewport);
  check('quick capture: save disabled until a result is chosen', await save.isDisabled());
  await tap(page.getByTestId('result-win'));
  await tap(page.getByTestId('add-ippon'));
  await tap(save);
  await page.waitForTimeout(600);
  check('quick capture: basic win with ippon saved in ≤5 taps', taps <= 5, `${taps} taps`);
  const write = mock.writes.find((w) => w.table === 'opponent_notes' && w.method === 'POST');
  const row = write?.rows?.[0];
  check('quick capture: writes opponent_notes row', Boolean(row));
  if (row) {
    check('quick capture: result=win', row.result === 'win');
    check('quick capture: score_flavor=ippon', row.score_flavor === 'ippon');
    check('quick capture: score_events sequence', Array.isArray(row.score_events) && row.score_events.length === 1 && row.score_events[0].eventType === 'ippon' && row.score_events[0].sequenceOrder === 1);
    check('quick capture: default recipient is us on a win', row.score_events?.[0]?.recipient === 'us');
    check('quick capture: unknown opponent label', row.opponent_label === 'Unknown' && row.opponent_id === null);
    check('quick capture: athlete_id set', row.athlete_id === fixtures.ids.athletes.maya);
    check('quick capture: no full last name anywhere', !JSON.stringify(row).includes('Hernandez'));
  }
  const notice = await page.locator('[role="status"]').first().textContent().catch(() => '');
  check('quick capture: success notice shown', /capture saved/i.test(notice || ''));
  const captured = await page.getByTestId('captured-results').locator('li').count();
  check('development: captured results include the new capture', captured >= 3, `${captured} rows`);

  await tap(page.getByTestId('open-quick-capture'));
  check('quick capture: yuko chip is offered', await page.getByTestId('add-yuko').isVisible());
  await tap(page.getByTestId('result-loss'));
  await tap(page.getByTestId('add-yuko'));
  await tap(page.getByTestId('add-wazari'));
  await tap(page.getByTestId('recipient-1'));
  const mixedSummary = await page.getByTestId('capture-summary').textContent();
  check(
    'quick capture: mixed recipients in summary',
    /Loss · 1\. Yuko \(them\) · 2\. Waza-ari \(us\)/.test(mixedSummary || ''),
    mixedSummary || '',
  );
  await tap(save);
  await page.waitForTimeout(600);
  const mixedWrite = [...mock.writes].reverse().find((w) => w.table === 'opponent_notes' && w.method === 'POST');
  const mixedRow = mixedWrite?.rows?.[0];
  check(
    'quick capture: mixed write stores both recipients',
    mixedRow?.score_events?.[0]?.recipient === 'them' && mixedRow?.score_events?.[1]?.recipient === 'us' && mixedRow?.score_flavor === 'waza_ari',
    JSON.stringify(mixedRow?.score_events),
  );

  const editBtn = page.getByTestId(`edit-captured-${mixedRow?.id}`).first();
  const editVisible = await editBtn.isVisible().catch(() => false);
  check('quick capture: edit control on a saved capture', editVisible);
  if (editVisible) {
    await tap(editBtn);
    check('quick capture: edit mode heading', /edit capture/i.test((await page.locator('#quick-capture-title').textContent()) || ''));
    const seeded = await page.getByTestId('capture-summary').textContent();
    check('quick capture: edit seeds the existing sequence', /Yuko \(them\)/.test(seeded || ''), seeded || '');
    await tap(page.getByTestId('add-ippon'));
    await tap(save);
    await page.waitForTimeout(600);
    const patch = [...mock.writes].reverse().find((w) => w.table === 'opponent_notes' && w.method === 'PATCH');
    check('quick capture: edit PATCHes opponent_notes', Boolean(patch));
    check(
      'quick capture: edit persists result, flavor and events',
      patch?.patch?.result === 'loss' &&
        patch?.patch?.score_flavor === 'ippon' &&
        Array.isArray(patch?.patch?.score_events) &&
        patch.patch.score_events.length === 3 &&
        patch.patch.score_events[2].eventType === 'ippon' &&
        patch.patch.score_events[2].recipient === 'them',
      JSON.stringify(patch?.patch),
    );
    const updatedNotice = await page.locator('[role="status"]').first().textContent().catch(() => '');
    check('quick capture: update notice shown', /capture updated/i.test(updatedNotice || ''), updatedNotice || '');
  }
});

// 3b. Technique per score: nested jsonb, category default, edit, legacy rows.
await withApp({ viewport: VIEWPORTS.phone, label: 'score technique' }, async ({ page, mock, fixtures }) => {
  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  const body = await page.locator('main').innerText();
  check(
    'score technique: legacy capture without technique still renders',
    /Legacy K\./.test(body) && /Win · 1\. Ippon \(us\)/.test(body) && !/Win · 1\. Ippon \(us\) via/.test(body),
    /Legacy K\./.test(body) ? 'Legacy K. + Ippon (us) without via' : 'Legacy K. missing from page',
  );
  check('score technique: legacy flat techniqueId still shows the name', /Win · 1\. Ippon via Seoi-nage/.test(body));

  let taps = 0;
  const tap = async (locator) => { await locator.click(); taps += 1; await page.waitForTimeout(150); };
  await tap(page.getByTestId('open-quick-capture'));
  await tap(page.getByTestId('result-win'));
  await tap(page.getByTestId('add-wazari'));
  const search = page.getByTestId('technique-search');
  await search.waitFor({ state: 'visible', timeout: 8000 });
  await search.fill('seoi-nage');
  await page.getByRole('option', { name: /^Seoi-nage$/ }).click();
  await page.waitForTimeout(200);
  const afterThrow = await page.getByTestId('capture-summary').textContent();
  check('score technique: waza-ari us via seoi-nage on the chip', /Waza-ari \(us\) via Seoi-nage/.test(afterThrow || ''), afterThrow || '');

  await tap(page.getByTestId('add-yuko'));
  await tap(page.getByTestId('recipient-1'));
  await tap(page.getByTestId('score-cat-osaekomi'));
  await page.getByRole('option', { name: /^Kesa-gatame$/ }).waitFor({ state: 'visible', timeout: 8000 });
  await tap(page.getByRole('option', { name: /^Kesa-gatame$/ }));
  const mixedSummary = await page.getByTestId('capture-summary').textContent();
  check(
    'score technique: yuko them via pin on the chip',
    /Waza-ari \(us\) via Seoi-nage/.test(mixedSummary || '') && /Yuko \(them\) via Kesa-gatame/.test(mixedSummary || ''),
    mixedSummary || '',
  );
  await tap(page.getByTestId('save-capture'));
  await page.waitForTimeout(600);
  const write = [...mock.writes].reverse().find((w) => w.table === 'opponent_notes' && w.method === 'POST');
  const row = write?.rows?.[0];
  const seoi = fixtures.techniques.find((t) => t.name === 'Seoi-nage');
  const kesa = fixtures.techniques.find((t) => t.name === 'Kesa-gatame');
  check(
    'score technique: write stores nested technique objects',
    row?.score_events?.[0]?.technique?.name === 'Seoi-nage' &&
      row?.score_events?.[0]?.technique?.category === 'nage' &&
      row?.score_events?.[0]?.technique?.id === seoi?.id &&
      row?.score_events?.[0]?.recipient === 'us' &&
      row?.score_events?.[1]?.technique?.name === 'Kesa-gatame' &&
      row?.score_events?.[1]?.technique?.category === 'osaekomi' &&
      row?.score_events?.[1]?.technique?.id === kesa?.id &&
      row?.score_events?.[1]?.recipient === 'them' &&
      !('techniqueId' in (row?.score_events?.[0] ?? {})) &&
      !('techniqueLabel' in (row?.score_events?.[0] ?? {})),
    JSON.stringify(row?.score_events),
  );

  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  const reloaded = await page.locator('main').innerText();
  check('score technique: persisted after reload', /Waza-ari \(us\) via Seoi-nage/.test(reloaded) && /Yuko \(them\) via Kesa-gatame/.test(reloaded));

  const editBtn = page.getByTestId(`edit-captured-${row?.id}`).first();
  check('score technique: edit control on technique capture', await editBtn.isVisible().catch(() => false));
  await tap(editBtn);
  check('score technique: edit seeds techniques', /Seoi-nage/.test((await page.getByTestId('capture-summary').textContent()) || ''));
  await tap(page.getByTestId('how-0'));
  const editSearch = page.getByTestId('technique-search');
  await editSearch.waitFor({ state: 'visible', timeout: 8000 });
  await editSearch.fill('uchi-mata');
  await page.getByRole('option', { name: /^Uchi-mata$/ }).click();
  await page.waitForTimeout(200);
  await tap(page.getByTestId('save-capture'));
  await page.waitForTimeout(600);
  const patch = [...mock.writes].reverse().find((w) => w.table === 'opponent_notes' && w.method === 'PATCH');
  check(
    'score technique: edit persists the changed technique',
    patch?.patch?.score_events?.[0]?.technique?.name === 'Uchi-mata' &&
      patch?.patch?.score_events?.[0]?.technique?.category === 'nage' &&
      patch?.patch?.score_events?.[1]?.technique?.name === 'Kesa-gatame',
    JSON.stringify(patch?.patch?.score_events),
  );
  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  const afterEdit = await page.locator('main').innerText();
  check('score technique: edited technique survives reload', /Waza-ari \(us\) via Uchi-mata/.test(afterEdit) && /Yuko \(them\) via Kesa-gatame/.test(afterEdit));
  check('privacy: technique capture still uses first name + last initial', /Maya H\./.test(afterEdit) && !/Hernandez/.test(afterEdit));
});

async function pickSeoiNage(page) {
  const recent = page.getByTestId('recent-techniques').getByRole('option', { name: /^Seoi-nage$/ });
  if (await recent.isVisible().catch(() => false)) {
    await recent.click();
    await page.waitForTimeout(150);
    return;
  }
  const search = page.getByTestId('technique-search');
  await search.waitFor({ state: 'visible', timeout: 8000 });
  await search.fill('seoi-nage');
  await page.getByRole('option', { name: /^Seoi-nage$/ }).click();
  await page.waitForTimeout(150);
}

// 3c. Throw attempts + success rate (nage scores / attempts+scores).
await withApp({ viewport: VIEWPORTS.phone, label: 'throw attempts' }, async ({ page, mock, fixtures }) => {
  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  let taps = 0;
  const tap = async (locator) => { await locator.click(); taps += 1; await page.waitForTimeout(150); };
  await tap(page.getByTestId('open-quick-capture'));
  check('throw attempts: Attempt chip is offered', await page.getByTestId('add-attempt').isVisible());
  await tap(page.getByTestId('result-win'));
  for (let i = 0; i < 3; i += 1) {
    await tap(page.getByTestId('add-attempt'));
    await pickSeoiNage(page);
  }
  await tap(page.getByTestId('add-wazari'));
  await pickSeoiNage(page);
  const summary = await page.getByTestId('capture-summary').textContent();
  check(
    'throw attempts: summary lists three attempts then waza-ari',
    /Attempt \(us\) via Seoi-nage/.test(summary || '') && /Waza-ari \(us\) via Seoi-nage/.test(summary || ''),
    summary || '',
  );
  const attemptRow = page.getByTestId('event-row-0');
  check('throw attempts: attempt row is muted', await attemptRow.evaluate((el) => el.querySelector('.text-muted') !== null));
  await tap(page.getByTestId('save-capture'));
  await page.waitForTimeout(600);
  const write = [...mock.writes].reverse().find((w) => w.table === 'opponent_notes' && w.method === 'POST');
  const row = write?.rows?.[0];
  const seoi = fixtures.techniques.find((t) => t.name === 'Seoi-nage');
  check(
    'throw attempts: write stores three attempts and one nage score',
    row?.score_events?.filter((e) => e.eventType === 'attempt').length === 3 &&
      row?.score_events?.[3]?.eventType === 'wazari' &&
      row?.score_events?.every((e) => e.recipient === 'us' && e.technique?.name === 'Seoi-nage' && e.technique?.category === 'nage') &&
      row?.score_events?.[0]?.technique?.id === seoi?.id &&
      row?.score_flavor === 'waza_ari',
    JSON.stringify(row?.score_events),
  );

  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  const rates = page.getByTestId('throw-rates');
  check('throw attempts: coach sees throw rates after reload', await rates.count() === 1);
  const rateText = await rates.innerText();
  check(
    'throw attempts: Seoi-nage 1/4 = 25% with n=4',
    /Seoi-nage/.test(rateText) && /1\/4/.test(rateText) && /25%/.test(rateText) && /n=4/.test(rateText),
    rateText,
  );

  const editBtn = page.getByTestId(`edit-captured-${row?.id}`).first();
  await tap(editBtn);
  check('throw attempts: edit-capture seeds muted attempts', await page.getByTestId('event-row-0').getAttribute('data-event-type') === 'attempt');
  check('throw attempts: edit heading', /edit capture/i.test((await page.locator('#quick-capture-title').textContent()) || ''));

  await goto(page, '/opponents');
  const opponentText = await page.locator('main').innerText();
  check(
    'throw attempts: opponent scouting shows their nage rate',
    /Uchi-mata/.test(opponentText) && /1\/3/.test(opponentText) && /n=3/.test(opponentText),
    opponentText.includes('Sarah') ? 'Sarah card includes Uchi-mata 1/3' : 'Sarah/Uchi-mata missing',
  );
});

// 3d. Family must not see throw rates even when nage sample is large enough.
await withApp({
  viewport: VIEWPORTS.phone,
  label: 'family throw rates',
  user: MOCK_FAMILY_USER,
  redirectTo: '/athletes/00000000-0000-4000-8000-000000000010',
}, async ({ page, mock, fixtures }) => {
  const seoi = fixtures.techniques.find((t) => t.name === 'Seoi-nage');
  mock.db.opponent_notes.push({
    id: '00000000-0000-4000-8000-000000000080',
    athlete_id: fixtures.ids.athletes.maya,
    opponent_id: null,
    opponent_label: 'Rate K.',
    club: null,
    notes: 'Win · attempts',
    tournament: null,
    stance: null,
    kumi_kata: '',
    ne_waza: '',
    common_counters: '',
    weight_class: '',
    age_division: '',
    technique_ids: seoi ? [seoi.id] : [],
    tokui_technique_ids: [],
    newaza_technique_ids: [],
    result: 'win',
    score_flavor: 'waza_ari',
    score_events: [
      { eventType: 'attempt', sequenceOrder: 1, recipient: 'us', technique: { id: seoi?.id, name: 'Seoi-nage', category: 'nage' } },
      { eventType: 'attempt', sequenceOrder: 2, recipient: 'us', technique: { id: seoi?.id, name: 'Seoi-nage', category: 'nage' } },
      { eventType: 'attempt', sequenceOrder: 3, recipient: 'us', technique: { id: seoi?.id, name: 'Seoi-nage', category: 'nage' } },
      { eventType: 'wazari', sequenceOrder: 4, recipient: 'us', technique: { id: seoi?.id, name: 'Seoi-nage', category: 'nage' } },
    ],
    created_by: fixtures.coachIds.dev,
    created_at: new Date().toISOString(),
  });
  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  check('family: athlete profile loaded', /Maya H\./.test((await page.locator('main').innerText().catch(() => '')) || ''));
  check('family: throw rates hidden', (await page.getByTestId('throw-rates').count()) === 0);
  const familyText = await page.locator('main').innerText();
  check('family: no throw success copy', !/Throw success/i.test(familyText) && !/1\/4 = 25%/.test(familyText), familyText.slice(0, 200));
});

// 4. Athlete creation: minimal path and payload shape.
await withApp({ viewport: VIEWPORTS.phone, label: 'add athlete' }, async ({ page, mock }) => {
  await goto(page, '/');
  await page.getByRole('button', { name: /add athlete/i }).first().click();
  const visibleInputs = await page.locator('form input:visible, form select:visible, form textarea:visible').count();
  check('add athlete: 3 fields visible before disclosure', visibleInputs === 3, `${visibleInputs} visible`);
  await page.getByLabel(/first name/i).fill('Aiko');
  await page.getByLabel(/last initial/i).fill('Nakamura');
  const saveBtn = page.getByRole('button', { name: /^add athlete$/i }).last();
  const inViewport = await saveBtn.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  check('add athlete: save button in viewport on phone', inViewport);
  await saveBtn.click();
  await page.waitForTimeout(600);
  const write = mock.writes.find((w) => w.table === 'athletes' && w.method === 'POST' && w.rows[0]?.first_name === 'Aiko');
  check('add athlete: inserted athletes row', Boolean(write));
  if (write) {
    const row = write.rows[0];
    check('add athlete: last initial is one letter', row.last_initial === 'N');
    check('add athlete: technique arrays present', Array.isArray(row.technique_ids) && Array.isArray(row.tokui_technique_ids) && Array.isArray(row.newaza_technique_ids));
  }
  await page.getByRole('button', { name: /add athlete/i }).first().click();
  await page.getByRole('button', { name: /^add athlete$/i }).last().click();
  const errors = await page.locator('.field-error').count();
  check('add athlete: inline validation errors on empty submit', errors === 2, `${errors} errors`);
});

// 5. Tournament day: selection save + assign board update shape + auto-assign unchanged behaviour.
await withApp({ viewport: VIEWPORTS.tablet, label: 'tournament day' }, async ({ page, mock, fixtures }) => {
  await goto(page, '/tournament-day');
  const cards = page.locator('[role="checkbox"]');
  check('tournament day: selection cards are checkboxes', (await cards.count()) === 6);
  const checked = await page.locator('[role="checkbox"][aria-checked="true"]').count();
  check('tournament day: saved entries pre-checked', checked === 4, `${checked}`);
  await page.locator('[role="checkbox"][aria-checked="false"]').first().click();
  await page.getByTestId('save-selection').click();
  await page.waitForTimeout(600);
  const inserts = mock.writes.filter((w) => w.table === 'tournament_day_entries' && w.method === 'POST');
  check('tournament day: save re-inserts entries for the day', inserts.length > 0 && inserts.at(-1).rows.length === 5, `${inserts.at(-1)?.rows.length ?? 0} rows`);
  const rosterRows = await page.locator('section[aria-labelledby="today-roster-heading"] li').count();
  check('tournament day: roster shows 5 after save', rosterRows === 5, `${rosterRows}`);

  await goto(page, '/tournament-day/assign');
  await page.getByTestId('auto-assign').click();
  await page.waitForTimeout(300);
  const dialog = page.getByRole('dialog');
  check('assign: auto-assign preview is a dialog', await dialog.isVisible());
  await page.getByTestId('apply-auto-assign').click();
  await page.waitForTimeout(800);
  const patches = mock.writes.filter((w) => w.table === 'tournament_day_entries' && w.method === 'PATCH');
  check('assign: apply issues PATCH updates with assigned_coach_id only', patches.length > 0 && patches.every((p) => Object.keys(p.patch).every((k) => k === 'assigned_coach_id')), `${patches.length} patches`);
  const lucas = mock.db.tournament_day_entries.find((e) => e.athlete_id === fixtures.ids.athletes.lucas);
  check('assign: exclusive preferred coach honoured for Lucas', lucas?.assigned_coach_id === fixtures.coachIds.amy);
  const maya = mock.db.tournament_day_entries.find((e) => e.athlete_id === fixtures.ids.athletes.maya);
  check('assign: locked assignment untouched for Maya', maya?.assigned_coach_id === fixtures.coachIds.jorge);
});

// 6. Keyboard: focus ring visible on tab, dialog Escape closes and returns focus.
await withApp({ viewport: VIEWPORTS.desktop, label: 'keyboard' }, async ({ page, fixtures }) => {
  await goto(page, '/');
  await page.keyboard.press('Tab'); // logo link
  await page.keyboard.press('Tab'); // first header nav link
  await page.waitForTimeout(250); // let style recalc settle before reading computed values
  const ring = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { tag: el.tagName, cls: el.className, outline: s.outlineStyle, width: s.outlineWidth };
  });
  check('keyboard: focused element has a visible outline', ring && ring.outline !== 'none' && ring.width !== '0px', JSON.stringify(ring));
  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  const del = page.getByRole('button', { name: /delete note about/i }).first();
  await del.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  check('keyboard: confirm dialog opens', await page.getByRole('dialog').isVisible());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check('keyboard: Escape closes dialog', (await page.getByRole('dialog').count()) === 0);
  const back = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || '');
  check('keyboard: focus returns to opener', /delete note about/i.test(back), back);
});

// 7. Empty database: existing behaviour auto-seeds the two sample athletes (ensureMockDemoData),
//    so the roster is never empty; the seeded athletes must be visibly marked as samples.
await withApp({ viewport: VIEWPORTS.phone, empty: true, label: 'empty' }, async ({ page, mock, fixtures }) => {
  await goto(page, '/');
  const seeded = mock.writes.filter((w) => w.table === 'athletes' && w.method === 'POST').flatMap((w) => w.rows);
  check('empty db: sample athletes auto-seeded (unchanged behaviour)', seeded.length === 2, `${seeded.length} inserted`);
  const cards = await page.locator('.card-grid .card').count();
  check('empty db: roster shows the seeded sample athletes', cards === 2, `${cards} cards`);
  const demo = seeded.find((r) => r.first_name === 'Demo');
  if (demo) {
    await goto(page, `/athletes/${demo.id}`);
    check('empty db: sample athlete is tagged on its profile', (await page.locator('.sample-tag').count()) >= 1);
  }
  // Search with no match still reaches an empty state.
  await goto(page, '/');
  await page.locator('#roster-search').fill('zzz');
  check('roster: no-match empty state rendered', (await page.locator('.empty-state').count()) === 1);
});

// 8. Privacy: no full last names or photos rendered anywhere in the athlete page.
await withApp({ viewport: VIEWPORTS.phone, label: 'privacy' }, async ({ page, fixtures }) => {
  await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
  const imgs = await page.locator('main img').count();
  check('privacy: no photos on athlete page', imgs === 0, `${imgs} images`);
  const text = await page.locator('main').innerText();
  check('privacy: athlete rendered as First L.', /Maya H\./.test(text) && !/Hernandez/.test(text));
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('Failures:');
  failed.forEach((f) => console.log(` - ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
  process.exit(1);
}
