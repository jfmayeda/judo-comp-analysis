import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
} from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export type ButtonProps<T extends ElementType = 'button'> = ButtonOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps | 'as'>;

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export function Button<T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps<T>): ReactElement {
  const Comp = (as ?? 'button') as ElementType;
  const isNativeButton = Comp === 'button';
  return (
    <Comp
      className={cn(variantClass[variant], size === 'sm' && 'btn-sm', className)}
      {...(isNativeButton ? { type: (rest as { type?: string }).type ?? 'button' } : {})}
      {...rest}
    />
  );
}
