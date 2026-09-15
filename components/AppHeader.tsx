'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export type AppHeaderProps = {
  backHref?: string;
  eyebrow?: string;
  extraActions?: ReactNode;
  className?: string;
};

const NAV = [
  { href: '/', label: 'Roster' },
  { href: '/opponents', label: 'Opponents' },
  { href: '/tournament-day', label: 'Tournament Day' },
] as const;

const ADMIN_NAV = [
  { href: '/invite', label: 'Invite Coaches' },
  { href: '/admin/design-tokens', label: 'Design Tokens' },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({
  backHref,
  eyebrow = 'Competitor Analysis',
  extraActions,
  className,
}: AppHeaderProps) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const showNav = backHref == null;

  const navLinks = (
    <>
      {NAV.map((item) => (
        <Button
          key={item.href}
          as={Link}
          href={item.href}
          variant="secondary"
          size="sm"
          aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
        >
          {item.label}
        </Button>
      ))}
      {isAdmin
        ? ADMIN_NAV.map((item) => (
            <Button
              key={item.href}
              as={Link}
              href={item.href}
              variant="secondary"
              size="sm"
              aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
            >
              {item.label}
            </Button>
          ))
        : null}
      <Button onClick={handleSignOut} variant="secondary" size="sm">
        Sign Out
      </Button>
    </>
  );

  const brand = (
    <>
      <span className="app-header-brand-mark">
        {backHref ? (
          <span className="app-header-back" aria-hidden>
            ←
          </span>
        ) : null}
        <img
          src="/svj-logo-white.png"
          alt="Silicon Valley Judo"
          className="app-header-logo"
        />
      </span>
      <p className="eyebrow app-header-eyebrow">{eyebrow}</p>
    </>
  );

  return (
    <header className={cn('app-header', className)}>
      <div className="app-header-inner">
        {backHref ? (
          <Link href={backHref} className="app-header-brand">
            {brand}
          </Link>
        ) : (
          <Link href="/" className="app-header-brand">
            {brand}
          </Link>
        )}

        {showNav || extraActions ? (
          <div className="app-header-tools">
            {extraActions}
            {showNav ? (
              <details className="app-header-menu">
                <summary className="btn-secondary btn-sm app-header-menu-toggle">
                  Menu
                </summary>
                <nav className="app-header-nav" aria-label="App">
                  {navLinks}
                </nav>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
