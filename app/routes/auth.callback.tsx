import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { setKodaUser } from '~/lib/stores/kodaAuth';
import type { MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => [{ title: 'Authenticating... — Koda' }];

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      navigate('/auth/login');
      return;
    }

    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      navigate('/auth/login?error=callback_failed');
      return;
    }

    // Buscar dados do usuário com o access token
    const supabaseUrl = (window as any).__ENV__?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((r) => r.json())
      .then((user: any) => {
        if (user?.id) {
          setKodaUser(
            {
              id: user.id,
              email: user.email,
              displayName:
                user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatarUrl: user.user_metadata?.avatar_url,
              plan: 'free',
            },
            { access_token: accessToken, refresh_token: refreshToken || '' },
          );
          navigate('/');
        } else {
          navigate('/auth/login?error=user_not_found');
        }
      })
      .catch(() => navigate('/auth/login?error=callback_failed'));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center">
      <div className="text-center">
        <div className="i-svg-spinners:ring-resize text-4xl text-bolt-elements-textPrimary mb-4" />
        <p className="text-bolt-elements-textSecondary">Completing sign in...</p>
      </div>
    </div>
  );
}
