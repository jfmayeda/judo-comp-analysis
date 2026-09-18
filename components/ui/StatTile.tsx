import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function StatTile({ label, value, tone, size = 'md', className }: { label: ReactNode; value: ReactNode; tone?: 'accent' | 'warning'; size?: 'md' | 'sm'; className?: string }) {
  return (
    <div className={cn('stat-tile', tone === 'accent' && 'stat-tile-accent', tone === 'warning' && 'stat-tile-warning', className)}>
      <span className="stat-tile-label">{label}</span>
      <span className={cn('stat-tile-value', size === 'sm' && 'stat-tile-value-sm')}>{value}</span>
    </div>
  );
}
