import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type EmptyStateProps = {
  title: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function EmptyState({ title, body, actions, compact, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', compact && 'empty-state--compact', className)}>
      <p className="empty-state-title">{title}</p>
      {body ? <p className="empty-state-body">{body}</p> : null}
      {actions ? <div className="empty-state-actions">{actions}</div> : null}
    </div>
  );
}
