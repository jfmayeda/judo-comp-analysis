'use client';

import { useEffect, useState } from 'react';
import { AthleteActivity } from '@/lib/types';
import { getAthleteActivity } from '@/lib/activity-store';
import CareerTimeline from './CareerTimeline';
import TournamentCard from './TournamentCard';
import MockDataBadge from './MockDataBadge';

type ActivitySectionProps = {
  athleteId: string;
};

export default function ActivitySection({ athleteId }: ActivitySectionProps) {
  const [activity, setActivity] = useState<AthleteActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [athleteId]);

  const loadActivity = async () => {
    try {
      const data = await getAthleteActivity(athleteId);
      setActivity(data);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <p className="text-gray-600">Loading activity...</p>
      </div>
    );
  }

  if (!activity || activity.tournaments.length === 0) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl">Activity</h3>
        <MockDataBadge />
      </div>

      {activity.careerTimeline.length > 0 && (
        <CareerTimeline events={activity.careerTimeline} />
      )}

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Tournaments
        </h4>
        <div>
          {activity.tournaments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
        </div>
      </div>
    </div>
  );
}
