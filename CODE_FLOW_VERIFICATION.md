# Code Flow Verification

## Before Fix (Broken)

### Flow for Demo A. athlete page load:
```
1. User clicks Demo A. athlete
   └─> /athletes/[id]/page.tsx renders
       └─> ActivitySection component mounts
           └─> useEffect calls loadActivity()
               └─> getAthleteActivity(demoA.id)
                   └─> getMockActivityForAthlete(demoA.id)
                       └─> MOCK_ATHLETE_IDS.has(demoA.id)
                           ❌ Returns FALSE (Set is empty)
                           ❌ Returns null
                   ❌ Returns null
               ❌ setActivity(null)
           
2. ActivitySection render:
   if (!activity || activity.tournaments.length === 0) {
     return null;  ❌ Component invisible
   }
```

### Why MOCK_ATHLETE_IDS is empty:
1. **ensureMockDemoData()** runs on roster load:
   - Creates Demo A. in Supabase ✓
   - Creates Sample B. in Supabase ✓
   - **Never calls enableMockDataForAthlete()** ✗

2. **enableMockDataForAthlete()** only called in seedData():
   ```typescript
   // lib/supabase-store.ts (line 514)
   const demo1 = await createAthlete({ ... });
   enableMockDataForAthlete(demo1.id);  // Only here!
   ```
   - But seedData() is legacy path, rarely used
   - Even if used, Set dies on cold start

3. **MOCK_ATHLETE_IDS** is process memory:
   ```typescript
   export const MOCK_ATHLETE_IDS = new Set<string>();
   ```
   - Resets on every Vercel serverless function cold start
   - Lost on every deployment
   - Empty in production

## After Fix (Working)

### Flow for Demo A. athlete page load:
```
1. User clicks Demo A. athlete
   └─> /athletes/[id]/page.tsx renders
       └─> ActivitySection component mounts
           └─> useEffect calls loadActivity()
               └─> getAthleteActivity(demoA.id)
                   └─> getAthleteById(demoA.id)  🆕
                       ✅ Fetches from Supabase
                       ✅ Returns { firstName: 'Demo', lastInitial: 'A', notes: '...[SAMPLE DATA]...' }
                   
                   └─> isDemoOrSampleAthlete check  🆕
                       athlete.notes.includes('[SAMPLE DATA')
                       ✅ Returns TRUE (marker present)
                       
                       OR
                       
                       athlete.firstName === 'Demo' && athlete.lastInitial === 'A'
                       ✅ Returns TRUE (name match)
                   
                   └─> getMockActivityForAthlete(demoA.id)
                       🆕 No Set check, always returns data
                       ✅ Returns { tournaments: [...], judoStartDate: '2020-09-01' }
                   
                   └─> getPromotionsByAthleteId(demoA.id)
                       ✅ Fetches promotions from Supabase
                   
                   └─> buildCareerTimeline()
                       ✅ Combines judoStartDate + promotions
                   
                   ✅ Returns complete AthleteActivity object
               
               ✅ setActivity({ athleteId, tournaments, careerTimeline })
           
2. ActivitySection render:
   if (!activity || activity.tournaments.length === 0) {
     // ✅ FALSE - activity exists with 2 tournaments
   }
   
   return (
     <div className="card">
       <h3>Activity</h3>
       <MockDataBadge />
       <CareerTimeline events={activity.careerTimeline} />
       {activity.tournaments.map(t => <TournamentCard ... />)}
       ✅ Component renders with full tournament data
     </div>
   );
```

## Database Records (Stable Identity)

### Demo A. created by ensureMockDemoData():
```typescript
{
  id: '<uuid>',  // Dynamic, but stable once created
  first_name: 'Demo',  // ✅ Stable identity marker
  last_initial: 'A',   // ✅ Stable identity marker
  notes: 'Strong thrower, needs work on ground game. Competes in -48kg division. [SAMPLE DATA - DO NOT MODIFY]',
  // ✅ Contains marker: '[SAMPLE DATA - DO NOT MODIFY]'
  tokui_waza: 'Seoi-nage, Uchi-mata',
  stance: 'right',
  weight_class: '-48kg',
  age_division: 'Juvenile',
  created_at: '2024-01-15T...',
  // ... other fields
}
```

### Sample B. created by ensureMockDemoData():
```typescript
{
  id: '<uuid>',
  first_name: 'Sample',  // ✅ Stable identity marker
  last_initial: 'B',     // ✅ Stable identity marker
  notes: 'Powerful right-sided player. Currently working on switching stances. -66kg division. [SAMPLE DATA - DO NOT MODIFY]',
  // ✅ Contains marker
  tokui_waza: 'Osoto-gari, Harai-goshi',
  stance: 'right',
  weight_class: '-66kg',
  age_division: 'Cadet',
  created_at: '2024-01-15T...',
  // ... other fields
}
```

## Identity Check Logic (New)

```typescript
// lib/activity-store.ts
const athlete = await getAthleteById(athleteId);

if (!athlete) {
  return null;  // Real missing athlete
}

// Three ways to identify Demo/Sample athletes (OR logic)
const isDemoOrSampleAthlete = 
  athlete.notes.includes('[SAMPLE DATA')                    // 1. Marker check
  || (athlete.firstName === 'Demo' && athlete.lastInitial === 'A')     // 2. Name check Demo
  || (athlete.firstName === 'Sample' && athlete.lastInitial === 'B');  // 3. Name check Sample

if (isDemoOrSampleAthlete) {
  const mockActivity = getMockActivityForAthlete(athleteId);
  // ✅ Returns mock tournaments
  
  const promotions = await getPromotionsByAthleteId(athleteId);
  // ✅ Returns real promotions from DB
  
  return {
    ...mockActivity,
    careerTimeline: buildCareerTimeline(mockActivity.judoStartDate, promotions),
  };
}

return null;  // Real athlete with no activity data yet
```

## Mock Data Structure

### getMockActivityForAthlete() returns:
```typescript
{
  athleteId: '<passed-in-id>',
  judoStartDate: '2020-09-01',
  careerTimeline: [],  // Built separately from promotions
  tournaments: [
    {
      id: 'mock-tournament-1',
      name: 'Bay Area Open 2024 (SAMPLE)',
      date: '2024-06-15',
      division: 'Juvenile -48kg',
      place: 2,
      medal: 'silver',
      matches: [
        { id: 'mock-match-1', result: 'win', terminalMethod: 'ippon', ... },
        { id: 'mock-match-2', result: 'win', terminalMethod: 'wazari_awasete_ippon', ... },
        { id: 'mock-match-3', result: 'loss', terminalMethod: 'decision', ... },
        { id: 'mock-match-4', result: 'loss', terminalMethod: 'hansoku_make', ... },
      ]
    },
    {
      id: 'mock-tournament-2',
      name: 'NorCal Spring Championships (SAMPLE)',
      date: '2024-03-10',
      division: 'Juvenile -48kg',
      place: 3,
      medal: 'bronze',
      matches: [
        { id: 'mock-match-5', result: 'win', terminalMethod: 'wazari_awasete_ippon', ... },
        { id: 'mock-match-6', result: 'loss', terminalMethod: 'ippon', ... },
      ]
    }
  ]
}
```

## Persistence Guarantee

### Stable across:
- ✅ **Server restarts**: Data in Supabase, not process memory
- ✅ **Vercel cold starts**: Database query, not in-memory Set
- ✅ **New deployments**: Identity markers in DB records
- ✅ **Function invocations**: Fresh DB fetch each time

### Identity markers persist because:
1. **First name / last initial**: Database columns, never change
2. **Notes marker**: String in database, set at creation time
3. **Database records**: Supabase persistence (not ephemeral)

## Real Athletes Unaffected

### For real athlete (e.g., Maya H.):
```typescript
const athlete = await getAthleteById(mayaId);
// Returns: { firstName: 'Maya', lastInitial: 'H', notes: 'Strong thrower...' }

const isDemoOrSampleAthlete = 
  athlete.notes.includes('[SAMPLE DATA')                    // ❌ FALSE
  || (athlete.firstName === 'Demo' && athlete.lastInitial === 'A')     // ❌ FALSE
  || (athlete.firstName === 'Sample' && athlete.lastInitial === 'B');  // ❌ FALSE

// isDemoOrSampleAthlete === false
// Skips mock data logic
// Returns null (no activity data yet)
// ✅ Correct behavior for real athletes
```

## Summary

### Problem: Process Memory (Ephemeral)
```
MOCK_ATHLETE_IDS Set → Dies on cold start → Activity never appears
```

### Solution: Database Identity (Persistent)
```
Database fields → Survive cold starts → Activity always appears
```

### Key Insight
The fix transforms the identity check from:
- **Runtime state** (Set in process memory)
- **To database properties** (persisted athlete records)

This makes the feature **production-ready** because database records survive all the deployment and scaling operations that Vercel serverless functions go through.
