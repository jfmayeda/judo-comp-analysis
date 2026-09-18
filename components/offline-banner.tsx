'use client';

import { useOnline } from '@/lib/online-context';
import { IconWifiOff } from '@/components/ui/Icons';

/** Shown only while offline. Sits above the header so it is never hidden by it. */
export function OfflineBanner() {
  const { isOnline, isSyncReady } = useOnline();
  if (isOnline) return null;
  return (
    <div className="bg-yellow-100 text-yellow-800 border-b-2 border-yellow-200 px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 no-print" role="status">
      <IconWifiOff size={18} />
      {isSyncReady ? 'Offline — showing cached tournament data' : 'Offline — nothing cached yet. Reconnect and tap "Cache for offline".'}
    </div>
  );
}
