# Activity Log Mock Data - Design Document

## Requirements Summary
- **Mock-first**: No SmoothComp/Mindbody integration in this PR
- **Privacy**: First name + last initial only for opponents (already enforced)
- **UX**: Career timeline + tournament cards + expandable match detail with score events
- **Future-ready**: Schema supports later import from SmoothComp/Mindbody + badge engine
- **Cascade delete**: Athlete opt-out must cascade to all activity data

## Architecture Options

### Option A: Normalized Supabase Tables (Database-First)
**Approach**: Create proper database tables with foreign keys, store mock data in DB

**Schema**:
```typescript
// New tables to create:
- tournaments (id, athlete_id, name, date, division, ruleset, data_source)
- matches (id, tournament_id, opponent_first_name, opponent_last_initial, 
           result, terminal_method, golden_score)
- score_events (id, match_id, sequence_order, event_type, points, 
                technique_id?, notes)
- penalty_events (id, match_id, sequence_order, penalty_type, recipient)
```

**Pros**:
- ✅ True relational integrity with CASCADE DELETE
- ✅ Queryable (future: aggregate stats, badge queries)
- ✅ Migration path is explicit
- ✅ Follows existing pattern (promotions table)

**Cons**:
- ❌ Requires 3 migrations + RLS policies
- ❌ More surface area for mock-only feature
- ❌ Overkill if imports never happen

### Option B: Typed Mock Module + Thin Adapter (Code-First)
**Approach**: Keep mock data in TypeScript module, design types to accept future DB rows

**Schema**:
```typescript
// lib/activity-mock-data.ts - single file
export const MOCK_ACTIVITY: ActivityData = {
  athleteId: string,
  judoStartDate: string,
  tournaments: Tournament[],
  // with full nested structure
}

// types support both mock and future DB shape
type ActivitySource = 'mock' | 'db' | 'smoothcomp' | 'mindbody'
```

**Pros**:
- ✅ Zero migrations for mock-only data
- ✅ Fast to implement
- ✅ Types still enforce future shape
- ✅ Clear "this is temporary" signal
- ✅ Mock badge keeps coaches from confusing sample with real data

**Cons**:
- ❌ Delete cascade must be documented (no DB enforcement)
- ❌ Migration to DB later requires refactor
- ❌ Can't query with SQL

---

## Recommended: **Option B** (Typed Mock Module)

**Rationale**:
1. **Minimize scope**: Task says "mock-first", no real imports yet, likely exploration
2. **Faster validation**: Jacob can see UX without DB overhead
3. **Explicit temporary nature**: Mock module + UI badge makes it clear this is sample data
4. **Smaller diff**: Easier to review & rollback if direction changes
5. **Still future-ready**: Types enforce structure; adapter layer trivial when migrating

**Migration path when ready**:
- Create DB tables from existing types
- Insert mock data via SQL seed
- Swap mock module for `getActivityByAthleteId()` DB query
- Keep same UI components (just change data source)

---

## Type Signatures

```typescript
// lib/types.ts additions

export type DataSource = 'mock' | 'smoothcomp' | 'mindbody' | 'coach';

export type Ruleset = 'ijf_post_2017' | 'ijf_pre_2017' | 'local_with_yuko' | 'other';

export type MatchResult = 'win' | 'loss';

export type TerminalMethod = 
  | 'ippon'
  | 'wazari_awasete_ippon' 
  | 'yuko'                  // for local_with_yuko rulesets
  | 'decision'               // judges decision
  | 'walkover'
  | 'hansoku_make'           // DQ due to penalties
  | 'fusen_gachi'           // win by opponent no-show
  | 'kiken_gachi';          // win by opponent withdrawal

export type ScoreEventType = 'ippon' | 'wazari' | 'yuko' | 'koka';  // koka for old rulesets

export type PenaltyType = 'shido' | 'hansoku_make';

export type ScoreEvent = {
  id: string;
  sequenceOrder: number;
  eventType: ScoreEventType;
  points: number;            // 10 for ippon, 7 for wazari, 5 for yuko, etc
  techniqueId?: string;      // optional link to techniques table
  techniqueLabel?: string;   // free text if not in techniques table
  notes?: string;
};

export type PenaltyEvent = {
  id: string;
  sequenceOrder: number;
  penaltyType: PenaltyType;
  recipient: 'athlete' | 'opponent';
  reason?: string;
};

export type Match = {
  id: string;
  tournamentId: string;
  athleteId: string;
  opponentFirstName: string;
  opponentLastInitial: string;
  result: MatchResult;
  terminalMethod: TerminalMethod;
  goldenScore: boolean;
  scoreEvents: ScoreEvent[];
  penaltyEvents: PenaltyEvent[];
  dataSource: DataSource;
  createdAt: string;
};

export type Tournament = {
  id: string;
  athleteId: string;
  name: string;
  date: string;               // ISO date
  division: string;           // e.g. "Juvenile -48kg"
  place?: number;             // 1, 2, 3, etc
  medal?: 'gold' | 'silver' | 'bronze';
  ruleset: Ruleset;
  matches: Match[];
  dataSource: DataSource;
  createdAt: string;
};

export type CareerTimelineEvent = {
  date: string;
  type: 'judo_start' | 'promotion';
  label: string;              // e.g. "Started Judo" or "White → Yellow"
  fromBelt?: JudoBelt;
  toBelt?: JudoBelt;
};

export type AthleteActivity = {
  athleteId: string;
  judoStartDate?: string;     // mock if needed
  careerTimeline: CareerTimelineEvent[];
  tournaments: Tournament[];
};
```

---

## Module Structure (Option B Implementation)

```
lib/
  activity-mock-data.ts          # Mock data generator
  activity-store.ts              # Future: real DB queries (stub for now)
  activity-utils.ts              # Helpers: timeline builder, sort, etc

components/
  ActivitySection.tsx            # Main section component
  CareerTimeline.tsx             # Visual timeline of career
  TournamentCard.tsx             # Collapsible card per tournament
  MatchRow.tsx                   # Row per match with expand
  MatchDetail.tsx                # Expanded: score events + golden score
  MockDataBadge.tsx              # Warning badge "Sample Data"
```

---

## Mock Data Seed

Sample athlete (attach to existing athlete OR create new "Demo Athlete"):

**Option 1: Attach to existing athlete with clear badge**
- Add mock data only when `activity-store` detects no real activity
- Always show "SAMPLE DATA" badge when source is 'mock'

**Option 2: Separate demo athlete**
- Create "Demo D." athlete specifically for mock activity
- Keeps production athletes clean

**Recommendation**: Option 1 - attach to 1-2 existing athletes with prominent badge

**Sample tournament**:
- Name: "Bay Area Open 2024"
- Date: "2024-06-15"
- Division: "Juvenile -48kg"
- Place: 2nd (silver)
- Ruleset: `local_with_yuko`
- Matches:
  1. vs Sarah M - Win by ippon (seoi-nage)
  2. vs Emma L - Win by wazari-awasete-ippon (golden score)
     - Events: wazari (uchi-mata), wazari (ko-uchi-gari)
  3. vs Taylor K - Loss by decision
     - Events: yuko (opponent), wazari (opponent)
  4. Finals vs Jordan T - Loss by hansoku-make (3 shidos)

---

## Delete Cascade Strategy

**With Option B (mock module)**:
- Mock data lives in memory/module, not DB
- `deleteAthlete()` already cascades promotions, tournament_day_entries
- Mock data just won't appear when athlete doesn't exist
- **Document in code**: If we migrate to DB, ensure `ON DELETE CASCADE` on:
  - `tournaments.athlete_id`
  - `matches.athlete_id`
  - `score_events.match_id`
  - `penalty_events.match_id`

**Future DB migration checklist** (in comments):
```sql
-- When creating tables, ensure cascade:
CREATE TABLE tournaments (
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  ...
);

CREATE TABLE matches (
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  ...
);
```

---

## UI Mockup (Text)

```
┌─────────────────────────────────────────────────────┐
│ Activity                           [SAMPLE DATA] 🏷️  │
├─────────────────────────────────────────────────────┤
│ Career Timeline                                      │
│ ●────●────●────●────●                              │
│ 2020  2021  2022  2023  2024                        │
│ Start White Yellow Orange Green                     │
│      Belt   Belt   Belt   Belt                      │
├─────────────────────────────────────────────────────┤
│ Tournaments                                          │
│                                                      │
│ ┌─ Bay Area Open 2024                    2nd 🥈 ─┐ │
│ │ June 15, 2024 • Juvenile -48kg                  │ │
│ │                                                  │ │
│ │ Matches:                                        │ │
│ │ ✓ vs Sarah M. - Win (Ippon)                    │ │
│ │   > Ippon via seoi-nage                        │ │
│ │                                                  │ │
│ │ ✓ vs Emma L. - Win (Wazari-awasete-ippon) ⏱️   │ │
│ │   > Golden Score                                │ │
│ │   > Wazari (uchi-mata)                         │ │
│ │   > Wazari (ko-uchi-gari) → Ippon             │ │
│ │                                                  │ │
│ │ ✗ vs Taylor K. - Loss (Decision)              │ │
│ │   Opponent: Yuko, Wazari                       │ │
│ │                                                  │ │
│ │ ✗ vs Jordan T. - Loss (Hansoku-make)          │ │
│ │   3 shidos → Disqualification                  │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Plan (Option B)

1. **Types** (`lib/types.ts`): Add new types above
2. **Mock Data** (`lib/activity-mock-data.ts`): Export mock tournaments for 1-2 athletes
3. **Store Stub** (`lib/activity-store.ts`): `getAthleteActivity(id)` returns mock or empty
4. **Utils** (`lib/activity-utils.ts`): Build timeline from promotions + judo start date
5. **Components**:
   - `ActivitySection.tsx` - container with mock badge
   - `CareerTimeline.tsx` - visual timeline
   - `TournamentCard.tsx` - collapsible card
   - `MatchRow.tsx` - expandable row
   - `MatchDetail.tsx` - score progression
6. **Integration**: Add `<ActivitySection />` to athlete detail page after Promotions
7. **Test**: Verify build, visual check, document delete awareness

---

## Out of Scope (Deferred)

- ❌ SmoothComp CSV/API import
- ❌ Mindbody API integration
- ❌ Badge engine (wins by technique, stats)
- ❌ Lifetime stats UI (aggregate views)
- ❌ Family login / assignment changes
- ❌ Real data persistence (mock only)

---

## Questions Resolved

1. **Store mock in DB or code?** → Code (simpler, temporary, clear intent)
2. **Attach to existing athletes or separate demo?** → Existing, with badge
3. **How to order tournaments?** → Newest first (reverse chronological)
4. **How to show matches?** → Per tournament, in order fought (chronological within tournament)
5. **Golden score visual?** → Clock icon + explicit label in match detail

---

## Success Criteria

- ✅ `npm run build` passes
- ✅ Activity section visible on athlete detail page
- ✅ Timeline shows judo start + belt promotions
- ✅ Tournament cards display with place/medal
- ✅ Match rows expand to show ordered score events
- ✅ Golden score clearly indicated
- ✅ "Sample Data" badge visible and unmissable
- ✅ Code documents cascade delete strategy for future DB migration
- ✅ PR description includes design choice rationale + screenshots
