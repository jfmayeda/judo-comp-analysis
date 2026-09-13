# Offline-First PWA Design - Silicon Valley Judo Coach Dashboard

## Phase A: Grounding - Request/Data Flow Model

### Current Architecture (Traced)
1. **Auth Flow**: 
   - `lib/auth-context.tsx` - Client-side React context wrapping entire app
   - Uses `@supabase/ssr` createBrowserClient
   - Session stored in browser (localStorage/cookies by Supabase SDK)
   - Allowlist check on every auth state change via `coach_allowlist` table RLS
   - Sign out clears session via `supabase.auth.signOut()`

2. **Tournament Day Flow**:
   - `/app/tournament-day/page.tsx` - Main selection interface
   - Fetches all athletes + notes via `getAllAthletesWithNotes()` (client-side on mount)
   - Fetches tournament days via `getAllTournamentDays()`
   - Creates/selects today's tournament automatically
   - Loads entries for selected day via `getTournamentDayEntries()`
   - Saves athlete selections via `setTournamentDayAthletes()`
   - Print pack opens `/tournament-day/print?athletes=id1,id2` in new window

3. **Athlete Detail Flow**:
   - `/app/athletes/[id]/page.tsx` - Full CRUD interface
   - Fetches single athlete + notes via `getAthleteWithNotes(id)`
   - Fetches all coaches for assignment dropdown
   - Print profile opens `/athletes/[id]/print`

4. **Print Pages**:
   - `/app/tournament-day/print/page.tsx` - Multi-athlete tournament pack
   - `/app/athletes/[id]/print/page.tsx` - Single athlete profile
   - Both call Supabase store functions directly from client
   - Fully client-rendered (CSR) with `'use client'`
   - Use `window.print()` for PDF generation

5. **Data Fetching** (`lib/supabase-store.ts`):
   - All functions are async, client-side Supabase calls
   - Uses `getSupabaseClient()` which calls `createBrowserClient()`
   - Auth token automatically sent with every request (managed by Supabase SDK)
   - RLS policies enforce data isolation per coach

### Where Offline Breaks Today
- **Initial Page Load**: App Router SSR won't work offline (hydration error)
- **Supabase Calls**: All `supabase.from()` queries fail without network
- **Auth Check**: `supabase.auth.getSession()` fails offline
- **Print Pages**: Load athlete data on mount, fail completely offline
- **Navigation**: Client-side routing works, but data fetch fails

---

## Phase B: Sketch - Two Architectural Approaches

### Approach 1: Pure Service Worker + Cache API (CHOSEN)
**Rationale**: Simpler, smaller footprint, proven Next.js pattern. Keeps Supabase as single source of truth. No dual-write complexity.

#### Architecture
```
Browser
  ├─ Service Worker (sw.js)
  │   ├─ Precache: shell assets (_next/*, public/*, root HTML)
  │   ├─ Runtime Cache: API responses from Supabase
  │   └─ Strategy: Network-first for data, cache-first for assets
  │
  ├─ Cache API
  │   ├─ 'shell-v1': precached static assets
  │   ├─ 'data-v1': runtime cached Supabase JSON responses
  │   └─ Keyed by: URL (fetch requests to supabase.co)
  │
  └─ React App (client-side)
      ├─ OnlineContext: tracks navigator.onLine + SW sync state
      ├─ CacheManager: React hooks to trigger explicit cache preload
      └─ Existing code: no changes to data fetching
```

#### Module Boundaries

**1. Service Worker (`public/sw.js`)**
```typescript
// Lifecycle: install, activate, fetch
interface ServiceWorkerConfig {
  version: string;
  shellCacheName: string;
  dataCacheName: string;
  precacheAssets: string[];
  dataUrlPatterns: RegExp[];
}

// Install: precache shell assets
self.addEventListener('install', (event) => {
  // Open shell cache, addAll(precacheAssets)
  // Not implemented
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  // Delete caches not matching current version
  // Not implemented
});

// Fetch: intercept requests
self.addEventListener('fetch', (event) => {
  // Shell assets: cache-first
  // Data (Supabase): network-first with cache fallback
  // Auth: always network (skip cache)
  // Not implemented
});
```

**2. PWA Manifest (`public/manifest.json`)**
```typescript
interface WebAppManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone';
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
}
// Not implemented - will generate from favicon/branding
```

**3. Service Worker Registration (`app/sw-register.tsx`)**
```typescript
'use client';

export function ServiceWorkerRegistration() {
  // useEffect: register SW if supported
  // Skip in dev mode
  // Not implemented
  return null; // No UI
}

// Usage: <ServiceWorkerRegistration /> in RootLayout
```

**4. Online Status Context (`lib/online-context.tsx`)**
```typescript
'use client';

interface OnlineContextType {
  isOnline: boolean;
  isSyncReady: boolean; // Has cached tournament data
  syncTournamentDay: (tournamentDayId: string) => Promise<void>;
  clearCache: () => Promise<void>;
}

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  // Listen to navigator.onLine
  // Expose sync controls
  // Not implemented
}

export function useOnline(): OnlineContextType {
  // Not implemented
}
```

**5. Cache Preload API (`lib/cache-preload.ts`)**
```typescript
// Client-side helpers to trigger SW cache population

export async function prefetchTournamentDay(tournamentDayId: string): Promise<void> {
  // Fetch all athletes for tournament day
  // Fetch each athlete detail + notes
  // Responses will be intercepted by SW and cached
  // Not implemented
}

export async function clearOfflineCache(): Promise<void> {
  // Message SW to clear data cache
  // Not implemented
}

export async function getCacheStatus(): Promise<{ ready: boolean; itemCount: number }> {
  // Query SW for cache state
  // Not implemented
}
```

**6. UI Components**
```typescript
// lib/components/offline-banner.tsx
export function OfflineBanner() {
  // Shows "Offline Mode" banner when !isOnline
  // Not implemented
}

// lib/components/sync-button.tsx
export function SyncButton({ tournamentDayId }: { tournamentDayId: string }) {
  // "Ready for Tournament Day" button
  // Calls prefetchTournamentDay()
  // Shows loading/success state
  // Not implemented
}
```

#### Cache Strategy Details

**Shell Cache (cache-first)**:
- All `_next/static/*` chunks
- `public/*` images (favicon, logo)
- Root HTML documents (/, /tournament-day, /athletes/[id])

**Data Cache (network-first with fallback)**:
- Supabase REST API responses matching:
  - `/rest/v1/athletes*`
  - `/rest/v1/opponent_notes*`
  - `/rest/v1/tournament_days*`
  - `/rest/v1/tournament_day_entries*`
- Cache keyed by full URL (includes query params for RLS filtering)
- TTL: None (manual invalidation on sync or logout)

**Never Cache**:
- `/auth/*` endpoints (always fresh session check)
- POST/PUT/DELETE requests (writes must go to server)

#### User Isolation Strategy
- Cache is scoped per SW registration (per origin)
- SW detects user change via auth token in request headers
- On sign-out: SW clears data cache via `clearOfflineCache()`
- Added to `signOut()` in auth-context

#### Sync Flow
1. Coach clicks "Ready for Tournament Day" while online
2. UI calls `prefetchTournamentDay(tournamentDayId)`
3. Client fetches all data for that day (athletes + notes)
4. SW intercepts responses and stores in Cache API
5. UI shows "Cached 8 athletes for offline access"
6. Offline: SW returns cached responses when network fails
7. Online again: Network-first strategy gets fresh data

---

### Approach 2: Service Worker + IndexedDB (NOT CHOSEN)
**Why Considered**: Better for large datasets, structured queries offline, longer TTL.

**Why Rejected**: 
- Over-engineered for this use case (only ~10-50 athletes typical)
- Adds complexity: dual-write coordination (Cache API for shell + IndexedDB for data)
- IndexedDB API is more error-prone (transactions, schema migrations)
- Supabase responses are already compact JSON (no need for structured storage)
- Cache API alone handles the "prefetch roster then read offline" pattern cleanly

---

## Implementation Checklist (Stubs to Fill)

### 1. PWA Manifest
- [ ] Create `public/manifest.json` with SVJ branding
- [ ] Generate icon sizes from existing favicon (192x192, 512x512)
- [ ] Add `<link rel="manifest">` to root layout

### 2. Service Worker
- [ ] Create `public/sw.js` with install/activate/fetch handlers
- [ ] Define shell asset list (precache)
- [ ] Implement cache-first for shell
- [ ] Implement network-first for Supabase data
- [ ] Skip caching for auth endpoints
- [ ] Add cache clearing on message from client

### 3. SW Registration
- [ ] Create `app/sw-register.tsx` component
- [ ] Register SW in production only (skip dev)
- [ ] Add to RootLayout

### 4. Online Context
- [ ] Create `lib/online-context.tsx`
- [ ] Track `navigator.onLine`
- [ ] Expose `syncTournamentDay` and `clearCache`
- [ ] Integrate with SW messaging

### 5. UI Integration
- [ ] Add `<OfflineBanner />` to layouts
- [ ] Add `<SyncButton />` to Tournament Day page
- [ ] Show sync status (loading, success, cached count)
- [ ] Call `clearCache()` on sign-out in auth-context

### 6. Testing
- [ ] Verify installability (Chrome DevTools > Application)
- [ ] Verify SW registration and activation
- [ ] Sync a tournament day, go offline, reload → cached data renders
- [ ] Sign out while online → cache clears
- [ ] Sign in as different user → no access to prior user's cached data

---

## Design Rationale: Why Approach 1

**Constraints Met**:
1. ✅ Subtract before add: No new backend, no schema changes, no second source of truth
2. ✅ Proven Next.js pattern: SW + Cache API is standard (used by Workbox, next-pwa)
3. ✅ Auth isolation: Cache cleared on logout, scoped per origin
4. ✅ Privacy: No stored video, first+last-initial only (already enforced in app)
5. ✅ RLS preserved: Cache stores coach's allowlisted data only (filtered by Supabase)
6. ✅ Print fallback: Print pages still work (they're part of cached shell)

**Smallest Public Surface**:
- Developers interact with: `useOnline()` hook, `<SyncButton />`, `<OfflineBanner />`
- SW is invisible implementation detail
- No changes to existing data fetching code

**Where Complexity Lives**:
- SW fetch handler (40-60 lines of logic for routing strategies)
- Client-SW messaging for cache control
- Everything else is thin wrappers

**Scrap Triggers to Watch For**:
- If we need type-safe cache queries → suggests IndexedDB (scrap and redesign)
- If we need offline writes → suggests sync queue (out of scope, scrap PWA v1)
- If auth tokens can't be read in SW → suggests different isolation mechanism (scrap, investigate)
