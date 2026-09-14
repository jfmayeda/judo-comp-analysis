import { AthleteActivity, Tournament, Match, CareerTimelineEvent } from './types';

export const MOCK_ATHLETE_IDS = new Set<string>();

export function getMockActivityForAthlete(athleteId: string): AthleteActivity | null {
  const judoStartDate = '2020-09-01';
  
  const tournaments: Tournament[] = [
    {
      id: 'mock-tournament-1',
      athleteId,
      name: 'Bay Area Open 2024 (SAMPLE)',
      date: '2024-06-15',
      division: 'Juvenile -48kg',
      place: 2,
      medal: 'silver',
      ruleset: 'local_with_yuko',
      dataSource: 'mock',
      createdAt: new Date().toISOString(),
      matches: [
        {
          id: 'mock-match-1',
          tournamentId: 'mock-tournament-1',
          athleteId,
          opponentFirstName: 'Competitor',
          opponentLastInitial: 'A',
          result: 'win',
          terminalMethod: 'ippon',
          goldenScore: false,
          scoreEvents: [
            {
              id: 'mock-score-1',
              sequenceOrder: 1,
              eventType: 'ippon',
              points: 10,
              techniqueLabel: 'Seoi-nage',
              notes: 'Clean throw, full commitment'
            }
          ],
          penaltyEvents: [],
          dataSource: 'mock',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-match-2',
          tournamentId: 'mock-tournament-1',
          athleteId,
          opponentFirstName: 'Competitor',
          opponentLastInitial: 'B',
          result: 'win',
          terminalMethod: 'wazari_awasete_ippon',
          goldenScore: true,
          scoreEvents: [
            {
              id: 'mock-score-2',
              sequenceOrder: 1,
              eventType: 'wazari',
              points: 7,
              techniqueLabel: 'Uchi-mata',
            },
            {
              id: 'mock-score-3',
              sequenceOrder: 2,
              eventType: 'wazari',
              points: 7,
              techniqueLabel: 'Ko-uchi-gari',
              notes: 'Golden score winning technique'
            }
          ],
          penaltyEvents: [
            {
              id: 'mock-penalty-1',
              sequenceOrder: 1,
              penaltyType: 'shido',
              recipient: 'opponent',
              reason: 'False attack'
            }
          ],
          dataSource: 'mock',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-match-3',
          tournamentId: 'mock-tournament-1',
          athleteId,
          opponentFirstName: 'Opponent',
          opponentLastInitial: 'C',
          result: 'loss',
          terminalMethod: 'decision',
          goldenScore: false,
          scoreEvents: [
            {
              id: 'mock-score-4',
              sequenceOrder: 1,
              eventType: 'yuko',
              points: 5,
              notes: 'Opponent scored'
            },
            {
              id: 'mock-score-5',
              sequenceOrder: 2,
              eventType: 'wazari',
              points: 7,
              notes: 'Opponent scored via counter'
            }
          ],
          penaltyEvents: [],
          dataSource: 'mock',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-match-4',
          tournamentId: 'mock-tournament-1',
          athleteId,
          opponentFirstName: 'Opponent',
          opponentLastInitial: 'D',
          result: 'loss',
          terminalMethod: 'hansoku_make',
          goldenScore: false,
          scoreEvents: [],
          penaltyEvents: [
            {
              id: 'mock-penalty-2',
              sequenceOrder: 1,
              penaltyType: 'shido',
              recipient: 'athlete',
              reason: 'Passivity'
            },
            {
              id: 'mock-penalty-3',
              sequenceOrder: 2,
              penaltyType: 'shido',
              recipient: 'athlete',
              reason: 'Defensive posture'
            },
            {
              id: 'mock-penalty-4',
              sequenceOrder: 3,
              penaltyType: 'shido',
              recipient: 'athlete',
              reason: 'Avoiding grip'
            }
          ],
          dataSource: 'mock',
          createdAt: new Date().toISOString(),
        }
      ]
    },
    {
      id: 'mock-tournament-2',
      athleteId,
      name: 'NorCal Spring Championships (SAMPLE)',
      date: '2024-03-10',
      division: 'Juvenile -48kg',
      place: 3,
      medal: 'bronze',
      ruleset: 'ijf_post_2017',
      dataSource: 'mock',
      createdAt: new Date().toISOString(),
      matches: [
        {
          id: 'mock-match-5',
          tournamentId: 'mock-tournament-2',
          athleteId,
          opponentFirstName: 'Rival',
          opponentLastInitial: 'E',
          result: 'win',
          terminalMethod: 'wazari_awasete_ippon',
          goldenScore: false,
          scoreEvents: [
            {
              id: 'mock-score-6',
              sequenceOrder: 1,
              eventType: 'wazari',
              points: 7,
              techniqueLabel: 'O-uchi-gari',
            },
            {
              id: 'mock-score-7',
              sequenceOrder: 2,
              eventType: 'wazari',
              points: 7,
              techniqueLabel: 'Seoi-nage',
            }
          ],
          penaltyEvents: [],
          dataSource: 'mock',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-match-6',
          tournamentId: 'mock-tournament-2',
          athleteId,
          opponentFirstName: 'Rival',
          opponentLastInitial: 'F',
          result: 'loss',
          terminalMethod: 'ippon',
          goldenScore: false,
          scoreEvents: [
            {
              id: 'mock-score-8',
              sequenceOrder: 1,
              eventType: 'ippon',
              points: 10,
              notes: 'Opponent ippon via counter-throw'
            }
          ],
          penaltyEvents: [
            {
              id: 'mock-penalty-5',
              sequenceOrder: 1,
              penaltyType: 'shido',
              recipient: 'athlete',
              reason: 'Gripping below belt'
            }
          ],
          dataSource: 'mock',
          createdAt: new Date().toISOString(),
        }
      ]
    }
  ];

  return {
    athleteId,
    judoStartDate,
    careerTimeline: [],
    tournaments,
  };
}

export function enableMockDataForAthlete(athleteId: string): void {
  MOCK_ATHLETE_IDS.add(athleteId);
}

export function disableMockDataForAthlete(athleteId: string): void {
  MOCK_ATHLETE_IDS.delete(athleteId);
}

export function hasMockData(athleteId: string): boolean {
  return MOCK_ATHLETE_IDS.has(athleteId);
}
