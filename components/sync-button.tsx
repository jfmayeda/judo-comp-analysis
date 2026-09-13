'use client';

import { useState } from 'react';
import { useOnline } from '@/lib/online-context';

interface SyncButtonProps {
  tournamentDayId: string;
  athleteIds: string[];
  disabled?: boolean;
}

export function SyncButton({ tournamentDayId, athleteIds, disabled }: SyncButtonProps) {
  const { isOnline, syncTournamentDay, getCachedCount } = useOnline();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cachedCount, setCachedCount] = useState<number | null>(null);

  const handleSync = async () => {
    if (!isOnline || athleteIds.length === 0) {
      return;
    }

    setSyncing(true);
    setSyncStatus('idle');

    try {
      await syncTournamentDay(tournamentDayId, athleteIds);
      const count = await getCachedCount();
      setCachedCount(count);
      setSyncStatus('success');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="text-sm text-gray-600 italic">
        Connect to wifi to sync for offline access
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={disabled || syncing || athleteIds.length === 0}
        className={`btn-primary text-sm ${
          disabled || athleteIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {syncing ? (
          <>
            <span className="inline-block animate-spin mr-2">⟳</span>
            Syncing...
          </>
        ) : (
          <>
            📱 Ready for Tournament Day
          </>
        )}
      </button>

      {syncStatus === 'success' && (
        <span className="text-sm text-green-600 font-semibold">
          ✓ Cached {athleteIds.length} athlete{athleteIds.length !== 1 ? 's' : ''} for offline access
        </span>
      )}

      {syncStatus === 'error' && (
        <span className="text-sm text-red-600 font-semibold">
          ✗ Sync failed. Please try again.
        </span>
      )}
    </div>
  );
}
