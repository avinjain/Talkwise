'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        name: mode === 'signup' ? name : undefined,
        mode,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="flex justify-center">
            <Logo size={120} />
          </div>
          <h1 className="text-2xl font-bold text-gradient">TalkWise</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="text-brand-600 font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-brand-600 font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
