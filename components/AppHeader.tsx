'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import { IconArrowLeft, IconMore } from '@/components/ui/Icons';

export type AppHeaderProps = {
  /** Where the back affordance goes (detail pages). */
  backHref?: string;
  /** Short context label shown next to the logo (e.g. "Roster", "Assign coaches"). */
  eyebrow?: string;
  extraActions?: ReactNode;
  className?: string;
};

export const PRIMARY_NAV = [
  { href: '/', label: 'Roster' },
  { href: '/opponents', label: 'Opponents' },
  { href: '/tournament-day', label: 'Today' },
] as const;

export const ADMIN_NAV = [
  { href: '/invite', label: 'Coaches & techniques' },
  { href: '/admin/design-tokens', label: 'Design tokens' },
] as const;

export function isCurrentPath(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/athletes');
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Slim sticky navy header. Tablet+ shows inline nav; phone relies on the
 * BottomNav and keeps only the logo, an optional back link and the menu.
 */
export function AppHeader({ backHref, eyebrow, extraActions, className }: AppHeaderProps) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { isAdmin, signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className={cn('app-header no-print', className)}>
      <div className="app-header-inner">
        {backHref ? (
          <Link href={backHref} className="app-header-back" aria-label="Back">
            <IconArrowLeft />
          </Link>
        ) : null}
        <Link href="/" className="app-header-brand" aria-label="Silicon Valley Judo — Roster">
          <img src="/svj-logo-white.png" alt="" className="app-header-logo" />
        </Link>
        {eyebrow ? <span className="app-header-context">{eyebrow}</span> : null}
        <span className="app-header-spacer flex-1" />

        <nav className="app-header-nav" aria-label="Primary">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              aria-current={isCurrentPath(pathname, item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="app-header-tools">
          {extraActions}
          <div className="nav-menu" ref={menuRef}>
            <button
              type="button"
              className="nav-link"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="app-header-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <IconMore size={18} />
              <span className="visually-hidden md:not-sr-only md:ml-1">Menu</span>
            </button>
            {menuOpen ? (
              <div id="app-header-menu" role="menu" className="nav-menu-panel">
                <div className="md:hidden">
                  {PRIMARY_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="nav-menu-item"
                      aria-current={isCurrentPath(pathname, item.href) ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="nav-menu-divider" />
                </div>
                {isAdmin
                  ? ADMIN_NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="nav-menu-item"
                        aria-current={isCurrentPath(pathname, item.href) ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))
                  : null}
                {isAdmin ? <div className="nav-menu-divider" /> : null}
                {user?.email ? (
                  <div className="px-3 py-1 text-xs text-muted truncate" title={user.email}>
                    {user.email}
                  </div>
                ) : null}
                <button type="button" role="menuitem" className="nav-menu-item" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
