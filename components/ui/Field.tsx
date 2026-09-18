'use client';

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type FieldProps = {
  label: ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  className?: string;
  /** A single form control; `id`, `aria-describedby` and `aria-invalid` are injected. */
  children: ReactElement<Record<string, unknown>>;
};

/** Label + control + hint/error, wired for screen readers and label taps. */
export function Field({ label, required, optional, hint, error, id: idProp, className, children }: FieldProps) {
  const generated = useId();
  const id = idProp ?? `field-${generated}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })
    : children;

  return (
    <div className={cn('field', className)}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="field-required" aria-hidden>*</span> : null}
        {optional ? <span className="field-optional">optional</span> : null}
      </label>
      {control}
      {hint ? <p id={hintId} className="field-hint">{hint}</p> : null}
      {error ? <p id={errorId} className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}
