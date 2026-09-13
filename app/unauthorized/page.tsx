'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

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
    <div className="min-h-screen navy-field flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="wordmark text-3xl mb-2 tracking-wide">SILICON VALLEY JUDO</h1>
          <p className="eyebrow text-white">Competitor Analysis</p>
        </div>

        <div className="card p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl mb-3 text-gray-900 font-bold uppercase tracking-wide">
              Access Not Authorized
            </h2>
            <p className="text-gray-700 mb-4">
              Your account ({user?.email}) is not authorized to access this application.
            </p>
            <p className="text-gray-600 text-sm">
              This app is for invited Silicon Valley Judo coaches only. If you believe you should have access, please contact your head coach or administrator.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="btn-primary w-full"
            >
              Sign Out
            </button>
          </div>
        </div>

        <p className="text-center text-white text-sm mt-6 opacity-80">
          Privacy-first competitor analysis for Silicon Valley Judo coaches
        </p>
      </div>
    </div>
  );
}
