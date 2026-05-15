/**
 * KODA USER MENU
 * Avatar + dropdown com opções de conta no Header
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { useKodaAuth } from '~/lib/hooks/useKodaAuth';

export function UserMenu() {
  const { user, isAuthenticated, loading, signOut } = useKodaAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-bolt-elements-background-depth-3 animate-pulse" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/auth/login"
          className="px-3 py-1.5 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
        >
          Sign in
        </Link>
        <Link
          to="/auth/signup"
          className="px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-textPrimary text-bolt-elements-background-depth-1 hover:opacity-90 transition-opacity font-medium"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initials = user.displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-bolt-elements-borderColor transition-all"
        title={user.displayName}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-bolt-elements-borderColor">
            <p className="text-sm font-medium text-bolt-elements-textPrimary truncate">{user.displayName}</p>
            <p className="text-xs text-bolt-elements-textSecondary truncate">{user.email}</p>
            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {user.plan === 'free' ? '✦ Free plan' : user.plan === 'pro' ? '⚡ Pro' : '🚀 Enterprise'}
            </span>
          </div>

          <div className="py-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors">
              <div className="i-ph:user-circle" />
              <span>Profile</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors">
              <div className="i-ph:folder-open" />
              <span>My Projects</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors">
              <div className="i-ph:brain" />
              <span>My Memory</span>
            </button>
          </div>

          <div className="border-t border-bolt-elements-borderColor py-1">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
            >
              <div className="i-ph:sign-out" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
