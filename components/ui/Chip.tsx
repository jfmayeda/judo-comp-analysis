import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

export type ChipProps = ComponentPropsWithoutRef<'button'> & {
  pressed?: boolean;
};

export function Chip({ pressed = false, className, type, ...rest }: ChipProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn('chip-toggle', className)}
      aria-pressed={pressed}
      {...rest}
    />
  );
}

export type PillTone = 'brand' | 'navy';

export type PillProps = ComponentPropsWithoutRef<'span'> & {
  tone?: PillTone;
};

export function Pill({ tone = 'brand', className, ...rest }: PillProps) {
  return (
    <span className={cn('pill', tone === 'navy' && 'pill-navy', className)} {...rest} />
  );
}
