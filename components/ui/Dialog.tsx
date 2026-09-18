'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconClose } from './Icons';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** Prevent closing via scrim/Escape while a destructive action runs. */
  locked?: boolean;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: role="dialog", labelled by its title, Escape to close,
 * focus moves inside on open and returns to the opener on close, Tab wraps.
 * Bottom sheet on phone, centred panel from 640px.
 */
export function Dialog({ open, onClose, title, subtitle, children, footer, wide, locked }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !locked) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      const opener = openerRef.current as HTMLElement | null;
      opener?.focus?.();
    };
  }, [open, onClose, locked]);

  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-scrim" aria-hidden onClick={locked ? undefined : onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn('dialog-panel', wide && 'dialog-panel--wide')}
      >
        <div className="dialog-header">
          <div className="min-w-0">
            <h2 id={titleId} className="dialog-title">{title}</h2>
            {subtitle ? <p className="dialog-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="btn-icon -mr-2 -mt-1" onClick={onClose} disabled={locked} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer ? <div className="dialog-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
