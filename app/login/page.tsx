'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseClient } from '@/lib/supabase';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = searchParams.get('redirectTo') || '/';
      router.push(redirectTo);
    }
  }, [user, authLoading, router, searchParams]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const redirectTo = searchParams.get('redirectTo') || '/';
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${searchParams.get('redirectTo') || '/'}`,
        },
      });

      if (signInError) throw signInError;

      setMessage('Check your email for the login link!');
      setEmail('');
    } catch (err: unknown) {
      console.error('Magic link error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen navy-field flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo Wordmark */}
        <div className="text-center mb-8">
          <h1 className="wordmark text-3xl mb-2 tracking-wide">SILICON VALLEY JUDO</h1>
          <p className="eyebrow text-white">Competitor Analysis</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl mb-2 text-center text-gray-900 font-bold uppercase tracking-wide">Coach Login</h2>
            <p className="text-center text-gray-600 text-sm">
              Access athlete profiles and tournament-day scouting notes
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded text-sm bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded text-sm bg-blue-50 text-blue-800 border border-blue-200">
              {message}
            </div>
          )}

          {!useMagicLink ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input w-full"
                  placeholder="coach@svjudo.com"
                />
              </div>
              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input w-full"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkLogin} className="space-y-5">
              <div>
                <label className="eyebrow block text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input w-full"
                  placeholder="coach@svjudo.com"
                />
              </div>
              <p className="text-sm text-gray-600">
                We'll email you a secure login link
              </p>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => {
                setUseMagicLink(!useMagicLink);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-brand-blue hover:text-brand-blue-hover font-semibold transition-colors"
            >
              {useMagicLink ? '← Use password instead' : 'Use magic link instead →'}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
