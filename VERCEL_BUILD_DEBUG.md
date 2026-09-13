# Vercel Build Failure - Debugging Log

## Timeline

**Initial deployment**: Failed immediately
**Root causes identified and fixed**: 3 critical issues
**Current status**: Local build ✅ | Vercel deployment ❌

---

## Fixes Applied

### Fix 1: Service Worker Precache (commit 3533ca7)

**Problem**: Service worker tried to precache auth-gated routes during install phase.

```javascript
// BEFORE (BROKEN)
const SHELL_ASSETS = [
  '/',              // ❌ Returns 307 redirect when unauthenticated
  '/tournament-day', // ❌ Returns 307 redirect when unauthenticated
  '/favicon.ico',
  '/svj-logo-white.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS); // ❌ FAILS: cache.addAll rejects on non-200 responses
    })
  );
});
```

**Why it failed**: When the SW installs (before user authentication), it tries to fetch `/` and `/tournament-day`. These routes are auth-protected and return 307 redirects to `/login`. `cache.addAll()` throws an error on any non-200 response, causing SW installation to fail.

**Fix**:
```javascript
// AFTER (FIXED)
const SHELL_ASSETS = [
  '/favicon.ico',      // ✅ Public, returns 200
  '/svj-logo-white.png', // ✅ Public, returns 200
  '/manifest.json',    // ✅ Public, returns 200
];

// HTML pages cached dynamically on first navigation
self.addEventListener('fetch', (event) => {
  // ...network-first handler...
  if (response.ok && request.headers.get('accept')?.includes('text/html')) {
    caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone()));
  }
});
```

**Result**: SW installs successfully, HTML pages cached after user authenticates and visits them.

---

### Fix 2: Icon Files (commit 3533ca7)

**Problem**: Manifest referenced PNG files that were actually Windows .ico format.

```bash
$ file public/icon-192.png
public/icon-192.png: MS Windows icon resource - 1 icon, 48x48, 32 bits/pixel
# ❌ Not a PNG file!
```

**Fix**:
```json
{
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "48x48",
      "type": "image/x-icon"
    }
  ]
}
```

Removed broken icon files, use existing favicon.ico (browsers fallback to this for PWA icons).

---

### Fix 3: SSR-Safe Browser API Guards (commit 77860ef)

**Problem**: Accessing browser-only APIs without checking if `window` exists.

```typescript
// BEFORE (BROKEN during SSR/SSG)
const [isOnline, setIsOnline] = useState(true);
useEffect(() => {
  setIsOnline(navigator.onLine); // ❌ navigator undefined during SSR
  window.addEventListener('online', ...); // ❌ window undefined during SSR
});
```

**Fix**:
```typescript
// AFTER (SSR-SAFE)
const [isOnline, setIsOnline] = useState(() => 
  typeof window !== 'undefined' ? navigator.onLine : true
);

useEffect(() => {
  if (typeof window !== 'undefined') {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
  }
}, []);

// In clearCache():
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Safe to use SW APIs
}

// In getCachedCount():
if (typeof window !== 'undefined' && 'caches' in window) {
  // Safe to use Cache API
}
```

---

## Local Build Verification

```bash
$ npm run build
   ▲ Next.js 15.1.11

   Creating an optimized production build ...
 ✓ Compiled successfully
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/12) ...
   Generating static pages (3/12) 
   Generating static pages (6/12) 
   Generating static pages (9/12) 
 ✓ Generating static pages (12/12)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    4.83 kB         187 kB
├ ○ /_not-found                          979 B           106 kB
├ ƒ /athletes/[id]                       6.55 kB         189 kB
├ ƒ /athletes/[id]/print                 1.82 kB         184 kB
├ ○ /icon.png                            0 B                0 B
├ ○ /invite                              3.33 kB         186 kB
├ ○ /login                               2.72 kB         177 kB
├ ○ /opponents                           4.74 kB         187 kB
├ ○ /tournament-day                      4.32 kB         187 kB
├ ○ /tournament-day/assign               6.26 kB         189 kB
├ ○ /tournament-day/print                1.93 kB         181 kB
└ ○ /unauthorized                        1.82 kB         176 kB
+ First Load JS shared by all            105 kB
  ├ chunks/4bd1b696-2ff069eb49c5d6a0.js  52.9 kB
  ├ chunks/517-7c8c8efee7e74172.js       50.5 kB
  └ other shared chunks (total)          1.94 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**✅ BUILD PASSES LOCALLY**

```bash
$ npx tsc --noEmit
# No errors

$ ls -la public/
-rw-r--r--  1 ubuntu ubuntu  9662 Sep 13 22:27 favicon.ico
-rw-r--r--  1 ubuntu ubuntu   408 Sep 13 23:34 manifest.json
-rw-r--r--  1 ubuntu ubuntu 37898 Sep 13 22:27 svj-logo-white.png
-rw-r--r--  1 ubuntu ubuntu  4307 Sep 13 23:33 sw.js

$ cat public/sw.js | head -15
// Service Worker for Silicon Valley Judo PWA
// Implements offline-first caching strategy

const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

// Assets to precache on install (only public static assets)
const SHELL_ASSETS = [
  '/favicon.ico',
  '/svj-logo-white.png',
  '/manifest.json',
];
```

---

## Vercel Deployment Still Failing

**Failed attempts**:
1. `2vrQQ3grbmMZ1aHzuygUSxLLx5F6` - Original (SW precache issue)
2. `8eL1ZgX3hJcoi4DA9P86HDEWi4ya` - After SW/icon fix
3. `CF6VoM9gNvqqMv61KhpktuKwfhiP` - After vercel.json added
4. `F8DFqJ8mSsKY3BQnEvjAkBHgZroM` - After SSR guards
5. `JAZuXWfdVRFsCikiwPEaZZJoAj5m` - After vercel.json removed

**Pattern**: All builds fail within ~5-10 seconds of starting, suggesting early build-phase error (not runtime).

**Cannot access logs**: All deployment URLs return 403 Forbidden when attempting to fetch logs.

---

## Likely Remaining Causes (Hypothesis)

### 1. Missing Environment Variables (MOST LIKELY)

Vercel project may not have Supabase environment variables set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The app requires these at build time because:
```typescript
// lib/supabase.ts
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check .env.local file.');
  }
  // ...
}
```

This function is imported (even if not called at build time) which may cause Next.js to evaluate it during static analysis.

**How to verify**: Check Vercel project settings → Environment Variables

### 2. Vercel Build Configuration

Possible mismatches:
- Node.js version (local vs Vercel)
- Build command override (should be `next build`)
- Output directory (should be `.next`)
- Root directory (should be `/`)

### 3. Package Installation Failure

Network issues or package registry problems during `npm install` on Vercel.

### 4. TypeScript/Lint Errors

Different strictness settings in Vercel environment vs local, but unlikely since:
- `npx tsc --noEmit` passes locally
- `next build` includes type checking and passes locally
- `eslint.ignoreDuringBuilds: true` set in next.config.ts

---

## Files Changed

```bash
$ git diff origin/main...cursor/offline-pwa-45d1 --stat
 OFFLINE_PWA_DESIGN.md         | 316 +++++++++++++++++++++++++++++
 PWA_VERIFICATION.md           | 452 ++++++++++++++++++++++++++++++++++++++++++
 app/layout.tsx                |  17 +-
 app/sw-register.tsx           |  40 ++++
 app/tournament-day/page.tsx   |  18 +-
 components/offline-banner.tsx |  25 +++
 components/sync-button.tsx    |  86 ++++++++
 lib/auth-context.tsx          |  16 ++
 lib/online-context.tsx        | 157 +++++++++++++++
 public/manifest.json          |  16 ++
 public/sw.js                  | 152 ++++++++++++++
 11 files changed, 1291 insertions(+), 4 deletions(-)
```

All new files, no modifications to existing critical files except:
- `app/layout.tsx` - Added OnlineProvider and SW registration
- `app/tournament-day/page.tsx` - Added OfflineBanner and SyncButton
- `lib/auth-context.tsx` - Added cache clearing on logout

---

## Recommendation

**To resolve Vercel build failure, need to:**

1. **Access Vercel error logs** (primary need)
   - Owner should visit Vercel dashboard
   - Navigate to failed deployment
   - Copy full build error output
   
2. **Check environment variables**
   - Vercel project → Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for Production/Preview

3. **Verify build settings**
   - Vercel project → Settings → General
   - Build command: `npm run build` (or empty to use package.json)
   - Output directory: `.next`
   - Install command: `npm install`
   - Node.js version: 18.x or 20.x

Without access to Vercel error logs, further debugging is speculative. The local build passes all checks, suggesting the issue is environment-specific.
