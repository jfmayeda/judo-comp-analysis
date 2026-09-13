'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // For now, simulate successful login and redirect
      // In production, this would call Supabase Auth
      if (email && password) {
        localStorage.setItem('judo-auth', 'authenticated');
        router.push('/');
      } else {
        setMessage('Please enter email and password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (email) {
        // Simulate sending magic link
        setMessage('Check your email for the magic link');
      } else {
        setMessage('Please enter your email');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      setMessage('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen navy-field flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo Wordmark */}
        <div className="text-center mb-12">
          <h1 className="wordmark text-3xl mb-3 tracking-wide">SILICON VALLEY JUDO</h1>
          <p className="eyebrow text-white">Competitor Analysis</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h2 className="text-2xl mb-6 text-center text-gray-900">COACH LOGIN</h2>

          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${
              message.includes('email') ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {!useMagicLink ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="coach@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="coach@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setUseMagicLink(!useMagicLink);
                setMessage('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold uppercase tracking-wide"
            >
              {useMagicLink ? '← Use password' : 'Use magic link instead →'}
            </button>
          </div>
        </div>

        <p className="text-center text-white text-sm mt-8 opacity-75">
          Coach access only • Privacy-first competitor analysis
        </p>
      </div>
    </div>
  );
}
