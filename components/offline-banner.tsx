'use client';

import { useOnline } from '@/lib/online-context';

export function OfflineBanner() {
  const { isOnline, isSyncReady } = useOnline();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-3 text-center font-semibold text-sm">
      {isSyncReady ? (
        <>
          📡 Offline Mode — Viewing cached tournament data
        </>
      ) : (
        <>
          ⚠️ Offline — No cached data available. Connect to sync for offline access.
        </>
      )}
    </div>
  );
}
