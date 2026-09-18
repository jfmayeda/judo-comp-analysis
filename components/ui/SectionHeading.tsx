import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type SectionHeadingProps = {
  title: ReactNode;
  count?: number | string | null;
  action?: ReactNode;
  as?: 'h2' | 'h3' | 'h4';
  id?: string;
  className?: string;
};

/** Small-caps section label with optional count and a right-aligned action. */
export function SectionHeading({ title, count, action, as: Tag = 'h2', id, className }: SectionHeadingProps) {
  return (
    <div className={cn('section-heading', className)}>
      <Tag id={id} className="section-heading-title">
        {title}
        {count !== undefined && count !== null ? (
          <span className="section-heading-count"> · {count}</span>
        ) : null}
      </Tag>
      {action ? <div className="flex-none">{action}</div> : null}
    </div>
  );
}
