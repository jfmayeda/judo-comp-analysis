# Opt-Out Delete Feature Design

## Phase A: Ground — Current Delete Implementation Trace

### Database Schema & Cascade Behavior

#### Tables and Foreign Keys
1. **athletes** (main table)
   - PK: `id` (uuid)
   - Contains: firstName, lastInitial, belt, stance, techniques, coach preferences, etc.

2. **opponent_notes** 
   - FK: `athlete_id` → `athletes(id)` **ON DELETE CASCADE** ✅
   - FK: `opponent_id` → `opponents(id)` **ON DELETE SET NULL** ✅
   - Contains athlete-specific scouting notes
   - Can optionally link to shared `opponents` directory

3. **promotions**
   - FK: `athlete_id` → `athletes(id)` **ON DELETE CASCADE** ✅
   - Belt promotion history

4. **tournament_day_entries**
   - FK: `athlete_id` → `athletes(id)` **ON DELETE CASCADE** ✅
   - FK: `tournament_day_id` → `tournament_days(id)` **ON DELETE CASCADE** ✅
   - Links athletes to specific tournament days

5. **opponents** (shared directory)
   - Referenced by `opponent_notes.opponent_id`
   - NOT deleted when athlete is deleted (intentional — shared resource)

#### Current `deleteAthlete()` Implementation
Location: `lib/supabase-store.ts:165-177`

```typescript
export async function deleteAthlete(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting athlete:', error);
    throw new Error('Failed to delete athlete');
  }
}
```

**What gets deleted automatically via CASCADE:**
- ✅ All `opponent_notes` for this athlete
- ✅ All `promotions` for this athlete  
- ✅ All `tournament_day_entries` for this athlete

**What does NOT get deleted:**
- ✅ Shared `opponents` records (correct — may be used by other athletes)
- ✅ `tournament_days` themselves (correct — just removes athlete from them)

#### Current UI Delete Button
Location: `app/athletes/[id]/page.tsx:150-161`

```typescript
const handleDelete = async () => {
  if (!confirm(`Delete ${athlete?.firstName} ${athlete?.lastInitial}. and all related notes?`)) {
    return;
  }
  try {
    const id = params.id as string;
    await deleteAthlete(id);
    router.push('/');
  } catch (error: any) {
    console.error('Error deleting athlete:', error);
  }
};
```

**Current confirmation:** Basic `confirm()` dialog with generic message.

### PII (Personally Identifiable Information) Inventory

**What contains PII that must be deleted:**
1. ✅ `athletes.first_name` + `athletes.last_initial`
2. ✅ `opponent_notes` linked to athlete (contains matchup history)
3. ✅ `promotions` linked to athlete (belt progression dates)
4. ✅ `tournament_day_entries` (participation records)

**What does NOT contain athlete PII:**
- Shared `opponents` table (contains OTHER kids' names — must preserve)
- `tournament_days` (just event metadata)
- `techniques` (reference data)

### Gaps in Current Implementation

**✅ CASCADE COVERAGE IS COMPLETE**  
All athlete PII is already covered by existing ON DELETE CASCADE constraints. No orphaned data risk.

**❌ CONFIRMATION IS WEAK**  
Current `confirm()` is too easy to trigger accidentally. Privacy-critical delete needs stronger gate.

**❌ NO OPT-OUT TRACKING**  
No audit trail that an opt-out request was fulfilled. May want date + who approved.

**❌ SHARED OPPONENT NOTES RULE NOT DOCUMENTED**  
UI doesn't explain that shared opponents won't be deleted.

---

## Phase B: Sketch — Design Approaches

### Approach 1: Modal with Typed Confirmation (RECOMMENDED)

**Design:**
- Replace athlete detail page Delete button with "Opt-Out / Delete" button
- Opens modal with:
  - Clear privacy-focused copy: "Permanent deletion for opt-out request"
  - Shows what will be deleted: athlete profile, X notes, X promotions, X tournament entries
  - Requires typing athlete name (e.g., "Maya H") to confirm
  - Explains shared opponents won't be deleted
  - Optional: Admin-only gate (check `isAdmin` from allowlist)

**Types/Signatures:**
```typescript
// New modal component
type OptOutDeleteModalProps = {
  athlete: Athlete;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
};

// Enhanced delete with pre-check counts
type DeletePreview = {
  athleteName: string;
  opponentNotesCount: number;
  promotionsCount: number;
  tournamentEntriesCount: number;
};

async function getDeletePreview(athleteId: string): Promise<DeletePreview>;

// Reuse existing deleteAthlete — cascades already work
async function deleteAthlete(id: string): Promise<void>;
```

**Flow:**
1. User clicks "Opt-Out / Delete" button
2. Fetch delete preview (count related records)
3. Show modal with preview + typed confirmation input
4. On confirm: validate input matches athlete name
5. Call existing `deleteAthlete()` — DB cascades handle cleanup
6. Redirect to home with success message

**Pros:**
- Minimal code — reuses existing `deleteAthlete()`
- Strong confirmation gate
- Clear privacy messaging
- No new DB tables or migrations

**Cons:**
- No audit trail of opt-out (but could add simple log to console/toast)
- Requires building modal component

---

### Approach 2: Wizard with Status Field

**Design:**
- Multi-step wizard:
  1. Reason selection (opt-out request, duplicate, error)
  2. Preview what will be deleted
  3. Final confirmation
- Add `opted_out_at` timestamp to athletes table (soft marker before hard delete)
- Record who approved deletion in a separate `deletion_log` table

**Types/Signatures:**
```typescript
type DeletionReason = 'opt-out' | 'duplicate' | 'data-error';

type DeletionLog = {
  id: string;
  athleteId: string;
  athleteName: string;
  reason: DeletionReason;
  deletedBy: string;
  deletedAt: string;
  recordCounts: {
    notes: number;
    promotions: number;
    tournamentEntries: number;
  };
};

// New migration needed
async function logDeletion(log: DeletionLog): Promise<void>;
async function deleteAthleteWithLog(athleteId: string, reason: DeletionReason): Promise<void>;
```

**Flow:**
1. User clicks "Delete Athlete"
2. Step 1: Select reason (opt-out emphasized)
3. Step 2: Show preview of related records
4. Step 3: Type athlete name to confirm
5. Log deletion to `deletion_log` table
6. Delete athlete (cascades cleanup related records)
7. Show confirmation with log reference

**Pros:**
- Full audit trail
- Clear reason tracking
- More enterprise-grade

**Cons:**
- Requires new DB migration (`deletion_log` table)
- More complex UI (wizard vs modal)
- Adds schema complexity
- Over-engineered for v1 scope

---

## Design Decision: Approach 1 (Modal with Typed Confirmation)

**Why:**
- ✅ Minimal surface area (pstack principle: subtract before add)
- ✅ Reuses existing `deleteAthlete()` infrastructure
- ✅ Strong confirmation gate (typed name)
- ✅ Privacy-focused messaging
- ✅ No new migrations needed
- ✅ Can add audit logging later if needed (separate concern)

**What ships in v1:**
1. Replace "Delete" button with "Opt-Out / Delete Athlete"
2. Modal component with:
   - Privacy-focused copy
   - Delete preview (counts)
   - Typed confirmation (first name + last initial)
   - Shared opponent rule explanation
3. Keep existing `deleteAthlete()` function (cascades work correctly)
4. Optional: Admin-only gate if `isAdmin` check is cheap

**Admin gate decision:**
- Check if `isAdmin` field exists in auth context
- If yes: restrict delete to admins only
- If no/expensive: ship without gate for v1 (all coaches trusted)

**What does NOT ship:**
- Deletion log table (defer to later)
- Soft delete / opted_out status field (defer)
- Wizard multi-step flow (over-engineered)
- Family login / public opt-out portal (explicitly out of scope)

---

## Module Boundaries

```
app/athletes/[id]/page.tsx
  └─> components/OptOutDeleteModal.tsx  (new)
       ├─> lib/supabase-store.ts
       │    └─> deleteAthlete() (existing, no changes)
       │    └─> getDeletePreview() (new helper)
       └─> lib/auth-context.tsx
            └─> isAdmin (check if available)
```

**Files to modify:**
1. `app/athletes/[id]/page.tsx` — replace Delete button, add modal state
2. `components/OptOutDeleteModal.tsx` — new modal component
3. `lib/supabase-store.ts` — add `getDeletePreview()` helper

**Files NOT modified:**
- Database migrations (cascades already correct)
- Opponents table/logic (shared resources preserved)
- Any other pages
