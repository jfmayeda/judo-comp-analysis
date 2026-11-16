import { getSupabaseClient } from './supabase';

export const STAT_KEYS = ['athleticism', 'strength', 'speed', 'technique'] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export type StatEntry = {
  score: number;
  note: string;
};

export type AthleteStats = {
  athleteId: string;
  stats: Record<StatKey, StatEntry>;
  ratedAt: string;
  ratedBy: string;
};

export const STAT_META: Record<StatKey, { label: string; icon128: string; icon256: string }> = {
  athleticism: {
    label: 'Athleticism',
    icon128: '/stats/athleticism-128.webp',
    icon256: '/stats/athleticism-256.webp',
  },
  strength: {
    label: 'Strength',
    icon128: '/stats/strength-128.webp',
    icon256: '/stats/strength-256.webp',
  },
  speed: {
    label: 'Speed',
    icon128: '/stats/speed-128.webp',
    icon256: '/stats/speed-256.webp',
  },
  technique: {
    label: 'Technique',
    icon128: '/stats/technique-128.webp',
    icon256: '/stats/technique-256.webp',
  },
};

export const MOCK_STATS_STORAGE_KEY = 'svj.athleteStats.v1';

const SCORE_MIN = 1;
const SCORE_MAX = 20;

export function isStatKey(value: string): value is StatKey {
  return (STAT_KEYS as readonly string[]).includes(value);
}

export function parseScore(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < SCORE_MIN || n > SCORE_MAX) return null;
  return n;
}

export function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(score: number): string {
  const value = modifier(score);
  return value >= 0 ? `+${value}` : String(value);
}

export function emptyStats(athleteId: string): AthleteStats {
  return {
    athleteId,
    stats: {
      athleticism: { score: 10, note: '' },
      strength: { score: 10, note: '' },
      speed: { score: 10, note: '' },
      technique: { score: 10, note: '' },
    },
    ratedAt: new Date().toISOString(),
    ratedBy: 'Unrated',
  };
}

type DbAthleteStatsRow = {
  athlete_id: unknown;
  athleticism: unknown;
  athleticism_note: unknown;
  strength: unknown;
  strength_note: unknown;
  speed: unknown;
  speed_note: unknown;
  technique: unknown;
  technique_note: unknown;
  rated_at: unknown;
  rated_by_email: unknown;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parseDbRow(row: DbAthleteStatsRow): AthleteStats | null {
  if (typeof row.athlete_id !== 'string' || row.athlete_id.length === 0) return null;
  const athleticism = parseScore(row.athleticism);
  const strength = parseScore(row.strength);
  const speed = parseScore(row.speed);
  const technique = parseScore(row.technique);
  if (athleticism === null || strength === null || speed === null || technique === null) return null;
  return {
    athleteId: row.athlete_id,
    stats: {
      athleticism: { score: athleticism, note: asString(row.athleticism_note) },
      strength: { score: strength, note: asString(row.strength_note) },
      speed: { score: speed, note: asString(row.speed_note) },
      technique: { score: technique, note: asString(row.technique_note) },
    },
    ratedAt: asString(row.rated_at) || new Date().toISOString(),
    ratedBy: asString(row.rated_by_email) || 'Unrated',
  };
}

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST205' || error.code === '42P01') return true;
  return /could not find the table|does not exist|no table/i.test(error.message ?? '');
}

const TABLE_MISSING_FLAG = 'svj.athleteStats.tableMissing';

let tableMissing = false;
let mockCache: Map<string, AthleteStats> | null = null;

function missingTable(): boolean {
  if (tableMissing) return true;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(TABLE_MISSING_FLAG) === '1') {
    tableMissing = true;
    return true;
  }
  return false;
}

function markTableMissing(): void {
  tableMissing = true;
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(TABLE_MISSING_FLAG, '1');
}

function readBrowserStore(): Map<string, AthleteStats> {
  const map = new Map<string, AthleteStats>();
  if (typeof localStorage === 'undefined') return map;
  try {
    const raw = localStorage.getItem(MOCK_STATS_STORAGE_KEY);
    if (!raw) return map;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return map;
    for (const [athleteId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const row = value as DbAthleteStatsRow | AthleteStats;
      if (row && typeof row === 'object' && 'stats' in row && 'athleteId' in row) {
        const stats = row as AthleteStats;
        map.set(athleteId, stats);
      }
    }
  } catch {
    return map;
  }
  return map;
}

function writeBrowserStore(map: Map<string, AthleteStats>): void {
  if (typeof localStorage === 'undefined') return;
  const payload: Record<string, AthleteStats> = {};
  for (const [id, stats] of map) payload[id] = stats;
  localStorage.setItem(MOCK_STATS_STORAGE_KEY, JSON.stringify(payload));
}

function mockMap(): Map<string, AthleteStats> {
  if (!mockCache) mockCache = readBrowserStore();
  return mockCache;
}

function readMock(athleteId: string): AthleteStats {
  const map = mockMap();
  const existing = map.get(athleteId);
  if (existing) return existing;
  const created = emptyStats(athleteId);
  map.set(athleteId, created);
  writeBrowserStore(map);
  return created;
}

function writeMock(stats: AthleteStats): AthleteStats {
  const map = mockMap();
  map.set(stats.athleteId, stats);
  writeBrowserStore(map);
  return stats;
}

export function resetAthleteStatsStore(): void {
  tableMissing = false;
  mockCache = new Map();
  if (typeof localStorage !== 'undefined') localStorage.removeItem(MOCK_STATS_STORAGE_KEY);
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(TABLE_MISSING_FLAG);
}

function toDbPatch(stats: AthleteStats): Record<string, unknown> {
  return {
    athlete_id: stats.athleteId,
    athleticism: stats.stats.athleticism.score,
    athleticism_note: stats.stats.athleticism.note,
    strength: stats.stats.strength.score,
    strength_note: stats.stats.strength.note,
    speed: stats.stats.speed.score,
    speed_note: stats.stats.speed.note,
    technique: stats.stats.technique.score,
    technique_note: stats.stats.technique.note,
    rated_at: stats.ratedAt,
    rated_by_email: stats.ratedBy,
  };
}

export type SaveAthleteStatInput = {
  athleteId: string;
  key: StatKey;
  score: number;
  note?: string;
  ratedBy: string;
};

function statsTable() {
  return getSupabaseClient().from('athlete_stats');
}

export async function getAthleteStats(athleteId: string): Promise<AthleteStats> {
  if (!missingTable()) {
    try {
      const { data, error } = await statsTable()
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();
      if (isMissingRelation(error)) {
        markTableMissing();
      } else if (error) {
        console.error('Error fetching athlete_stats:', error);
        return readMock(athleteId);
      } else if (data) {
        const parsed = parseDbRow(data as DbAthleteStatsRow);
        if (parsed) return parsed;
      } else {
        return emptyStats(athleteId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/Missing Supabase/.test(message)) {
        markTableMissing();
      } else {
        console.error('Error fetching athlete_stats:', error);
        return readMock(athleteId);
      }
    }
  }
  return readMock(athleteId);
}

export async function saveAthleteStat(input: SaveAthleteStatInput): Promise<AthleteStats> {
  const score = parseScore(input.score);
  if (score === null) {
    throw new Error('Score must be an integer from 1 to 20');
  }
  const current = await getAthleteStats(input.athleteId);
  const next: AthleteStats = {
    athleteId: input.athleteId,
    stats: {
      ...current.stats,
      [input.key]: {
        score,
        note: input.note !== undefined ? input.note.trim() : current.stats[input.key].note,
      },
    },
    ratedAt: new Date().toISOString(),
    ratedBy: input.ratedBy,
  };

  if (!missingTable()) {
    try {
      const { data, error } = await statsTable()
        .upsert(toDbPatch(next) as never, { onConflict: 'athlete_id' })
        .select('*')
        .maybeSingle();
      if (isMissingRelation(error)) {
        markTableMissing();
      } else if (error) {
        console.error('Error saving athlete_stats:', error);
        return writeMock(next);
      } else if (data) {
        const parsed = parseDbRow(data as DbAthleteStatsRow);
        if (parsed) return parsed;
      } else {
        return next;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/Missing Supabase/.test(message)) {
        markTableMissing();
      } else {
        console.error('Error saving athlete_stats:', error);
        return writeMock(next);
      }
    }
  }
  return writeMock(next);
}
