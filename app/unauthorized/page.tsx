'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { AuthShell } from '@/components/AuthShell';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthShell title="Access not authorized" lead="This app is for invited Silicon Valley Judo coaches only.">
      <p className="text-sm text-body">
        {user?.email ? <><strong>{user.email}</strong> is not on the coach allowlist.</> : 'Your account is not on the coach allowlist.'}{' '}
        If you believe you should have access, contact your head coach or administrator.
      </p>
      <Button block onClick={handleLogout}>Sign out</Button>
    </AuthShell>
  );
}
