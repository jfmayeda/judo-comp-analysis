import { getAthleteById } from './supabase-store';

export type BadgeTier = 'white' | 'blue' | 'brown' | 'black';

export type BadgeCategory = 
  | 'technique'
  | 'participation'
  | 'clutch'
  | 'speed'
  | 'improvement'
  | 'spirit'
  | 'achievement'
  | 'preparation';

export type BadgeTierThresholds = {
  white: number;
  blue: number;
  brown: number;
  black: number;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  category: BadgeCategory;
  tiers: BadgeTierThresholds;
};

export type BadgeProgress = {
  badgeId: string;
  athleteId: string;
  currentCount: number;
  earnedTier: BadgeTier | null;
  nextTier: BadgeTier | null;
  nextTarget: number | null;
  progressFraction: number;
  isMaxed: boolean;
  notes?: string;
};

export type BadgeWithProgress = {
  progress: BadgeProgress;
  definition: BadgeDefinition;
};

const BADGE_CATALOG: BadgeDefinition[] = [
  // Existing badges (now tiered)
  {
    id: 'fast-ippon',
    name: 'Fast Ippon',
    description: 'Scored ippon in under 30 seconds',
    imagePath: '/badges/fast-ippon.svg',
    category: 'speed',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'shiai-debut',
    name: 'Shiai Debut',
    description: 'Competed in tournament matches',
    imagePath: '/badges/shiai-debut.svg',
    category: 'participation',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  {
    id: 'kaizen',
    name: 'Kaizen',
    description: 'Demonstrated continuous improvement',
    imagePath: '/badges/kaizen.svg',
    category: 'improvement',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'golden-score',
    name: 'Golden Score',
    description: 'Won matches in overtime golden score',
    imagePath: '/badges/golden-score.svg',
    category: 'clutch',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'newaza',
    name: 'Ne-waza Master',
    description: 'Scored ippon via pin, choke, or armbar',
    imagePath: '/badges/newaza.svg',
    category: 'technique',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  {
    id: 'seoi-star',
    name: 'Seoi Star',
    description: 'Mastered seoi-nage technique',
    imagePath: '/badges/seoi-star.svg',
    category: 'technique',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  
  // New technique badges
  {
    id: 'southpaw',
    name: 'Southpaw',
    description: 'Left-side throws executed',
    imagePath: '/badges/southpaw.svg',
    category: 'technique',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  {
    id: 'ambidex',
    name: 'Ambidex',
    description: 'Both sides used in competition',
    imagePath: '/badges/ambidex.svg',
    category: 'technique',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'renzoku',
    name: 'Renzoku',
    description: 'Combination attack chains',
    imagePath: '/badges/renzoku.svg',
    category: 'technique',
    tiers: { white: 1, blue: 5, brown: 12, black: 30 },
  },
  {
    id: 'iron-grip',
    name: 'Iron Grip',
    description: 'Grip fights and kumi-kata wins',
    imagePath: '/badges/iron-grip.svg',
    category: 'technique',
    tiers: { white: 3, blue: 10, brown: 25, black: 60 },
  },
  {
    id: 'sankaku',
    name: 'Sankaku',
    description: 'Triangle and osaekomi finishes',
    imagePath: '/badges/sankaku.svg',
    category: 'technique',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  {
    id: 'osaekomi',
    name: 'Osaekomi',
    description: 'Pins scored',
    imagePath: '/badges/osaekomi.svg',
    category: 'technique',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  {
    id: 'ashi',
    name: 'Ashi',
    description: 'Ashi-waza foot technique finishes',
    imagePath: '/badges/ashi.svg',
    category: 'technique',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  {
    id: 'counter',
    name: 'Counter',
    description: 'Successful counter attacks',
    imagePath: '/badges/counter.svg',
    category: 'technique',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'tokui-builder',
    name: 'Tokui Builder',
    description: 'Distinct tokui-waza techniques logged',
    imagePath: '/badges/tokui-builder.svg',
    category: 'technique',
    tiers: { white: 2, blue: 4, brown: 6, black: 10 },
  },
  
  // Clutch/Performance badges
  {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Won after trailing in match',
    imagePath: '/badges/comeback.svg',
    category: 'clutch',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'giant-slayer',
    name: 'Giant Slayer',
    description: 'Won up a weight class or belt level',
    imagePath: '/badges/giant-slayer.svg',
    category: 'clutch',
    tiers: { white: 1, blue: 3, brown: 8, black: 15 },
  },
  {
    id: 'ippon-machine',
    name: 'Ippon Machine',
    description: 'Total ippons scored',
    imagePath: '/badges/ippon-machine.svg',
    category: 'achievement',
    tiers: { white: 1, blue: 5, brown: 15, black: 40 },
  },
  {
    id: 'waza-ari',
    name: 'Waza-ari',
    description: 'Waza-ari scores earned',
    imagePath: '/badges/waza-ari.svg',
    category: 'achievement',
    tiers: { white: 3, blue: 10, brown: 25, black: 60 },
  },
  {
    id: 'newaza-escape',
    name: 'Escape Artist',
    description: 'Escaped from pins (coach noted)',
    imagePath: '/badges/newaza-escape.svg',
    category: 'technique',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'grit',
    name: 'Grit',
    description: 'Finished every match despite losses',
    imagePath: '/badges/grit.svg',
    category: 'spirit',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  
  // Participation badges
  {
    id: 'road-warrior',
    name: 'Road Warrior',
    description: 'Tournaments attended',
    imagePath: '/badges/road-warrior.svg',
    category: 'participation',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'full-card',
    name: 'Full Card',
    description: 'Completed all matches on tournament day',
    imagePath: '/badges/full-card.svg',
    category: 'participation',
    tiers: { white: 1, blue: 2, brown: 5, black: 12 },
  },
  {
    id: 'mat-presence',
    name: 'Mat Presence',
    description: 'On time for weigh-ins and matches',
    imagePath: '/badges/mat-presence.svg',
    category: 'participation',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'iron-streak',
    name: 'Iron Streak',
    description: 'Consecutive tournament days or practice weeks',
    imagePath: '/badges/iron-streak.svg',
    category: 'participation',
    tiers: { white: 2, blue: 5, brown: 10, black: 20 },
  },
  {
    id: 'travel-club',
    name: 'Travel Club',
    description: 'Events competed outside home area',
    imagePath: '/badges/travel-club.svg',
    category: 'participation',
    tiers: { white: 1, blue: 3, brown: 8, black: 15 },
  },
  {
    id: 'made-weight',
    name: 'Made Weight',
    description: 'Successful weigh-ins completed',
    imagePath: '/badges/made-weight.svg',
    category: 'participation',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  
  // Achievement badges
  {
    id: 'first-medal',
    name: 'First Medal',
    description: 'Podium finishes at events',
    imagePath: '/badges/first-medal.svg',
    category: 'achievement',
    tiers: { white: 1, blue: 2, brown: 5, black: 10 },
  },
  {
    id: 'gold-medal',
    name: 'Gold',
    description: 'Tournament gold medals won',
    imagePath: '/badges/gold-medal.svg',
    category: 'achievement',
    tiers: { white: 1, blue: 2, brown: 5, black: 10 },
  },
  
  // Spirit/Coach badges
  {
    id: 'good-uke',
    name: 'Good Uke',
    description: 'Coach-awarded partner work excellence',
    imagePath: '/badges/good-uke.svg',
    category: 'spirit',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'student-of-the-game',
    name: 'Student of the Game',
    description: 'Coach-awarded sportsmanship and listening',
    imagePath: '/badges/student-of-the-game.svg',
    category: 'spirit',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'team-spirit',
    name: 'Team Spirit',
    description: 'Coach-awarded team support',
    imagePath: '/badges/team-spirit.svg',
    category: 'spirit',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  {
    id: 'quiet-confidence',
    name: 'Quiet Confidence',
    description: 'Coach-awarded composure under pressure',
    imagePath: '/badges/quiet-confidence.svg',
    category: 'spirit',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
  
  // Preparation badges
  {
    id: 'scout-ready',
    name: 'Scout Ready',
    description: 'Opponent notes filled before match day',
    imagePath: '/badges/scout-ready.svg',
    category: 'preparation',
    tiers: { white: 1, blue: 3, brown: 8, black: 20 },
  },
];

const TIER_ORDER: BadgeTier[] = ['white', 'blue', 'brown', 'black'];

function calculateBadgeProgress(
  badgeId: string,
  currentCount: number,
  definition: BadgeDefinition
): BadgeProgress {
  const { tiers } = definition;
  let earnedTier: BadgeTier | null = null;
  let nextTier: BadgeTier | null = null;
  let nextTarget: number | null = null;
  
  // Determine earned tier
  if (currentCount >= tiers.black) {
    earnedTier = 'black';
  } else if (currentCount >= tiers.brown) {
    earnedTier = 'brown';
    nextTier = 'black';
    nextTarget = tiers.black;
  } else if (currentCount >= tiers.blue) {
    earnedTier = 'blue';
    nextTier = 'brown';
    nextTarget = tiers.brown;
  } else if (currentCount >= tiers.white) {
    earnedTier = 'white';
    nextTier = 'blue';
    nextTarget = tiers.blue;
  } else {
    // Not earned yet
    nextTier = 'white';
    nextTarget = tiers.white;
  }
  
  // Calculate progress fraction
  let progressFraction = 0;
  if (earnedTier === 'black') {
    progressFraction = 1;
  } else if (nextTarget) {
    const prevThreshold = earnedTier 
      ? tiers[earnedTier] 
      : 0;
    progressFraction = Math.min(
      (currentCount - prevThreshold) / (nextTarget - prevThreshold),
      1
    );
  }
  
  return {
    badgeId,
    athleteId: '',
    currentCount,
    earnedTier,
    nextTier,
    nextTarget,
    progressFraction,
    isMaxed: earnedTier === 'black',
  };
}

function getMockProgressForAthlete(athleteId: string, firstName: string): Map<string, number> {
  const counts = new Map<string, number>();
  
  // Demo A gets extensive progress
  if (firstName === 'Demo') {
    counts.set('shiai-debut', 12);
    counts.set('fast-ippon', 6);
    counts.set('golden-score', 4);
    counts.set('seoi-star', 18);
    counts.set('kaizen', 5);
    counts.set('southpaw', 8);
    counts.set('ambidex', 4);
    counts.set('renzoku', 7);
    counts.set('iron-grip', 15);
    counts.set('sankaku', 3);
    counts.set('comeback', 2);
    counts.set('giant-slayer', 5);
    counts.set('road-warrior', 10);
    counts.set('full-card', 3);
    counts.set('good-uke', 6);
    counts.set('newaza', 14);
    counts.set('osaekomi', 9);
    counts.set('ashi', 11);
    counts.set('counter', 4);
    counts.set('ippon-machine', 22);
    counts.set('waza-ari', 35);
    counts.set('newaza-escape', 5);
    counts.set('grit', 7);
    counts.set('mat-presence', 12);
    counts.set('iron-streak', 8);
    counts.set('travel-club', 6);
    counts.set('made-weight', 11);
    counts.set('first-medal', 4);
    counts.set('gold-medal', 2);
    counts.set('student-of-the-game', 9);
    counts.set('team-spirit', 10);
    counts.set('quiet-confidence', 7);
    counts.set('tokui-builder', 5);
    counts.set('scout-ready', 8);
  } 
  // Sample B gets moderate progress
  else if (firstName === 'Sample') {
    counts.set('shiai-debut', 3);
    counts.set('fast-ippon', 1);
    counts.set('seoi-star', 2);
    counts.set('kaizen', 2);
    counts.set('road-warrior', 2);
    counts.set('good-uke', 4);
    counts.set('newaza', 3);
    counts.set('ippon-machine', 4);
    counts.set('waza-ari', 8);
    counts.set('mat-presence', 3);
    counts.set('first-medal', 1);
    counts.set('student-of-the-game', 2);
    counts.set('team-spirit', 5);
    counts.set('tokui-builder', 2);
  }
  
  return counts;
}

export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return BADGE_CATALOG;
}

export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_CATALOG.find(def => def.id === badgeId);
}

export async function getAthleteBadgeProgress(athleteId: string): Promise<BadgeWithProgress[]> {
  const athlete = await getAthleteById(athleteId);
  
  if (!athlete) {
    return [];
  }
  
  const isDemoOrSampleAthlete = 
    athlete.notes.includes('[SAMPLE DATA') ||
    (athlete.firstName === 'Demo' && athlete.lastInitial === 'A') ||
    (athlete.firstName === 'Sample' && athlete.lastInitial === 'B');
  
  if (!isDemoOrSampleAthlete) {
    return [];
  }

  const mockCounts = getMockProgressForAthlete(athleteId, athlete.firstName);
  
  return BADGE_CATALOG.map(definition => {
    const currentCount = mockCounts.get(definition.id) || 0;
    const progress = calculateBadgeProgress(definition.id, currentCount, definition);
    progress.athleteId = athleteId;
    
    return {
      progress,
      definition,
    };
  }).filter(badge => badge.progress.currentCount > 0 || badge.progress.earnedTier !== null);
}

// Legacy function for backward compatibility
export async function getAthleteBadges(athleteId: string): Promise<BadgeWithProgress[]> {
  return getAthleteBadgeProgress(athleteId);
}
