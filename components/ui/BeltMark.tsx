import type { JudoBelt } from '@/lib/types';
import { formatBeltName } from '@/lib/belt-utils';
import { cn } from '@/lib/cn';

const BELT_COLOR: Partial<Record<JudoBelt, string>> = {
  white: 'var(--svj-belt-white)',
  yellow: 'var(--svj-belt-yellow)',
  orange: 'var(--svj-belt-orange)',
  green: 'var(--svj-belt-green)',
  blue: 'var(--svj-belt-blue)',
  brown: 'var(--svj-belt-brown)',
};

export function beltColor(belt: JudoBelt | null | undefined): string {
  if (!belt || belt === 'unset') return 'var(--svj-gray-200)';
  return BELT_COLOR[belt] ?? 'var(--svj-belt-black)';
}

/** Rank as a small belt-coloured stripe plus its name. */
export function BeltMark({ belt, className, short }: { belt: JudoBelt | null | undefined; className?: string; short?: boolean }) {
  if (!belt || belt === 'unset') {
    return <span className={cn('belt-mark text-muted font-normal', className)}>Belt not set</span>;
  }
  const name = formatBeltName(belt);
  return (
    <span className={cn('belt-mark', className)}>
      <span className="belt-mark-swatch" style={{ ['--belt-color' as string]: beltColor(belt) }} aria-hidden />
      <span>{short ? name.replace(/\s*\(.*\)$/, '') : name}</span>
    </span>
  );
}
