'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

type GateOptions = {
  /** Require admin as well as allowlist membership. */
  admin?: boolean;
  /** Let a linked family login view this page. Coach tools stay gated in the UI. */
  allowFamily?: boolean;
  /** Called once the user is allowed in. */
  onReady?: () => void;
};

/**
 * Coach access gate shared by every protected page. Behaviour is identical to
 * the effect previously copied into each page: unauthenticated → /login,
 * not allowlisted → /unauthorized, (optionally) not admin → /.
 * Returns whether the page may render its data.
 */
export function useCoachGate({ admin = false, allowFamily = false, onReady }: GateOptions = {}): {
  ready: boolean;
  checking: boolean;
} {
  const router = useRouter();
  const { user, loading, isAllowlisted, isAdmin, isFamily } = useAuth();

  const familyReady = allowFamily && isFamily === true;
  const ready =
    !loading && !!user && (isAllowlisted === true || familyReady) && (!admin || isAdmin === true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (isAllowlisted === false) {
      if (allowFamily && isFamily === null) return;
      if (!familyReady) {
        router.push('/unauthorized');
        return;
      }
    }
    if (admin && isAdmin === false) {
      router.push('/');
      return;
    }
    if (isAllowlisted === true && (!admin || isAdmin === true)) {
      onReady?.();
      return;
    }
    if (familyReady) {
      onReady?.();
    }
    // onReady is intentionally excluded: pages pass an inline loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isAllowlisted, isAdmin, isFamily, admin, allowFamily, router]);

  return {
    ready,
    checking:
      loading ||
      (!!user && isAllowlisted === null) ||
      (allowFamily && !!user && isAllowlisted === false && isFamily === null),
  };
}
