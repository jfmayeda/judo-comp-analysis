import { AthleteActivity, CareerTimelineEvent } from './types';
import { getMockActivityForAthlete, hasMockData } from './activity-mock-data';
import { getPromotionsByAthleteId, getAthleteById } from './supabase-store';
import { formatBeltName } from './belt-utils';

export async function getAthleteActivity(athleteId: string): Promise<AthleteActivity | null> {
  const athlete = await getAthleteById(athleteId);
  
  if (!athlete) {
    return null;
  }
  
  const isDemoOrSampleAthlete = 
    athlete.notes.includes('[SAMPLE DATA') ||
    (athlete.firstName === 'Demo' && athlete.lastInitial === 'A') ||
    (athlete.firstName === 'Sample' && athlete.lastInitial === 'B');
  
  if (isDemoOrSampleAthlete) {
    const mockActivity = getMockActivityForAthlete(athleteId);
    
    if (mockActivity) {
      const promotions = await getPromotionsByAthleteId(athleteId);
      const timeline = buildCareerTimeline(mockActivity.judoStartDate, promotions);
      
      return {
        ...mockActivity,
        careerTimeline: timeline,
      };
    }
  }

  return null;
}

export function buildCareerTimeline(
  judoStartDate: string | undefined,
  promotions: Array<{ promotionDate: string; fromBelt: string; toBelt: string }>
): CareerTimelineEvent[] {
  const events: CareerTimelineEvent[] = [];

  if (judoStartDate) {
    events.push({
      date: judoStartDate,
      type: 'judo_start',
      label: 'Started Judo',
    });
  }

  promotions.forEach((promo) => {
    events.push({
      date: promo.promotionDate,
      type: 'promotion',
      label: `${formatBeltName(promo.fromBelt as any)} → ${formatBeltName(promo.toBelt as any)}`,
      fromBelt: promo.fromBelt as any,
      toBelt: promo.toBelt as any,
    });
  });

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export { hasMockData };
