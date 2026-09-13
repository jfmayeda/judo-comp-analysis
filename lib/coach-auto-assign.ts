import { TournamentDayEntry, Coach, AthleteWithNotes } from './types';

type EntryWithAthlete = TournamentDayEntry & {
  athlete: AthleteWithNotes;
};

export type ConflictWarning = {
  entryId: string;
  athleteName: string;
  coachId: string;
  coachName: string;
  type: 'time_overlap' | 'mat_conflict' | 'exclusive_violation';
  message: string;
  conflictingEntries: Array<{
    entryId: string;
    athleteName: string;
    matNumber?: string | null;
    timeWindow?: string | null;
  }>;
};

export type AssignmentProposal = {
  entryId: string;
  proposedCoachId: string;
  reason: string;
};

type CoachLoad = {
  coachId: string;
  assignedMats: Set<string>;
  assignedCount: number;
  timeWindows: Array<{ entryId: string; timeWindow: string }>;
};

/**
 * Parse time window string to get start and end times
 * Supports formats like "9:00-10:00 AM", "9:00 AM-10:00 AM", "9-10am"
 */
function parseTimeWindow(timeWindow: string): { start: number; end: number } | null {
  if (!timeWindow) return null;
  
  const cleaned = timeWindow.toLowerCase().trim();
  
  // Match patterns like "9:00-10:00 AM" or "9-10am" or "9:00am-10:00am"
  const patterns = [
    /(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/,
    /(\d{1,2})\s*-\s*(\d{1,2})\s*(am|pm)/,
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      try {
        let startHour = parseInt(match[1]);
        const startMin = match[2] ? parseInt(match[2]) : 0;
        const startPeriod = match[3];
        
        let endHour = parseInt(match[4] || match[2]);
        const endMin = match[5] ? parseInt(match[5]) : 0;
        const endPeriod = match[6] || match[3];
        
        // Convert to 24-hour format
        if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
        if (startPeriod === 'am' && startHour === 12) startHour = 0;
        if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
        if (endPeriod === 'am' && endHour === 12) endHour = 0;
        
        const start = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;
        
        if (start < end) {
          return { start, end };
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Check if two time windows overlap
 */
function timeWindowsOverlap(tw1: string | null | undefined, tw2: string | null | undefined): boolean {
  if (!tw1 || !tw2) return false;
  
  const parsed1 = parseTimeWindow(tw1);
  const parsed2 = parseTimeWindow(tw2);
  
  if (!parsed1 || !parsed2) {
    // If we can't parse, do a simple string comparison
    return tw1.toLowerCase().trim() === tw2.toLowerCase().trim();
  }
  
  // Check for overlap: start1 < end2 && start2 < end1
  return parsed1.start < parsed2.end && parsed2.start < parsed1.end;
}

/**
 * Auto-assign coaches to tournament day entries based on constraints
 * 
 * Constraints (in order):
 * 1. Skip no_coach_needed entries
 * 2. Locked preferred coach → always that coach
 * 3. Exclusive coach → only their dedicated athlete(s)
 * 4. Prefer preferred coach when free
 * 5. Prefer keeping a coach on 1-2 mats max
 * 6. Avoid overlapping time windows on different mats when parseable
 */
export function autoAssignCoaches(
  entries: EntryWithAthlete[],
  coaches: Coach[]
): {
  proposals: AssignmentProposal[];
  conflicts: ConflictWarning[];
} {
  const proposals: AssignmentProposal[] = [];
  const conflicts: ConflictWarning[] = [];
  
  // Build coach load map (include already assigned entries)
  const coachLoads = new Map<string, CoachLoad>();
  coaches.forEach(coach => {
    coachLoads.set(coach.id, {
      coachId: coach.id,
      assignedMats: new Set(),
      assignedCount: 0,
      timeWindows: [],
    });
  });
  
  // Initialize coach loads with already assigned entries
  entries.forEach(entry => {
    if (entry.assignedCoachId && !entry.noCoachNeeded) {
      const load = coachLoads.get(entry.assignedCoachId);
      if (load) {
        load.assignedCount++;
        if (entry.matNumber) {
          load.assignedMats.add(entry.matNumber);
        }
        if (entry.timeWindow) {
          load.timeWindows.push({
            entryId: entry.id,
            timeWindow: entry.timeWindow,
          });
        }
      }
    }
  });
  
  // Find entries that need assignment
  const unassignedEntries = entries.filter(
    e => !e.noCoachNeeded && !e.assignedCoachId
  );
  
  // Build exclusive coach map (coach -> athlete IDs they're exclusive to)
  const exclusiveCoachMap = new Map<string, string[]>();
  entries.forEach(entry => {
    if (entry.athlete.preferredCoachId && entry.athlete.coachIsExclusive) {
      const athletes = exclusiveCoachMap.get(entry.athlete.preferredCoachId) || [];
      if (!athletes.includes(entry.athlete.id)) {
        athletes.push(entry.athlete.id);
      }
      exclusiveCoachMap.set(entry.athlete.preferredCoachId, athletes);
    }
  });
  
  // Process each unassigned entry
  for (const entry of unassignedEntries) {
    let assignedCoachId: string | null = null;
    let reason = '';
    
    const athlete = entry.athlete;
    
    // Constraint 1: Locked preferred coach
    if (athlete.isCoachLocked && athlete.preferredCoachId) {
      assignedCoachId = athlete.preferredCoachId;
      reason = 'Locked to preferred coach';
    }
    // Constraint 2: Preferred coach (if available and not exclusive to someone else)
    else if (athlete.preferredCoachId) {
      const exclusiveAthletes = exclusiveCoachMap.get(athlete.preferredCoachId);
      const isExclusiveToOther = exclusiveAthletes && !exclusiveAthletes.includes(athlete.id);
      
      if (!isExclusiveToOther) {
        assignedCoachId = athlete.preferredCoachId;
        reason = 'Preferred coach available';
      } else {
        // Can't use preferred coach, need to find another
        assignedCoachId = findBestAvailableCoach(
          entry,
          coaches,
          coachLoads,
          exclusiveCoachMap
        );
        reason = assignedCoachId 
          ? 'Preferred coach exclusive to another athlete' 
          : 'No available coach found';
      }
    }
    // No preference: find best available
    else {
      assignedCoachId = findBestAvailableCoach(
        entry,
        coaches,
        coachLoads,
        exclusiveCoachMap
      );
      reason = assignedCoachId ? 'Best available coach' : 'No available coach found';
    }
    
    if (assignedCoachId) {
      proposals.push({
        entryId: entry.id,
        proposedCoachId: assignedCoachId,
        reason,
      });
      
      // Update coach load for next iteration
      const load = coachLoads.get(assignedCoachId);
      if (load) {
        load.assignedCount++;
        if (entry.matNumber) {
          load.assignedMats.add(entry.matNumber);
        }
        if (entry.timeWindow) {
          load.timeWindows.push({
            entryId: entry.id,
            timeWindow: entry.timeWindow,
          });
        }
      }
    }
  }
  
  // Detect conflicts in proposals (and existing assignments)
  const allAssignments = new Map<string, string>(); // entryId -> coachId
  
  // Add existing assignments
  entries.forEach(entry => {
    if (entry.assignedCoachId && !entry.noCoachNeeded) {
      allAssignments.set(entry.id, entry.assignedCoachId);
    }
  });
  
  // Add proposals
  proposals.forEach(proposal => {
    allAssignments.set(proposal.entryId, proposal.proposedCoachId);
  });
  
  // Check for conflicts
  const entryMap = new Map(entries.map(e => [e.id, e]));
  
  for (const [entryId, coachId] of allAssignments) {
    const entry = entryMap.get(entryId);
    if (!entry) continue;
    
    const coachEmail = coaches.find(c => c.id === coachId)?.email || '';
    const coachName = coachEmail.split('@')[0];
    
    // Check for time overlaps
    if (entry.timeWindow) {
      const conflicting = Array.from(allAssignments.entries())
        .filter(([otherId, otherCoachId]) => {
          if (otherId === entryId) return false;
          if (otherCoachId !== coachId) return false;
          
          const other = entryMap.get(otherId);
          if (!other || !other.timeWindow) return false;
          
          return timeWindowsOverlap(entry.timeWindow, other.timeWindow);
        })
        .map(([otherId]) => {
          const other = entryMap.get(otherId)!;
          return {
            entryId: otherId,
            athleteName: `${other.athlete.firstName} ${other.athlete.lastInitial}.`,
            matNumber: other.matNumber,
            timeWindow: other.timeWindow,
          };
        });
      
      if (conflicting.length > 0) {
        conflicts.push({
          entryId,
          athleteName: `${entry.athlete.firstName} ${entry.athlete.lastInitial}.`,
          coachId,
          coachName,
          type: 'time_overlap',
          message: `${coachName} has overlapping time commitments`,
          conflictingEntries: conflicting,
        });
      }
    }
    
    // Check for exclusive coach violations
    const exclusiveAthletes = exclusiveCoachMap.get(coachId);
    if (exclusiveAthletes && exclusiveAthletes.length > 0) {
      const isExclusive = exclusiveAthletes.includes(entry.athlete.id);
      
      if (!isExclusive) {
        const exclusiveAthlete = entries.find(e => 
          exclusiveAthletes.includes(e.athlete.id)
        )?.athlete;
        
        if (exclusiveAthlete) {
          conflicts.push({
            entryId,
            athleteName: `${entry.athlete.firstName} ${entry.athlete.lastInitial}.`,
            coachId,
            coachName,
            type: 'exclusive_violation',
            message: `${coachName} is exclusive to ${exclusiveAthlete.firstName} ${exclusiveAthlete.lastInitial}.`,
            conflictingEntries: [],
          });
        }
      }
    }
  }
  
  return { proposals, conflicts };
}

/**
 * Find the best available coach for an entry
 * Prefers coaches with:
 * 1. Fewest mats assigned (1-2 max preferred)
 * 2. No time window conflicts
 */
function findBestAvailableCoach(
  entry: EntryWithAthlete,
  coaches: Coach[],
  coachLoads: Map<string, CoachLoad>,
  exclusiveCoachMap: Map<string, string[]>
): string | null {
  // Filter out exclusive coaches (coaches exclusive to other athletes)
  const availableCoaches = coaches.filter(coach => {
    const exclusiveAthletes = exclusiveCoachMap.get(coach.id);
    return !exclusiveAthletes || exclusiveAthletes.includes(entry.athlete.id);
  });
  
  if (availableCoaches.length === 0) return null;
  
  // Score each coach
  const scores = availableCoaches.map(coach => {
    const load = coachLoads.get(coach.id);
    if (!load) return { coachId: coach.id, score: 0 };
    
    let score = 100;
    
    // Penalty for number of mats (prefer 1-2 mats)
    const matCount = load.assignedMats.size;
    if (matCount === 0) {
      score += 20; // Prefer giving coaches their first assignment
    } else if (matCount === 1) {
      score += 10; // Good - one mat
      // Bonus if same mat as this entry
      if (entry.matNumber && load.assignedMats.has(entry.matNumber)) {
        score += 15;
      }
    } else if (matCount === 2) {
      score += 5; // OK - two mats
      // Bonus if one of the existing mats
      if (entry.matNumber && load.assignedMats.has(entry.matNumber)) {
        score += 10;
      }
    } else {
      score -= 20; // Penalty for 3+ mats
    }
    
    // Penalty for time conflicts
    if (entry.timeWindow) {
      const hasTimeConflict = load.timeWindows.some(tw => 
        timeWindowsOverlap(tw.timeWindow, entry.timeWindow!)
      );
      if (hasTimeConflict) {
        score -= 50; // Major penalty for time conflicts
      }
    }
    
    // Penalty for high load
    score -= load.assignedCount * 2;
    
    return { coachId: coach.id, score };
  });
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);
  
  return scores[0]?.coachId || null;
}

/**
 * Get a human-readable coach name from email
 */
export function getCoachName(coachId: string | null | undefined, coaches: Coach[]): string | null {
  if (!coachId) return null;
  const coach = coaches.find(c => c.id === coachId);
  return coach ? coach.email.split('@')[0] : null;
}
