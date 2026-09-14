'use client';

import { useEffect, useState } from 'react';
import { BadgeWithDefinition } from '@/lib/badge-store';
import { getAthleteBadges } from '@/lib/badge-store';
import MockDataBadge from './MockDataBadge';

type BadgesSectionProps = {
  athleteId: string;
};

export default function BadgesSection({ athleteId }: BadgesSectionProps) {
  const [badges, setBadges] = useState<BadgeWithDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [athleteId]);

  const loadBadges = async () => {
    try {
      const data = await getAthleteBadges(athleteId);
      setBadges(data);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <p className="text-gray-600">Loading badges...</p>
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl">Badges</h3>
        <MockDataBadge />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {badges.map(({ earned, definition }) => (
          <div
            key={earned.badgeId}
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-24 h-24 mb-3">
              <img
                src={definition.imagePath}
                alt={definition.name}
                className="w-full h-full object-contain"
              />
            </div>
            
            <h4 className="font-semibold text-gray-900 text-center mb-1">
              {definition.name}
              {earned.tier && (
                <span className="ml-2 text-xs uppercase font-bold" style={{
                  color: earned.tier === 'gold' ? '#d4af37' : 
                         earned.tier === 'silver' ? '#c0c0c0' : '#cd7f32'
                }}>
                  {earned.tier}
                </span>
              )}
            </h4>
            
            <p className="text-xs text-gray-600 text-center mb-2">
              {definition.description}
            </p>
            
            <p className="text-xs text-gray-500">
              Earned {new Date(earned.earnedDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            
            {earned.notes && (
              <p className="text-xs text-gray-500 italic mt-1 text-center">
                {earned.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
