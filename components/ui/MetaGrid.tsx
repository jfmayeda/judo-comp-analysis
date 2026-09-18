import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type MetaGridItem = { label: string; value: ReactNode; capitalize?: boolean };

/** Key/value grid for identity facts (belt, stance, weight, division). Empty values are skipped. */
export function MetaGrid({ items, className }: { items: MetaGridItem[]; className?: string }) {
  const visible = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '');
  if (visible.length === 0) return null;
  return (
    <dl className={cn('meta-grid', className)}>
      {visible.map((item) => (
        <div key={item.label} className="meta-grid-item">
          <dt className="meta-key">{item.label}</dt>
          <dd className={cn('meta-value', item.capitalize && 'capitalize')}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
