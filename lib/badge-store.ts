import { hasMockData } from './activity-mock-data';

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export type BadgeCategory = 
  | 'technique'
  | 'participation'
  | 'clutch'
  | 'speed'
  | 'improvement';

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  category: BadgeCategory;
  tierBased: boolean;
};

export type EarnedBadge = {
  badgeId: string;
  athleteId: string;
  earnedDate: string;
  tier?: BadgeTier;
  notes?: string;
};

export type BadgeWithDefinition = {
  earned: EarnedBadge;
  definition: BadgeDefinition;
};

const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'fast-ippon',
    name: 'Fast Ippon',
    description: 'Scored ippon in under 30 seconds',
    imagePath: '/badges/fast-ippon.svg',
    category: 'speed',
    tierBased: false,
  },
  {
    id: 'shiai-debut',
    name: 'Shiai Debut',
    description: 'Competed in first tournament match',
    imagePath: '/badges/shiai-debut.svg',
    category: 'participation',
    tierBased: false,
  },
  {
    id: 'kaizen',
    name: 'Kaizen',
    description: 'Demonstrated continuous improvement',
    imagePath: '/badges/kaizen.svg',
    category: 'improvement',
    tierBased: false,
  },
  {
    id: 'golden-score',
    name: 'Golden Score',
    description: 'Won match in overtime golden score',
    imagePath: '/badges/golden-score.svg',
    category: 'clutch',
    tierBased: false,
  },
  {
    id: 'newaza',
    name: 'Ne-waza Master',
    description: 'Scored ippon via pin, choke, or armbar',
    imagePath: '/badges/newaza.svg',
    category: 'technique',
    tierBased: false,
  },
  {
    id: 'seoi-star',
    name: 'Seoi Star',
    description: 'Mastered seoi-nage technique',
    imagePath: '/badges/seoi-star.svg',
    category: 'technique',
    tierBased: true,
  },
];

function getMockBadgesForAthlete(athleteId: string): EarnedBadge[] | null {
  if (!hasMockData(athleteId)) {
    return null;
  }

  return [
    {
      badgeId: 'shiai-debut',
      athleteId,
      earnedDate: '2020-09-15',
      notes: 'First tournament at Bay Area Open',
    },
    {
      badgeId: 'fast-ippon',
      athleteId,
      earnedDate: '2024-06-15',
      notes: 'Clean seoi-nage finish in 22 seconds',
    },
    {
      badgeId: 'golden-score',
      athleteId,
      earnedDate: '2024-06-15',
      notes: 'Wazari in overtime at Bay Area Open',
    },
    {
      badgeId: 'seoi-star',
      athleteId,
      earnedDate: '2024-03-10',
      tier: 'gold',
      notes: 'Multiple ippon with seoi-nage',
    },
    {
      badgeId: 'kaizen',
      athleteId,
      earnedDate: '2024-06-15',
      notes: 'Improved from bronze to silver placement',
    },
  ];
}

export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return BADGE_CATALOG;
}

export async function getAthleteBadges(athleteId: string): Promise<BadgeWithDefinition[]> {
  const mockBadges = getMockBadgesForAthlete(athleteId);
  
  if (!mockBadges) {
    return [];
  }

  return mockBadges.map(earned => {
    const definition = BADGE_CATALOG.find(def => def.id === earned.badgeId);
    if (!definition) {
      throw new Error(`Badge definition not found: ${earned.badgeId}`);
    }
    return { earned, definition };
  });
}
