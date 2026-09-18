// Shared browser helpers for the smoke suite and the screenshot script.
import { chromium } from 'playwright';
import { buildFixtures } from './fixtures.mjs';
import { createSupabaseMock, installSupabaseMock } from './supabase-mock.mjs';

export const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnwcxousneqhzlkdzeku.supabase.co';
const EXECUTABLE = process.env.SMOKE_CHROMIUM || (process.platform === 'linux' ? '/opt/pw-browsers/chromium' : undefined);

export const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

export async function launch() {
  try {
    return await chromium.launch({ executablePath: EXECUTABLE });
  } catch {
    return chromium.launch();
  }
}

/**
 * Opens a page with the Supabase mock installed and performs the app's own
 * login flow against the mocked auth endpoint. Returns { page, mock, fixtures, consoleErrors }.
 */
export async function openApp(browser, { viewport = VIEWPORTS.phone, empty = false, login = true } = {}) {
  const fixtures = buildFixtures({ empty });
  const mock = createSupabaseMock(fixtures, { log: (m) => console.warn('[mock]', m) });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await installSupabaseMock(context, mock, SUPABASE_URL);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  if (login) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').first().fill(mock.user.email);
    await page.locator('input[type="password"]').first().fill('local-mock-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  }
  return { page, context, mock, fixtures, consoleErrors };
}

export async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  // let client-side data loads settle
  await page.waitForTimeout(300);
}

export async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
}

/** Returns interactive elements smaller than the touch-target floor. */
export async function smallTouchTargets(page, min = 44) {
  return page.evaluate((floor) => {
    const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=option]';
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || style.visibility === 'hidden') continue;
      if (el.closest('.no-smoke-target')) continue;
      if (el.matches('input[type="checkbox"]')) {
        const row = el.closest('label');
        if (row && row.getBoundingClientRect().height >= floor - 4) continue;
      }
      if (r.height < floor - 4) {
        out.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40), h: Math.round(r.height), w: Math.round(r.width) });
      }
    }
    return out;
  }, min);
}
