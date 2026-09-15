'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DesignTokensGallery } from '@/components/admin/DesignTokensGallery';
import { Button } from '@/components/ui/Button';

export default function DesignTokensPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAllowlisted, isAdmin } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (isAllowlisted === false) {
      router.push('/unauthorized');
      return;
    }

    if (isAdmin === false) {
      router.push('/');
      return;
    }

    if (isAllowlisted === true && isAdmin === true) {
      setReady(true);
    }
  }, [user, authLoading, isAllowlisted, isAdmin, router]);

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen navy-field flex items-center justify-center">
        <p className="text-white">Loading design tokens...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="text-xl" aria-hidden>
              ←
            </span>
            <img
              src="/svj-logo-white.png"
              alt="Silicon Valley Judo"
              className="app-header-logo"
            />
            <p className="eyebrow text-white text-xs uppercase">Competitor Analysis</p>
          </Link>
          <Button as={Link} href="/invite" variant="secondary" size="sm">
            Invite Coaches
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <p className="eyebrow mb-2">Admin</p>
          <h2 className="text-3xl mb-2">Design Tokens</h2>
          <p className="text-svj-gray-600">
            Spot discrepancies against DESIGN.md and fix them at the token level. App UI uses the
            neo-SVJ hybrid (thick border, offset shadow), not marketing soft elevation.
          </p>
        </div>
        <DesignTokensGallery />
      </div>
    </div>
  );
}
