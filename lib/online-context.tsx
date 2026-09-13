'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface OnlineContextType {
  isOnline: boolean;
  isSyncReady: boolean;
  syncTournamentDay: (tournamentDayId: string, athleteIds: string[]) => Promise<void>;
  clearCache: () => Promise<void>;
  getCachedCount: () => Promise<number>;
}

const OnlineContext = createContext<OnlineContextType>({
  isOnline: true,
  isSyncReady: false,
  syncTournamentDay: async () => {},
  clearCache: async () => {},
  getCachedCount: async () => 0,
});

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncReady, setIsSyncReady] = useState(false);

  useEffect(() => {
    // Initialize online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if we have cached data on mount
    checkCacheStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkCacheStatus = async () => {
    try {
      const count = await getCachedCount();
      setIsSyncReady(count > 0);
    } catch (error) {
      console.error('Error checking cache status:', error);
    }
  };

  const syncTournamentDay = async (tournamentDayId: string, athleteIds: string[]) => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      // Import data fetching functions
      const { getAthleteWithNotes, getTournamentDayById } = await import('@/lib/supabase-store');

      // Prefetch tournament day
      await getTournamentDayById(tournamentDayId);

      // Prefetch all athletes for this tournament day
      await Promise.all(
        athleteIds.map(athleteId => getAthleteWithNotes(athleteId))
      );

      // The service worker will intercept these requests and cache them
      setIsSyncReady(true);
    } catch (error) {
      console.error('Error syncing tournament day:', error);
      throw error;
    }
  };

  const clearCache = async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        return new Promise<void>((resolve, reject) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.success) {
              setIsSyncReady(false);
              resolve();
            } else {
              reject(new Error('Failed to clear cache'));
            }
          };

          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(
              { type: 'CLEAR_CACHE' },
              [messageChannel.port2]
            );
          } else {
            reject(new Error('No service worker controller'));
          }

          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Cache clear timeout')), 5000);
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  };

  const getCachedCount = async (): Promise<number> => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('data-v1');
        const keys = await cache.keys();
        // Count athlete detail requests
        const athleteRequests = keys.filter(req => 
          req.url.includes('/rest/v1/athletes?') || 
          req.url.includes('/rest/v1/opponent_notes')
        );
        return athleteRequests.length;
      }
      return 0;
    } catch (error) {
      console.error('Error getting cache count:', error);
      return 0;
    }
  };

  return (
    <OnlineContext.Provider
      value={{
        isOnline,
        isSyncReady,
        syncTournamentDay,
        clearCache,
        getCachedCount,
      }}
    >
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnline() {
  const context = useContext(OnlineContext);
  if (!context) {
    throw new Error('useOnline must be used within OnlineProvider');
  }
  return context;
}
