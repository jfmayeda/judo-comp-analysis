import type { ReactNode } from 'react';
import { AppHeader, type AppHeaderProps } from './AppHeader';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/cn';

export type AppFrameProps = AppHeaderProps & {
  children: ReactNode;
  /** Focused-form width (720px) instead of the 1200px board width. */
  narrow?: boolean;
  /** Content rendered above the page shell (e.g. offline banner). */
  banner?: ReactNode;
  mainClassName?: string;
};

/** App shell: sticky header + page shell + phone bottom nav. */
export function AppFrame({ children, narrow, banner, mainClassName, ...header }: AppFrameProps) {
  return (
    <div className="min-h-dvh">
      {banner}
      <AppHeader {...header} />
      <main className={cn('page-shell', narrow && 'page-shell--narrow', mainClassName)}>{children}</main>
      <BottomNav />
    </div>
  );
}
