'use client';

import { useEffect, useState } from 'react';
import { BadgeWithProgress, BadgeTier } from '@/lib/badge-store';
import { getAthleteBadgeProgress } from '@/lib/badge-store';
import MockDataBadge from './MockDataBadge';

type BadgesSectionProps = {
  athleteId: string;
};

const TIER_COLORS = {
  white: '#FFFFFF',
  blue: '#4169E1',
  brown: '#8B4513',
  black: '#000000',
};

const TIER_LABELS = {
  white: 'White',
  blue: 'Blue',
  brown: 'Brown',
  black: 'Black',
};

export default function BadgesSection({ athleteId }: BadgesSectionProps) {
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [athleteId]);

  const loadBadges = async () => {
    try {
      const data = await getAthleteBadgeProgress(athleteId);
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
    <>
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl">Badges</h3>
          <MockDataBadge />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {badges.map(({ progress, definition }) => (
            <div
              key={definition.id}
              onClick={() => setSelectedBadge({ progress, definition })}
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
            >
              <div 
                className="relative w-20 h-20 rounded-full p-1"
                style={{
                  border: `4px solid ${progress.earnedTier ? TIER_COLORS[progress.earnedTier] : '#E5E7EB'}`,
                  backgroundColor: progress.earnedTier ? 'rgba(0,0,0,0.05)' : 'transparent',
                }}
              >
                <img
                  src={definition.imagePath}
                  alt={definition.name}
                  className="w-full h-full object-contain rounded-full"
                  style={{
                    opacity: progress.earnedTier ? 1 : 0.4,
                  }}
                />
              </div>
              
              {/* Progress bar under badge */}
              {!progress.isMaxed && progress.earnedTier && (
                <div className="w-full mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all"
                    style={{
                      width: `${progress.progressFraction * 100}%`,
                    }}
                  />
                </div>
              )}
              
              <p className="text-xs text-gray-900 text-center mt-1 font-medium">
                {definition.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedBadge.definition.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedBadge.definition.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Ring */}
            <div className="flex justify-center my-8">
              <div className="relative">
                <svg width="180" height="180" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  {selectedBadge.progress.earnedTier && (
                    <circle
                      cx="90"
                      cy="90"
                      r="75"
                      fill="none"
                      stroke={selectedBadge.progress.isMaxed ? TIER_COLORS.black : '#06B6D4'}
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 75}`}
                      strokeDashoffset={`${2 * Math.PI * 75 * (1 - selectedBadge.progress.progressFraction)}`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img
                    src={selectedBadge.definition.imagePath}
                    alt={selectedBadge.definition.name}
                    className="w-24 h-24 object-contain opacity-20"
                  />
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {selectedBadge.progress.currentCount}
                    {selectedBadge.progress.nextTarget && (
                      <span className="text-lg text-gray-400">
                        /{selectedBadge.progress.nextTarget}
                      </span>
                    )}
                  </p>
                  {selectedBadge.progress.isMaxed && (
                    <p className="text-sm text-gray-600 font-semibold">MAXED</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tier Row */}
            <div className="flex justify-center items-center gap-3 mb-6">
              {(['white', 'blue', 'brown', 'black'] as BadgeTier[]).map((tier) => {
                const isEarned = selectedBadge.progress.earnedTier && 
                  (['white', 'blue', 'brown', 'black'].indexOf(selectedBadge.progress.earnedTier) >= 
                   ['white', 'blue', 'brown', 'black'].indexOf(tier));
                const isCurrent = selectedBadge.progress.earnedTier === tier;
                const threshold = selectedBadge.definition.tiers[tier];
                
                return (
                  <div key={tier} className="flex flex-col items-center">
                    <div 
                      className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: isEarned ? TIER_COLORS[tier] : '#E5E7EB',
                        border: isCurrent ? '3px solid #06B6D4' : '2px solid transparent',
                        boxShadow: isCurrent ? '0 0 12px rgba(6, 182, 212, 0.5)' : 'none',
                        opacity: isEarned ? 1 : 0.4,
                      }}
                    >
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs mt-1 font-medium" style={{
                      color: isEarned ? TIER_COLORS[tier === 'white' ? 'black' : tier] : '#9CA3AF'
                    }}>
                      {TIER_LABELS[tier]}
                    </p>
                    <p className="text-xs text-gray-500">{threshold}</p>
                  </div>
                );
              })}
            </div>

            {/* Category */}
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize">
                {selectedBadge.definition.category}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
