'use client';

import { useState } from 'react';
import { useOnline } from '@/lib/online-context';
import { Button } from '@/components/ui/Button';
import { IconDownload } from '@/components/ui/Icons';

interface SyncButtonProps {
  tournamentDayId: string;
  athleteIds: string[];
  disabled?: boolean;
}

/** Prefetches the selected athletes so the service worker can serve them offline. */
export function SyncButton({ tournamentDayId, athleteIds, disabled }: SyncButtonProps) {
  const { isOnline, syncTournamentDay, getCachedCount } = useOnline();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    if (!isOnline || athleteIds.length === 0) return;
    setSyncing(true);
    setSyncStatus('idle');
    try {
      await syncTournamentDay(tournamentDayId, athleteIds);
      await getCachedCount();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  if (!isOnline) {
    return <p className="text-sm text-muted">Connect to Wi-Fi to cache profiles for offline use.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" onClick={handleSync} disabled={disabled || syncing || athleteIds.length === 0}>
        <IconDownload size={16} />
        {syncing ? 'Caching…' : 'Cache for offline'}
      </Button>
      {syncStatus === 'success' ? (
        <span className="text-sm text-green-700 font-semibold" role="status">
          Cached {athleteIds.length} athlete{athleteIds.length === 1 ? '' : 's'} for offline access
        </span>
      ) : null}
      {syncStatus === 'error' ? (
        <span className="text-sm text-red-700 font-semibold" role="alert">Caching failed. Try again.</span>
      ) : null}
    </div>
  );
}
