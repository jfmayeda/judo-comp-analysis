// Proof for throw attempts + success rate.
//   node scripts/ui-smoke/throw-attempts.mjs --out <dir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, openApp, goto, VIEWPORTS, MOCK_FAMILY_USER } from './harness.mjs';

const args = process.argv.slice(2);
const outDir = args[args.indexOf('--out') + 1] || 'docs/screenshots/throw-attempts';
mkdirSync(outDir, { recursive: true });

const browser = await launch();
const { page, mock, fixtures } = await openApp(browser, { viewport: VIEWPORTS.phone });
const shot = async (name) => {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log('wrote', path);
};

async function pickSeoiNage() {
  const recent = page.getByTestId('recent-techniques').getByRole('option', { name: /^Seoi-nage$/ });
  if (await recent.isVisible().catch(() => false)) {
    await recent.click();
    await page.waitForTimeout(200);
    return;
  }
  const search = page.getByTestId('technique-search');
  await search.waitFor({ state: 'visible', timeout: 8000 });
  await search.fill('seoi-nage');
  await page.getByRole('option', { name: /^Seoi-nage$/ }).click();
  await page.waitForTimeout(200);
}

await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
await page.getByTestId('open-quick-capture').click();
await page.getByTestId('result-win').click();
await page.getByTestId('add-attempt').click();
await pickSeoiNage();
await shot('01-first-attempt-seoi-nage');
await page.getByTestId('add-attempt').click();
await pickSeoiNage();
await page.getByTestId('add-attempt').click();
await pickSeoiNage();
await page.getByTestId('add-wazari').click();
await pickSeoiNage();
await shot('02-three-attempts-and-waza-ari');
await page.getByTestId('save-capture').click();
await page.waitForTimeout(600);
await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
const rates = page.getByTestId('throw-rates');
await rates.waitFor({ state: 'visible', timeout: 8000 });
await rates.scrollIntoViewIfNeeded();
await shot('03-seoi-nage-1-of-4-25-percent');
await goto(page, '/opponents');
await page.getByText('Sarah M.').first().scrollIntoViewIfNeeded();
await shot('04-opponent-scouting-uchi-mata');

await page.context.close();

const family = await openApp(browser, {
  viewport: VIEWPORTS.phone,
  user: MOCK_FAMILY_USER,
  redirectTo: `/athletes/${fixtures.ids.athletes.maya}`,
});
const seoi = family.fixtures.techniques.find((t) => t.name === 'Seoi-nage');
family.mock.db.opponent_notes.push({
  id: '00000000-0000-4000-8000-000000000080',
  athlete_id: family.fixtures.ids.athletes.maya,
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
  created_by: family.fixtures.coachIds.dev,
  created_at: new Date().toISOString(),
});
await goto(family.page, `/athletes/${family.fixtures.ids.athletes.maya}`);
await family.page.waitForTimeout(400);
const familyPath = join(outDir, '05-family-no-throw-rates.png');
await family.page.screenshot({ path: familyPath, fullPage: true });
console.log('wrote', familyPath);
await family.context.close();
await browser.close();
console.log('throw-attempts screenshots done');
