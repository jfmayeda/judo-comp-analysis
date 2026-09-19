import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
} from 'react';
import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'dark' | 'selected';

type CardOwnProps = {
  variant?: CardVariant;
  /** The whole card is a control (link or toggle): enables hover/press affordance. */
  interactive?: boolean;
};

export type CardProps<T extends ElementType = 'div'> = CardOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps | 'as'>;

/**
 * Surface card. Plain cards never change on hover; pass `interactive` (or
 * render `as={Link}`) when the card itself is clickable.
 */
export function Card<T extends ElementType = 'div'>({
  as,
  variant = 'default',
  interactive,
  className,
  ...rest
}: CardProps<T>): ReactElement {
  const Comp = (as ?? 'div') as ElementType;
  const isControl = interactive ?? (as !== undefined && as !== 'div' && as !== 'section' && as !== 'article');
  return (
    <Comp
      className={cn(
        'card',
        isControl && 'card-link',
        variant === 'dark' && 'card-dark',
        variant === 'selected' && 'card-selected',
        className,
      )}
      {...rest}
    />
  );
}
