import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
} from 'react';
import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'dark' | 'selected';

type CardOwnProps = {
  variant?: CardVariant;
};

export type CardProps<T extends ElementType = 'div'> = CardOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps | 'as'>;

export function Card<T extends ElementType = 'div'>({
  as,
  variant = 'default',
  className,
  ...rest
}: CardProps<T>): ReactElement {
  const Comp = (as ?? 'div') as ElementType;
  return (
    <Comp
      className={cn(
        'card',
        variant === 'dark' && 'card-dark',
        variant === 'selected' && 'card-selected',
        className,
      )}
      {...rest}
    />
  );
}
