import { useState } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { useKodaAuth } from '~/lib/hooks/useKodaAuth';
import type { MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => [
  { title: 'Login — Koda' },
  { name: 'description', content: 'Sign in to your Koda account' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useKodaAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="i-ph:lightning-fill text-bolt-elements-textPrimary text-3xl" />
            <span className="text-2xl font-bold text-bolt-elements-textPrimary">Koda</span>
          </div>
          <p className="text-bolt-elements-textSecondary text-sm">Build anything with AI agents</p>
        </div>

        {/* Card */}
        <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-bolt-elements-textPrimary mb-6">Sign in to your account</h1>

          {/* Google OAuth */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary transition-colors mb-6"
          >
            <div className="i-logos:google-icon text-xl" />
            <span className="text-sm font-medium">Continue with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-bolt-elements-borderColor" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-bolt-elements-background-depth-2 px-3 text-bolt-elements-textSecondary">or</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-bolt-elements-textSecondary">Password</label>
                <a href="#" className="text-xs text-bolt-elements-textLink hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <div className="i-ph:warning-circle flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-bolt-elements-textPrimary text-bolt-elements-background-depth-1 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="i-svg-spinners:ring-resize text-lg" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-bolt-elements-textSecondary mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/auth/signup" className="text-bolt-elements-textLink hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
