// Proof for technique-per-score: drive Quick Capture, screenshot key states.
//   node scripts/ui-smoke/score-technique.mjs --out <dir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, openApp, goto, VIEWPORTS } from './harness.mjs';

const args = process.argv.slice(2);
const outDir = args[args.indexOf('--out') + 1] || 'docs/screenshots/score-technique';
mkdirSync(outDir, { recursive: true });

const browser = await launch();
const { page, mock, fixtures } = await openApp(browser, { viewport: VIEWPORTS.phone });
const shot = async (name) => {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log('wrote', path);
};

await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
await shot('01-legacy-events');

await page.getByTestId('open-quick-capture').click();
await page.getByTestId('result-win').click();
await page.getByTestId('add-wazari').click();
const search = page.getByTestId('technique-search');
await search.waitFor({ state: 'visible', timeout: 8000 });
await search.fill('seoi-nage');
await page.getByRole('option', { name: /^Seoi-nage$/ }).waitFor({ state: 'visible', timeout: 8000 });
await shot('02-search-seoi-nage');
await page.getByRole('option', { name: /^Seoi-nage$/ }).click();
await page.waitForTimeout(200);

await page.getByTestId('add-yuko').click();
await page.getByTestId('recipient-1').click();
await page.getByTestId('score-cat-osaekomi').click();
await page.getByRole('option', { name: /^Kesa-gatame$/ }).waitFor({ state: 'visible', timeout: 8000 });
await shot('03-yuko-pin-list');
await page.getByRole('option', { name: /^Kesa-gatame$/ }).click();
await page.waitForTimeout(200);
await shot('04-ready-to-save');
await page.getByTestId('save-capture').click();
await page.waitForTimeout(600);
await shot('05-saved');

const write = [...mock.writes].reverse().find((w) => w.table === 'opponent_notes' && w.method === 'POST');
if (!write?.rows?.[0]?.id) {
  console.error('save did not write an opponent_notes row');
  process.exit(1);
}

await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
await shot('06-reloaded');
await page.getByTestId(`edit-captured-${write.rows[0].id}`).first().click();
await page.waitForTimeout(400);
await page.getByTestId('how-0').click();
const editSearch = page.getByTestId('technique-search');
await editSearch.waitFor({ state: 'visible', timeout: 8000 });
await editSearch.fill('uchi-mata');
await page.getByRole('option', { name: /^Uchi-mata$/ }).click();
await page.waitForTimeout(200);
await shot('07-edit-technique');
await page.getByTestId('save-capture').click();
await page.waitForTimeout(600);
await goto(page, `/athletes/${fixtures.ids.athletes.maya}`);
await shot('08-edited-persisted');

await browser.close();
console.log('score-technique screenshots done');
