// In-memory PostgREST/GoTrue stand-in for the UI smoke harness.
// It is wired through Playwright `page.route()` so the app code and its auth
// boundaries are untouched: the browser still "logs in", still sends a bearer
// token, and the mock answers exactly the REST shapes lib/supabase-store.ts uses.
import { randomUUID } from 'node:crypto';

export const MOCK_USER = {
  id: '00000000-0000-4000-8000-000000000003',
  email: 'coach.dev@svjudo.test',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00.000Z',
};

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function fakeJwt(user, exp) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp, iat: exp - 3600 * 24 * 30 });
  return `${header}.${payload}.local-mock-signature`;
}

export function makeSession(user = MOCK_USER) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  return {
    access_token: fakeJwt(user, exp),
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 30,
    expires_at: exp,
    refresh_token: 'local-mock-refresh',
    user,
  };
}

function parseFilterValue(raw) {
  // raw like "eq.abc", "in.(a,b)", "ilike.*x*", "is.null"
  const dot = raw.indexOf('.');
  const op = raw.slice(0, dot);
  const val = raw.slice(dot + 1);
  return { op, val };
}

function matches(row, col, op, val) {
  const v = row[col];
  switch (op) {
    case 'eq': return String(v) === val;
    case 'neq': return String(v) !== val;
    case 'in': {
      const list = val.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/^"|"$/g, ''));
      return list.includes(String(v));
    }
    case 'is': return val === 'null' ? v == null : String(v) === val;
    case 'ilike': {
      const re = new RegExp('^' + val.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*') + '$', 'i');
      return re.test(String(v ?? ''));
    }
    case 'gte': return String(v) >= val;
    case 'lte': return String(v) <= val;
    case 'gt': return String(v) > val;
    case 'lt': return String(v) < val;
    default: return true;
  }
}

function applyQuery(rows, params) {
  let out = rows;
  let order = null;
  let limit = null;
  for (const [key, raw] of params) {
    if (key === 'select' || key === 'offset') continue;
    if (key === 'order') { order = raw; continue; }
    if (key === 'limit') { limit = Number(raw); continue; }
    if (key === 'or') {
      const clauses = raw.replace(/^\(|\)$/g, '').split(',').map((c) => {
        const [col, ...rest] = c.split('.');
        return { col, ...parseFilterValue(rest.join('.')) };
      });
      out = out.filter((row) => clauses.some((c) => matches(row, c.col, c.op, c.val)));
      continue;
    }
    const { op, val } = parseFilterValue(raw);
    out = out.filter((row) => matches(row, key, op, val));
  }
  if (order) {
    const [col, dir] = order.split('.');
    const desc = dir === 'desc';
    out = [...out].sort((a, b) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (desc ? -1 : 1);
    });
  }
  if (limit != null) out = out.slice(0, limit);
  return out;
}

export function createSupabaseMock(fixtures, { user = MOCK_USER, log = () => {} } = {}) {
  const db = {
    techniques: [...fixtures.techniques],
    coach_allowlist: [...fixtures.coach_allowlist],
    athletes: [...fixtures.athletes],
    opponents: [...fixtures.opponents],
    opponent_notes: [...fixtures.opponent_notes],
    promotions: [...fixtures.promotions],
    tournament_days: [...fixtures.tournament_days],
    tournament_day_entries: [...fixtures.tournament_day_entries],
  };
  const writes = [];

  const cascade = (table, row) => {
    if (table === 'athletes') {
      db.opponent_notes = db.opponent_notes.filter((n) => n.athlete_id !== row.id);
      db.promotions = db.promotions.filter((p) => p.athlete_id !== row.id);
      db.tournament_day_entries = db.tournament_day_entries.filter((e) => e.athlete_id !== row.id);
    }
    if (table === 'opponents') {
      db.opponent_notes = db.opponent_notes.map((n) => (n.opponent_id === row.id ? { ...n, opponent_id: null } : n));
    }
    if (table === 'tournament_days') {
      db.tournament_day_entries = db.tournament_day_entries.filter((e) => e.tournament_day_id !== row.id);
    }
  };

  const json = (route, status, body, extraHeaders = {}) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', ...extraHeaders },
      body: body === undefined ? '' : JSON.stringify(body),
    });

  async function handle(route) {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
          'access-control-allow-headers': '*',
        },
      });
    }

    // ---- GoTrue ----
    if (url.pathname.startsWith('/auth/v1/')) {
      const tail = url.pathname.replace('/auth/v1/', '');
      if (tail === 'token') return json(route, 200, makeSession(user));
      if (tail === 'user') return json(route, 200, user);
      if (tail === 'logout') return json(route, 204, undefined);
      if (tail === 'otp' || tail === 'magiclink') return json(route, 200, {});
      log(`auth unhandled ${method} ${tail}`);
      return json(route, 200, {});
    }

    // ---- PostgREST RPC ----
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = url.pathname.replace('/rest/v1/rpc/', '');
      if (fn === 'is_allowlisted_coach') return json(route, 200, true);
      if (fn === 'is_admin_coach') return json(route, 200, db.coach_allowlist.some((c) => c.email === user.email && c.is_admin));
      log(`rpc unhandled ${fn}`);
      return json(route, 200, null);
    }

    if (!url.pathname.startsWith('/rest/v1/')) {
      log(`unhandled ${method} ${url.pathname}`);
      return json(route, 404, { message: 'not mocked' });
    }

    const table = url.pathname.replace('/rest/v1/', '');
    if (!(table in db)) {
      log(`unknown table ${table}`);
      return json(route, 404, { message: `no table ${table}`, code: 'PGRST205' });
    }
    const headers = req.headers();
    const wantsObject = (headers['accept'] || '').includes('vnd.pgrst.object');
    const prefer = headers['prefer'] || '';
    const params = [...url.searchParams.entries()];

    const respondRows = (rows, status = 200) => {
      if (wantsObject) {
        if (rows.length !== 1) {
          return json(route, 406, { code: 'PGRST116', message: `JSON object requested, multiple (or no) rows returned`, details: `Results contain ${rows.length} rows` });
        }
        return json(route, status, rows[0]);
      }
      return json(route, status, rows);
    };

    if (method === 'GET' || method === 'HEAD') {
      return respondRows(applyQuery(db[table], params));
    }

    if (method === 'POST') {
      const body = req.postDataJSON();
      const list = Array.isArray(body) ? body : [body];
      const now = new Date().toISOString();
      const inserted = list.map((row) => ({ id: randomUUID(), created_at: now, updated_at: now, ...row }));
      db[table].push(...inserted);
      writes.push({ table, method, rows: inserted });
      if (prefer.includes('return=representation')) return respondRows(inserted, 201);
      return json(route, 201, undefined);
    }

    if (method === 'PATCH') {
      const patch = req.postDataJSON();
      const targets = applyQuery(db[table], params);
      const now = new Date().toISOString();
      const updated = [];
      db[table] = db[table].map((row) => {
        if (!targets.includes(row)) return row;
        const next = { ...row, ...patch, updated_at: now };
        updated.push(next);
        return next;
      });
      writes.push({ table, method, rows: updated, patch });
      if (prefer.includes('return=representation')) return respondRows(updated);
      return json(route, 204, undefined);
    }

    if (method === 'DELETE') {
      const targets = applyQuery(db[table], params);
      db[table] = db[table].filter((row) => !targets.includes(row));
      targets.forEach((row) => cascade(table, row));
      writes.push({ table, method, rows: targets });
      if (prefer.includes('return=representation')) return respondRows(targets);
      return json(route, 204, undefined);
    }

    log(`unhandled ${method} ${table}`);
    return json(route, 405, { message: 'method not mocked' });
  }

  return { db, writes, handle, user };
}

/** Attach the mock to a Playwright page/context. */
export async function installSupabaseMock(target, mock, supabaseUrl) {
  const origin = new URL(supabaseUrl).origin;
  await target.route(`${origin}/**`, (route) => mock.handle(route));
}
