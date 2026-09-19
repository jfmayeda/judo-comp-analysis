import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconAlert, IconCheck, IconInfo } from './Icons';

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger' | 'muted';

export type NoticeProps = {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
  icon?: boolean;
};

const toneClass: Record<NoticeTone, string> = {
  info: '',
  success: 'notice-success',
  warning: 'notice-warning',
  danger: 'notice-danger',
  muted: 'notice-muted',
};

function ToneIcon({ tone }: { tone: NoticeTone }) {
  if (tone === 'success') return <IconCheck size={18} className="flex-none mt-0.5" />;
  if (tone === 'warning' || tone === 'danger') return <IconAlert size={18} className="flex-none mt-0.5" />;
  return <IconInfo size={18} className="flex-none mt-0.5" />;
}

/** Inline feedback block. Use `role="alert"` for errors, `status` for saves. */
export function Notice({ tone = 'info', title, children, className, role, icon = true }: NoticeProps) {
  const resolvedRole = role ?? (tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : undefined);
  return (
    <div className={cn('notice', toneClass[tone], className)} role={resolvedRole}>
      {icon ? <ToneIcon tone={tone} /> : null}
      <div className="notice-body">
        {title ? <span className="notice-title">{title}</span> : null}
        {children}
      </div>
    </div>
  );
}
