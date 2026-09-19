import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconChevronDown } from './Icons';

export type DisclosureProps = {
  title: ReactNode;
  hint?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

/** Progressive-disclosure group built on native <details> (keyboard + a11y for free). */
export function Disclosure({ title, hint, defaultOpen, children, className }: DisclosureProps) {
  return (
    <details className={cn('disclosure', className)} open={defaultOpen}>
      <summary>
        <span className="disclosure-summary-copy">
          <span>{title}</span>
          {hint ? <span className="disclosure-summary-hint">{hint}</span> : null}
        </span>
        <IconChevronDown className="disclosure-chevron" />
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
