import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

export type ChipProps = ComponentPropsWithoutRef<'button'> & {
  pressed?: boolean;
  size?: 'md' | 'lg';
};

/** Toggle chip: a button with aria-pressed. */
export function Chip({ pressed = false, size = 'md', className, type, ...rest }: ChipProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn('chip-toggle', size === 'lg' && 'chip-lg', className)}
      aria-pressed={pressed}
      {...rest}
    />
  );
}

export type PillTone = 'brand' | 'navy' | 'outline' | 'success' | 'danger' | 'warning' | 'muted';

export type PillProps = ComponentPropsWithoutRef<'span'> & {
  tone?: PillTone;
};

const pillTone: Record<PillTone, string> = {
  brand: '',
  navy: 'pill-navy',
  outline: 'pill-outline',
  success: 'pill-success',
  danger: 'pill-danger',
  warning: 'pill-warning',
  muted: 'pill-muted',
};

/** Status label. Not a control. */
export function Pill({ tone = 'brand', className, ...rest }: PillProps) {
  return <span className={cn('pill', pillTone[tone], className)} {...rest} />;
}

/** Quiet sentence-case tag for technique names. */
export function Tag({ className, tone, ...rest }: ComponentPropsWithoutRef<'span'> & { tone?: 'blue' | 'navy' }) {
  return <span className={cn('tag', tone === 'navy' && 'tag-navy', className)} {...rest} />;
}
