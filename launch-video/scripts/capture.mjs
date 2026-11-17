// Captures real app screens for the launch video using the repo's own
// Supabase mock harness (demo fixtures only, no network data).
//   1. npm run dev   (in the repo root, any NEXT_PUBLIC_SUPABASE_ANON_KEY)
//   2. node launch-video/scripts/capture.mjs
// Writes PNGs plus rects.json (element boxes in image pixels) to launch-video/public/shots.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { buildFixtures } from '../../scripts/ui-smoke/fixtures.mjs';
import { createSupabaseMock, installSupabaseMock } from '../../scripts/ui-smoke/supabase-mock.mjs';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = 'https://wnwcxousneqhzlkdzeku.supabase.co';
const OUT = new URL('../public/shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const rects = {};

const browser = await chromium.launch();

async function open(viewport, scale, { login = true } = {}) {
  const fixtures = buildFixtures({});
  const mock = createSupabaseMock(fixtures, { log: () => {} });
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  await installSupabaseMock(context, mock, SUPABASE_URL);
  await context.addInitScript(() => {
    const hide = () => {
      const s = document.createElement('style');
      s.textContent = 'nextjs-portal{display:none!important}';
      document.head.appendChild(s);
    };
    if (document.head) hide(); else document.addEventListener('DOMContentLoaded', hide);
  });
  const page = await context.newPage();
  if (login) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').first().fill(mock.user.email);
    await page.locator('input[type="password"]').first().fill('local-mock-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 });
    await page.waitForLoadState('networkidle');
  }
  return { page, context, fixtures, scale };
}

async function go(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}

// Box of a locator in full-page image pixels.
async function box(ctx, locator) {
  const b = await locator.first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
  });
  return { x: b.x * ctx.scale, y: b.y * ctx.scale, w: b.w * ctx.scale, h: b.h * ctx.scale };
}

async function shot(ctx, name, { fullPage = false } = {}) {
  await ctx.page.waitForTimeout(350);
  await ctx.page.screenshot({ path: join(OUT, `${name}.png`), fullPage });
  console.log('captured', name);
}

const clickBtn = async (page, name) => {
  const btn = page.getByRole('button', { name }).first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(450);
};

// Login (navy field)
{
  const ctx = await open(DESKTOP, 2, { login: false });
  await go(ctx.page, '/login');
  await shot(ctx, 'login');
  await ctx.context.close();
}

// Roster
{
  const ctx = await open(DESKTOP, 2);
  await go(ctx.page, '/');
  const maya = ctx.page.getByRole('link').filter({ hasText: 'Maya H.' });
  rects.roster = { maya: await box(ctx, maya), search: await box(ctx, ctx.page.locator('input[type="search"]')) };
  await shot(ctx, 'roster');
  await ctx.context.close();
}

// Athlete profile (full page) + intel
{
  const ctx = await open(DESKTOP, 2);
  await go(ctx.page, `/athletes/${ctx.fixtures.ids.athletes.maya}`);
  const section = (re) => ctx.page.locator('section').filter({ has: ctx.page.getByRole('heading', { name: re }) }).first();
  rects.athlete = {
    today: await box(ctx, section(/^today/i)),
    focus: await box(ctx, section(/development focus/i)),
    techniques: await box(ctx, section(/^techniques/i)),
    intel: await box(ctx, section(/opponent intel/i)),
    development: await box(ctx, section(/^development$/i)),
  };
  await shot(ctx, 'athlete', { fullPage: true });
  await ctx.context.close();
}

// Quick capture on a phone: open → Win → Ippon → saved
{
  const ctx = await open(PHONE, 3);
  const { page } = ctx;
  await go(page, `/athletes/${ctx.fixtures.ids.athletes.maya}`);
  rects.phone = { quick: await box(ctx, page.getByRole('button', { name: /quick capture/i })) };
  await shot(ctx, 'phone-athlete');
  await clickBtn(page, /quick capture|capture match|log match/i);
  const form = page.locator('#quick-capture');
  await form.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 64));
  await page.waitForTimeout(400);
  const vbox = async (loc) => {
    const b = await loc.first().evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    return { x: b.x * 3, y: b.y * 3, w: b.w * 3, h: b.h * 3 };
  };
  rects.capture = {
    win: await vbox(page.getByRole('button', { name: /^win$/i })),
    ippon: await vbox(page.getByRole('button', { name: /^ippon$/i })),
  };
  await shot(ctx, 'capture-0');
  await page.getByRole('button', { name: /^win$/i }).first().click();
  await page.waitForTimeout(300);
  await shot(ctx, 'capture-1');
  await page.getByRole('button', { name: /^ippon$/i }).first().click();
  await page.waitForTimeout(300);
  rects.capture.save = await vbox(page.getByRole('button', { name: /save capture/i }));
  await shot(ctx, 'capture-2');
  await page.getByRole('button', { name: /save capture/i }).first().click();
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(ctx, 'capture-saved');
  await ctx.context.close();
}

// Tournament day
{
  const ctx = await open(DESKTOP, 2);
  await go(ctx.page, '/tournament-day');
  rects.today = {
    competing: await box(ctx, ctx.page.locator('section, div.card, .card').filter({ hasText: /competing today/i }).last()),
    offline: await box(ctx, ctx.page.getByRole('button', { name: /cache for offline/i })),
  };
  await shot(ctx, 'tournament-day');
  await ctx.page.getByRole('button', { name: /cache for offline/i }).first().click();
  await ctx.page.waitForTimeout(2500);
  await ctx.page.evaluate(() => window.scrollTo(0, 0));
  await shot(ctx, 'tournament-day-cached');
  await ctx.context.close();
}

// Auto-assign
{
  const ctx = await open(DESKTOP, 2);
  await go(ctx.page, '/tournament-day/assign');
  rects.assign = { button: await box(ctx, ctx.page.getByRole('button', { name: /auto-?assign/i })) };
  await shot(ctx, 'assign-0');
  await clickBtn(ctx.page, /auto-?assign/i);
  await ctx.page.waitForTimeout(500);
  rects.assign.dialog = await box(ctx, ctx.page.getByRole('dialog'));
  rects.assign.apply = await box(ctx, ctx.page.getByRole('button', { name: /apply/i }));
  await shot(ctx, 'assign-1');
  await clickBtn(ctx.page, /apply \d+ assignment/i);
  await ctx.page.waitForTimeout(900);
  await ctx.page.evaluate(() => window.scrollTo(0, 0));
  await shot(ctx, 'assign-2');
  await ctx.context.close();
}

// Print card + opponents
{
  const ctx = await open(DESKTOP, 2);
  await go(ctx.page, `/athletes/${ctx.fixtures.ids.athletes.maya}/print`);
  const qr = ctx.page.locator('svg').filter({ has: ctx.page.locator('path') });
  const sizes = await qr.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  rects.print = { qr: await box(ctx, qr.nth(sizes.indexOf(Math.max(...sizes)))) };
  await shot(ctx, 'print', { fullPage: true });
  await go(ctx.page, '/opponents');
  await shot(ctx, 'opponents');
  await ctx.context.close();
}

writeFileSync(join(OUT, 'rects.json'), JSON.stringify(rects, null, 2));
console.log(JSON.stringify(rects, null, 2));
await browser.close();
process.exit(0);
