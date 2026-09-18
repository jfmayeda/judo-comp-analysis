import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Marks content that is illustrative, not persisted. Never decorative. */
export function SampleDataTag({ className, label = 'Sample data' }: { className?: string; label?: string }) {
  return <span className={cn('sample-tag', className)}>{label}</span>;
}

export function SampleBand({ children, className, note }: { children: ReactNode; className?: string; note?: ReactNode }) {
  return (
    <div className={cn('sample-band', className)}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SampleDataTag />
        <span className="text-xs text-muted">{note ?? 'Illustrative only — not saved for this athlete.'}</span>
      </div>
      {children}
    </div>
  );
}
