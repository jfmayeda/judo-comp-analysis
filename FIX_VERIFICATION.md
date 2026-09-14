# Delete Modal Fix Verification

## Bug Report
**Issue**: Opt-Out / Delete button on athlete detail page does NOT open a typed confirm text box (or any confirm UI).

**Environment**: Production (https://judo-comp-analysis.vercel.app)

## Root Causes Identified

### 1. Modal Won't Mount if Preview Fails
**Location**: `app/athletes/[id]/page.tsx:159-168`, `page.tsx:1098`

**Problem**: 
- `handleOpenDeleteModal` awaits `getDeletePreview(id)` before calling `setShowDeleteModal(true)`
- If `getDeletePreview` throws (RLS error on `tournament_day_entries`, network failure, etc.), only an `alert()` fires
- Modal render condition requires BOTH `athlete && deletePreview` to be truthy
- **Result**: Modal never mounts if preview fetch fails

**Evidence**:
```typescript
// OLD CODE (broken)
const handleOpenDeleteModal = async () => {
  try {
    const id = params.id as string;
    const preview = await getDeletePreview(id);  // ← blocks modal open
    setDeletePreview(preview);
    setShowDeleteModal(true);  // ← never reached on error
  } catch (error: any) {
    console.error('Error loading delete preview:', error);
    alert('Failed to load delete preview. Please try again.');  // ← only this
  }
};

// Render condition blocks modal mount
{athlete && deletePreview && (  // ← requires preview to exist
  <OptOutDeleteModal ... />
)}
```

**Fix**: Open modal immediately (optimistic), load preview async inside useEffect:
```typescript
// NEW CODE (fixed)
const handleOpenDeleteModal = () => {
  setShowDeleteModal(true);  // ← immediate
  setDeletePreview(null);
  setPreviewError(null);
};

useEffect(() => {
  if (!showDeleteModal) return;
  
  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const preview = await getDeletePreview(params.id as string);
      setDeletePreview(preview);
    } catch (error: any) {
      setPreviewError(error.message || 'Failed to load deletion preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  loadPreview();
}, [showDeleteModal, params.id]);

// Render condition no longer requires preview
{athlete && (  // ← only needs athlete
  <OptOutDeleteModal ... />
)}
```

### 2. Z-Index Stacking Issue
**Location**: `components/OptOutDeleteModal.tsx:61`, `app/globals.css:226`

**Problem**:
- Modal uses `z-50`
- Sticky header uses `z-index: 100`
- **Result**: Modal renders BEHIND the header on mobile/scroll

**Evidence**:
```css
/* app/globals.css:222-230 */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;  /* ← higher than modal's z-50 */
}
```

**Fix**: Bump modal to `z-[150]`:
```typescript
// OLD: z-50
<div className="fixed inset-0 ... z-50 ...">

// NEW: z-[150]
<div className="fixed inset-0 ... z-[150] ...">
```

### 3. Confirm Text Mismatch
**Location**: `components/OptOutDeleteModal.tsx:30`

**Problem**:
- Display shows: `John D.` (with period)
- Expected confirm text was: `John D` (no period)
- **Result**: User types correct name but button stays disabled

**Evidence**:
```typescript
// OLD (mismatched)
const expectedConfirmText = `${athlete.firstName} ${athlete.lastInitial}`;
// Expected: "John D" but display shows "John D."

// NEW (aligned)
const expectedConfirmText = `${athlete.firstName} ${athlete.lastInitial}.`;
// Now matches: "John D."
```

## Changes Made

### `components/OptOutDeleteModal.tsx`
1. **Type signature**: Accept nullable `deletePreview`, add `isLoadingPreview` and `previewError` props
2. **Loading state**: Show animated skeleton while preview loads
3. **Error state**: Show warning if preview fails, allow user to proceed anyway
4. **Z-index**: Changed from `z-50` to `z-[150]`
5. **Confirm text**: Added trailing period to match display

### `app/athletes/[id]/page.tsx`
1. **State**: Added `isLoadingPreview` and `previewError` state
2. **Handler**: `handleOpenDeleteModal` now opens modal immediately (synchronous)
3. **Effect**: New `useEffect` loads preview after modal opens
4. **Render**: Modal no longer requires `deletePreview` to mount

## Build Verification

```bash
npm run build
```

**Result**: ✓ Build succeeds with no TypeScript errors

```
Route (app)                              Size     First Load JS
...
├ ƒ /athletes/[id]                       7.77 kB         190 kB
...
✓ Compiled successfully
```

## Manual Test Scenarios

### Scenario 1: Happy Path - Preview Loads Successfully
**Steps**:
1. Navigate to athlete detail page (admin logged in)
2. Click "Opt-Out / Delete" button
3. Modal opens immediately (loading state visible briefly)
4. Preview data loads → shows counts
5. Type athlete name with period: `John D.`
6. "Permanently Delete" button enables
7. Click delete → athlete removed, redirected to home

**Expected**: ✓ Modal appears immediately, typed confirm works, deletion succeeds

### Scenario 2: Preview Fails (RLS/Network Error)
**Steps**:
1. Navigate to athlete detail page
2. Click "Opt-Out / Delete" button
3. Modal opens immediately
4. Preview fetch fails (network/RLS)
5. Yellow warning box appears: "Could not load deletion preview"
6. User can still type athlete name: `John D.`
7. "Permanently Delete" button enables
8. Click delete → athlete removed

**Expected**: ✓ Modal still appears, user can proceed despite preview failure

### Scenario 3: Wrong Confirm Text
**Steps**:
1. Open delete modal
2. Type incorrect name: `John D` (no period)
3. Button stays disabled
4. Type correct name: `John D.`
5. Button enables

**Expected**: ✓ Exact match required (including period)

### Scenario 4: Z-Index / Mobile Viewport
**Steps**:
1. Open athlete page on mobile viewport (375px)
2. Scroll down past header (header becomes sticky)
3. Click "Opt-Out / Delete"
4. Modal appears centered
5. Confirm input is visible without scrolling
6. Modal overlay covers header

**Expected**: ✓ Modal is fully visible above sticky header, input accessible

### Scenario 5: Non-Admin User
**Steps**:
1. Log in as non-admin user
2. Navigate to athlete page
3. "Opt-Out / Delete" button should NOT be visible

**Expected**: ✓ Admin gate still in place (button only shows for `isAdmin`)

## Code Review Checklist

- [x] Modal opens immediately on button click (no await)
- [x] Preview loads asynchronously after modal opens
- [x] Loading state shows while preview fetches
- [x] Error state shows if preview fails, allows proceed
- [x] Modal z-index (150) is above header z-index (100)
- [x] Confirm text matches display format (`${firstName} ${lastInitial}.`)
- [x] Admin gate preserved (`isAdmin &&` on delete button)
- [x] Typed confirm validation still works
- [x] Production build succeeds
- [x] No TypeScript errors
- [x] No new ESLint warnings

## Regression Risk: LOW

**Isolated Changes**:
- Only touched delete modal flow
- No changes to shared opponents cascade logic
- No changes to delete mutation (`deleteAthlete` unchanged)
- Admin gate still enforced
- Typed confirm still required

**Backwards Compatible**:
- Modal still accepts valid preview data
- Falls back gracefully if preview is null
- Error handling added (no silent failures)
