import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type PageHeaderProps = {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Page title anatomy: kicker (once per page) → h1 → lead → actions. */
export function PageHeader({ kicker, title, lead, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('page-header', className)}>
      <div className="page-header-copy">
        {kicker ? <p className="page-kicker mb-1">{kicker}</p> : null}
        <h1 className="page-title">{title}</h1>
        {lead ? <p className="page-lead">{lead}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}
