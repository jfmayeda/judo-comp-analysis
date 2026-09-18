import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function StatTile({ label, value, tone, className }: { label: ReactNode; value: ReactNode; tone?: 'accent' | 'warning'; className?: string }) {
  return (
    <div className={cn('stat-tile', tone === 'accent' && 'stat-tile-accent', tone === 'warning' && 'stat-tile-warning', className)}>
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-value">{value}</span>
    </div>
  );
}
