# Badge System Architecture Sketch

## Type System

```typescript
// Badge tier levels (optional for progressive achievements)
export type BadgeTier = 'bronze' | 'silver' | 'gold';

// Badge categories
export type BadgeCategory = 
  | 'technique'     // Technique mastery (Seoi Star, Ne-waza)
  | 'participation' // First match, attendance
  | 'clutch'        // Golden Score, Comeback
  | 'speed'         // Fast Ippon
  | 'improvement';  // Kaizen

// Badge definition (catalog)
export type BadgeDefinition = {
  id: string;                    // 'fast-ippon', 'shiai-debut', etc.
  name: string;                  // 'Fast Ippon', 'Shiai Debut'
  description: string;           // Short description
  imagePath: string;             // '/badges/fast-ippon.svg'
  category: BadgeCategory;
  tierBased: boolean;            // True if badge has bronze/silver/gold tiers
};

// Earned badge instance
export type EarnedBadge = {
  badgeId: string;               // Reference to BadgeDefinition.id
  athleteId: string;
  earnedDate: string;            // ISO date string
  tier?: BadgeTier;              // If badge is tierBased
  notes?: string;                // Optional context
};

// For UI display
export type BadgeWithDefinition = {
  earned: EarnedBadge;
  definition: BadgeDefinition;
};
```

## Module Structure

### lib/badge-store.ts
```typescript
// Badge catalog (all available badges)
export function getAllBadgeDefinitions(): BadgeDefinition[];

// Get badges earned by an athlete
export function getAthleteBadges(athleteId: string): Promise<BadgeWithDefinition[]>;

// Mock data: seed badges for demo athletes
function getMockBadgesForAthlete(athleteId: string): EarnedBadge[] | null;

// Check if athlete should get mock badges (reuse demo detection logic)
function hasMockBadges(athleteId: string): boolean;
```

### components/BadgesSection.tsx
```typescript
type BadgesSectionProps = {
  athleteId: string;
};

export default function BadgesSection({ athleteId }: BadgesSectionProps);
```

### components/BadgeCard.tsx (or inline in BadgesSection)
```typescript
type BadgeCardProps = {
  badge: BadgeWithDefinition;
};
```

## Data Flow

1. **Catalog**: Badge definitions are static in-memory catalog
2. **Mock awards**: Demo A / Sample B get hardcoded EarnedBadge[] based on athleteId
3. **Detection**: Same pattern as activity-mock-data.ts:
   - Check MOCK_ATHLETE_IDS set OR
   - Check firstName/lastInitial === (Demo/A or Sample/B)
4. **UI**: BadgesSection fetches badges, renders grid with images + metadata
5. **Real athletes**: getAthleteBadges returns empty array (no fake awards)

## Asset Requirements

Files in `public/badges/`:
- fast-ippon.svg
- shiai-debut.svg
- kaizen.svg
- golden-score.svg
- newaza.svg
- seoi-star.svg

## Integration Point

Wire BadgesSection into `app/athletes/[id]/page.tsx` below ActivitySection:

```tsx
<ActivitySection athleteId={athlete.id} />
<BadgesSection athleteId={athlete.id} />
```

## Future Extension Points (v2+)
- Compute badges from activity events (score events → Fast Ippon logic)
- Supabase tables for persistent earned_badges
- Admin UI to award badges manually
- Badge progress tracking (80% to next tier)
