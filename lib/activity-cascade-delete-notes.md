# Activity Data Cascade Delete Strategy

## Current Implementation (Mock Data)

The activity log currently uses **mock data stored in memory** via `lib/activity-mock-data.ts`. 

### Delete Behavior:
- When an athlete is deleted via `deleteAthlete()`, their mock activity data automatically becomes inaccessible because:
  1. The athlete record is deleted from the database
  2. `getAthleteActivity(athleteId)` returns `null` when the athlete doesn't exist
  3. Mock data is keyed by `athleteId` which no longer resolves

### Mock Data Tracking:
- `MOCK_ATHLETE_IDS` Set tracks which athlete IDs have mock data enabled
- Currently enabled via `enableMockDataForAthlete(athleteId)` during seed data creation
- When athlete is deleted, their ID remains in the Set but has no effect (athlete lookup fails first)

## Future Migration to Database (When Imports Added)

When migrating activity data from mock module to database tables (for SmoothComp/Mindbody imports), **CASCADE DELETE must be enforced** for opt-out compliance.

### Required Migration SQL:

```sql
-- When creating tournaments table
CREATE TABLE tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  division text NOT NULL,
  place integer,
  medal text CHECK (medal IN ('gold', 'silver', 'bronze')),
  ruleset text NOT NULL,
  data_source text NOT NULL CHECK (data_source IN ('mock', 'smoothcomp', 'mindbody', 'coach')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tournaments_athlete_id_idx ON tournaments(athlete_id);
CREATE INDEX tournaments_date_idx ON tournaments(date DESC);

-- When creating matches table
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  opponent_first_name text NOT NULL,
  opponent_last_initial text NOT NULL CHECK (length(opponent_last_initial) = 1),
  result text NOT NULL CHECK (result IN ('win', 'loss')),
  terminal_method text NOT NULL,
  golden_score boolean NOT NULL DEFAULT false,
  data_source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX matches_tournament_id_idx ON matches(tournament_id);
CREATE INDEX matches_athlete_id_idx ON matches(athlete_id);

-- When creating score_events table
CREATE TABLE score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('ippon', 'wazari', 'yuko', 'koka')),
  points integer NOT NULL,
  technique_id uuid REFERENCES techniques(id) ON DELETE SET NULL,
  technique_label text,
  notes text
);

CREATE INDEX score_events_match_id_idx ON score_events(match_id);

-- When creating penalty_events table
CREATE TABLE penalty_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  penalty_type text NOT NULL CHECK (penalty_type IN ('shido', 'hansoku_make')),
  recipient text NOT NULL CHECK (recipient IN ('athlete', 'opponent')),
  reason text
);

CREATE INDEX penalty_events_match_id_idx ON penalty_events(match_id);
```

### Cascade Chain:
```
DELETE athlete
  ↓ CASCADE
  → tournaments (all tournaments for that athlete)
    ↓ CASCADE
    → matches (all matches in those tournaments)
      ↓ CASCADE
      → score_events (all score events in those matches)
      → penalty_events (all penalty events in those matches)
```

### RLS Policies:
Follow the existing pattern from `promotions` table:
- Allowlisted coaches can view/create/update/delete activity data
- Use `public.is_allowlisted_coach()` function for policy checks

### Migration Checklist:
1. ✅ Create tables with CASCADE DELETE constraints
2. ✅ Add indexes for performance
3. ✅ Enable RLS on all new tables
4. ✅ Create policies using is_allowlisted_coach()
5. ✅ Migrate mock data to DB (optional, can keep as examples)
6. ✅ Update `lib/activity-store.ts` to query DB instead of mock module
7. ✅ Test cascade delete by deleting an athlete with activity data
8. ✅ Update UI to handle both mock and DB sources (already done via `dataSource` field)

## Testing Delete Cascade

### Current (Mock):
```typescript
// 1. Create athlete with mock data
const athlete = await createAthlete({ firstName: 'Test', lastInitial: 'T' });
enableMockDataForAthlete(athlete.id);

// 2. Verify activity loads
const activity = await getAthleteActivity(athlete.id);
console.assert(activity !== null);

// 3. Delete athlete
await deleteAthlete(athlete.id);

// 4. Verify activity no longer accessible
const afterDelete = await getAthleteActivity(athlete.id);
console.assert(afterDelete === null);
```

### Future (DB):
```typescript
// Same test, but activity comes from DB
// CASCADE DELETE ensures all related records are removed automatically
```

## Privacy Compliance

The mock data already enforces:
- ✅ First name + last initial only for opponents
- ✅ No photos (not in schema)
- ✅ No other-kids video references (not in schema)
- ✅ Opt-out delete awareness (documented above)

When implementing imports:
- Sanitize SmoothComp/Mindbody data to first name + last initial
- Never store full names, photos, or video links
- Mark data source on every row (`data_source` field)
