import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Bottom-pinned action row for long forms; safe-area aware, above the bottom nav. */
export function StickyActions({ children, status, className }: { children: ReactNode; status?: ReactNode; className?: string }) {
  return (
    <div className={cn('sticky-actions', className)}>
      {status ? <div className="sticky-actions-status">{status}</div> : null}
      {children}
    </div>
  );
}
