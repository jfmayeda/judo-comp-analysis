// Repeatable screenshot pass over every route in the acceptance matrix at
// phone / tablet / desktop widths, against local demo fixtures.
//   node scripts/ui-smoke/screenshots.mjs --out docs/screenshots/after
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, openApp, goto, VIEWPORTS, hasHorizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const outDir = args[args.indexOf('--out') + 1] || 'docs/screenshots/current';
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const viewportsArg = args.includes('--viewports') ? args[args.indexOf('--viewports') + 1].split(',') : Object.keys(VIEWPORTS);

const click = async (page, name) => {
  const btn = page.getByRole('button', { name }).first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(400);
};

const SCENES = [
  { id: 'login', login: false, path: '/login' },
  { id: 'unauthorized', login: false, path: '/unauthorized' },
  { id: 'roster', path: '/' },
  { id: 'roster-add', path: '/', setup: (p) => click(p, /add athlete/i) },
  { id: 'roster-empty', path: '/', empty: true },
  { id: 'athlete', path: (f) => `/athletes/${f.ids.athletes.maya}` },
  { id: 'athlete-capture', path: (f) => `/athletes/${f.ids.athletes.maya}`, setup: (p) => click(p, /quick capture|capture match|log match/i) },
  { id: 'athlete-capture-filled', path: (f) => `/athletes/${f.ids.athletes.maya}`, setup: async (p) => {
      await click(p, /quick capture|capture match|log match/i);
      await click(p, /^win$/i);
      await click(p, /^ippon$/i);
    } },
  { id: 'athlete-edit', path: (f) => `/athletes/${f.ids.athletes.maya}`, setup: (p) => click(p, /^edit( athlete| profile)?$/i) },
  { id: 'athlete-demo', path: (f) => `/athletes/${f.ids.athletes.demo}` },
  { id: 'athlete-sparse', path: (f) => `/athletes/${f.ids.athletes.kenji}` },
  { id: 'opponents', path: '/opponents' },
  { id: 'tournament-day', path: '/tournament-day' },
  { id: 'assign', path: '/tournament-day/assign' },
  { id: 'assign-preview', path: '/tournament-day/assign', setup: (p) => click(p, /auto-?assign/i) },
  { id: 'invite', path: '/invite' },
  { id: 'design-tokens', path: '/admin/design-tokens' },
  { id: 'print-athlete', path: (f) => `/athletes/${f.ids.athletes.maya}/print` },
  { id: 'print-pack', path: (f) => `/tournament-day/print?athletes=${f.ids.athletes.maya},${f.ids.athletes.lucas}` },
];

const browser = await launch();
mkdirSync(outDir, { recursive: true });
const report = [];

for (const scene of SCENES) {
  if (only && scene.id !== only) continue;
  for (const vpName of viewportsArg) {
    const viewport = VIEWPORTS[vpName];
    const { page, context, fixtures, consoleErrors } = await openApp(browser, { viewport, empty: scene.empty, login: scene.login !== false });
    const path = typeof scene.path === 'function' ? scene.path(fixtures) : scene.path;
    let status = 'ok';
    try {
      await goto(page, path);
      if (scene.setup) await scene.setup(page);
      await page.waitForTimeout(250);
      const overflow = await hasHorizontalOverflow(page);
      const file = join(outDir, `${scene.id}--${vpName}.jpg`);
      await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 80 });
      if (overflow) status = 'HORIZONTAL OVERFLOW';
      report.push({ scene: scene.id, viewport: vpName, status, consoleErrors: consoleErrors.length });
    } catch (err) {
      status = `FAILED: ${String(err.message).split('\n')[0]}`;
      report.push({ scene: scene.id, viewport: vpName, status, consoleErrors: consoleErrors.length });
    }
    await context.close();
  }
}
await browser.close();

console.table(report);
const bad = report.filter((r) => r.status !== 'ok');
console.log(bad.length ? `${bad.length} scene(s) need attention` : 'all scenes captured cleanly');
