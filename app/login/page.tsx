'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseClient } from '@/lib/supabase';
import { checkCoachAllowlist } from '@/lib/auth-utils';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Notice } from '@/components/ui/Notice';

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
      router.push(searchParams.get('redirectTo') || '/');
    }
  }, [user, authLoading, router, searchParams]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (data.user) {
        const isAllowlisted = await checkCoachAllowlist();
        if (!isAllowlisted) {
          await supabase.auth.signOut();
          setError('Your email is not on the coach allowlist. Please contact your administrator.');
          return;
        }
        router.push(searchParams.get('redirectTo') || '/');
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
        options: { emailRedirectTo: `${window.location.origin}${searchParams.get('redirectTo') || '/'}` },
      });
      if (signInError) throw signInError;
      setMessage('Check your email for the login link.');
      setEmail('');
    } catch (err: unknown) {
      console.error('Magic link error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingScreen label="Checking session" />;
  }

  return (
    <AuthShell title="Coach sign in" lead="Athlete profiles, scouting notes and tournament-day cards.">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}

      <form onSubmit={useMagicLink ? handleMagicLinkLogin : handlePasswordLogin} className="stack">
        <Field label="Email" required>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="coach@svjudo.com" autoComplete="email" inputMode="email" />
        </Field>
        {!useMagicLink ? (
          <Field label="Password" required>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" autoComplete="current-password" />
          </Field>
        ) : (
          <p className="text-sm text-muted">We&apos;ll email you a secure sign-in link.</p>
        )}
        <Button type="submit" block size="lg" disabled={loading}>
          {loading ? (useMagicLink ? 'Sending…' : 'Signing in…') : useMagicLink ? 'Send magic link' : 'Sign in'}
        </Button>
      </form>

      <div className="pt-4 border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={() => {
            setUseMagicLink(!useMagicLink);
            setError(null);
            setMessage(null);
          }}
          className="btn-link"
        >
          {useMagicLink ? 'Use a password instead' : 'Email me a magic link instead'}
        </button>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading" />}>
      <LoginForm />
    </Suspense>
  );
}
