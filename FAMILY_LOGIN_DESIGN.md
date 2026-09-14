# Family Login v1 - Design Sketch

## Goal
Parents/guardians log in and see/edit ONLY their linked athlete. Coaches retain full access. Minors privacy non-negotiable.

## Auth Approach

### Supabase Auth
- Reuse existing Supabase Auth (magic link preferred, email OTP fallback)
- One unified login page for both coaches and families
- After login, check role via database tables (NOT user_metadata)

### Database: `family_access` table
```typescript
type FamilyAccess = {
  id: string;
  athleteId: string;        // FK to athletes.id
  email: string;            // lowercased
  invitedBy: string | null; // FK to auth.users.id (admin who invited)
  createdAt: string;
}
```
- Unique constraint: `(email, athlete_id)`
- Index on `lower(email)` for fast lookup
- Multiple rows per email = access to multiple athletes (future multi-kid support)

### Auth Role Detection (post-login)
1. If `email` in `coach_allowlist` → **Coach** role (existing behavior unchanged)
2. Else if `email` in `family_access` → **Family** role (new)
3. Else → **Unauthorized**

### Auth Context Extensions
```typescript
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAllowlisted: boolean | null;      // Coach access
  isAdmin: boolean | null;
  isFamily: boolean | null;           // NEW
  linkedAthleteIds: string[];         // NEW: empty for coaches, athlete IDs for family
  signOut: () => Promise<void>;
}
```

## RLS Security Model

### Helper Functions (security definer, use `auth.jwt()->>'email'`)
```sql
-- Returns true if current user's email is in family_access for this athlete
is_family_for_athlete(athlete_id uuid) → boolean

-- Returns true if user can access athlete (coach OR family)
can_access_athlete(athlete_id uuid) → boolean
```

### Policies

**`athletes` table:**
- Family SELECT: `is_family_for_athlete(athletes.id)`
- Family UPDATE: `is_family_for_athlete(athletes.id)` + restrict columns (no `created_at`, no deletion)
- Coaches: existing broad policies unchanged

**`opponent_notes` table:**
- Family SELECT: `is_family_for_athlete(opponent_notes.athlete_id)`
- Family UPDATE: `is_family_for_athlete(opponent_notes.athlete_id)` (safe fields only via app logic)
- Family CANNOT delete opponent_notes

**`promotions` table:**
- Family SELECT: `is_family_for_athlete(promotions.athlete_id)`
- Family CANNOT insert/update/delete promotions (coach-only)

**`opponents` table (shared directory):**
- Family CANNOT SELECT/INSERT/UPDATE/DELETE
- Coach-only table

**`tournament_days` + `tournament_day_entries`:**
- Family CANNOT access (coach-only)

**`coach_allowlist` table:**
- Family CANNOT SELECT/INSERT/UPDATE/DELETE (coach-only)

**`family_access` table:**
- Admin coaches: INSERT/DELETE (invite/revoke family)
- Family users: SELECT own rows only (to verify access)
- RLS enabled, security definer helpers

## UI Changes

### 1. Admin: Invite Family (on athlete detail page)
- New section: "Family Access" (visible only to admins)
- Email input + "Invite Family" button
- List of linked family emails with "Revoke" button
- Sends magic link via Supabase Auth

### 2. Login Page
- No changes to form (works for both coaches and families)
- Copy: "Sign in to access athlete profiles and tournament day notes"
- No mention of "coach" or "family" to avoid confusion

### 3. Post-Login Routing
- Coaches → `/` (roster list, unchanged)
- Family → `/athletes/{linkedAthleteId}` (direct to their athlete)
  - If multiple linked athletes (future): `/family` hub page (v1: assume single athlete per invite)

### 4. Family Athlete View
**Can view:**
- Athlete profile fields (first name + last initial only, privacy-first)
- Tokui-waza, ne-waza, development areas, stance, weight class, division
- Opponent notes (scouting intel for their kid's matches)
- Promotions history (read-only)

**Can edit (limited):**
- Tokui-waza notes, ne-waza notes, development areas
- Stance, kumi-kata (safe profile fields)
- NOT: coach assignment, belt/rank, deletion, invite coaches

**Cannot see:**
- Full roster of other athletes
- Opponents directory (shared database)
- Tournament Day assignment board
- Coach allowlist management
- Admin controls

### 5. Nav Bar (Family)
- Hide: "Tournament Day", "Invite Coaches", "Home" (roster list)
- Show: "My Athlete" (or athlete name), "Sign Out"

## Privacy Constraints (v1)
- First name + last initial ONLY everywhere family sees (including opponent notes)
- No photos (not in scope)
- No video (not in scope)
- Family CANNOT see other kids' profiles or data

## Migration Path
1. Ship SQL migration: `20260914_family_access.sql`
2. Document: Jacob must apply via Supabase Dashboard → SQL Editor (Production)
3. If Supabase CLI available: `supabase db push` (local dev testing)
4. No `service_role` keys in browser code (security definer handles RLS)

## Out of Scope (v1)
- COPPA parental consent forms
- Mindbody/SmoothComp sync for family
- Family self-registration (admin invite-only)
- Public share links without auth
- Changing coach auth model
- Photo/video access

## Success Criteria
- Family email can log in → see only linked athlete
- Family email cannot SELECT unrelated athletes (RLS blocks)
- Coach email retains full roster access (unchanged)
- Uninvited email → `/unauthorized`
- Build green, migration ready, proof via SQL policy test

## Implementation Order
1. ✅ Design sketch (this doc)
2. Migration: `family_access` table + RLS helpers + policies
3. Auth context: extend with `isFamily` + `linkedAthleteIds`
4. UI: admin invite section on athlete page
5. UI: post-login routing (family → athlete detail)
6. UI: family nav bar (hide coach-only sections)
7. Verification: build + RLS policy checklist + manual test
8. PR (do not merge)
