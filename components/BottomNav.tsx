'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconCalendar, IconShield, IconUsers } from '@/components/ui/Icons';
import { isCurrentPath } from './AppHeader';

const ITEMS = [
  { href: '/', label: 'Roster', Icon: IconUsers },
  { href: '/opponents', label: 'Opponents', Icon: IconShield },
  { href: '/tournament-day', label: 'Today', Icon: IconCalendar },
] as const;

/** Phone-only bottom tab bar (hidden ≥768px, where the header nav takes over). */
export function BottomNav() {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="bottom-nav no-print" aria-label="Primary">
      {ITEMS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="bottom-nav-item"
          aria-current={isCurrentPath(pathname, href) ? 'page' : undefined}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
