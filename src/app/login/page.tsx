'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { loginAction } from '@/app/actions';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('password', password);

      const result = await loginAction(formData);
      if (result && result.error) {
        setErrorMessage(result.error);
        setLoading(false);
      }
    } catch (err: any) {
      // If redirect happens in server action, it throws NEXT_REDIRECT which is normal
      if (err?.message?.includes('NEXT_REDIRECT')) {
        return;
      }
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-lg bg-surface-dark flex items-center justify-center text-canvas font-mono font-bold text-lg mb-4 shadow-sm">
          SN
        </div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
          Smart Note
        </h1>
        <p className="mt-2 text-sm text-muted">
          Business Accounting, Orders, Stock &amp; Daily Closing
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-card border border-hairline rounded-lg p-6 sm:p-8 shadow-sm">
          <div className="border-b border-hairline pb-4 mb-6">
            <h2 className="text-base font-medium text-ink">Sign In to Workspace</h2>
            <p className="text-xs text-muted mt-0.5">
              Enter your authorized username and password to continue.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-md bg-semantic-error/10 border border-semantic-error/20 flex items-start space-x-2 text-xs text-semantic-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-ink uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your username"
                  className="block w-full pl-9 pr-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-md placeholder-muted-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-ink uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-9 pr-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-md placeholder-muted-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md bg-primary hover:bg-primary-active text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3 shadow-sm"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* System Footer Note */}
        <p className="text-center text-xs text-muted mt-6">
          Smart Note Operational System &middot; Encrypted Session
        </p>
      </div>
    </div>
  );
}
