/**
 * KODA AUTH HOOK
 * Hook React para gerenciar autenticação via Supabase Auth
 */
import { useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import {
  kodaAuthStore,
  setKodaUser,
  clearKodaSession,
  loadKodaSessionFromStorage,
  isAuthenticated,
  currentUser,
  isAuthLoading,
} from '~/lib/stores/kodaAuth';
import type { KodaUser } from '~/lib/stores/kodaAuth';

const SUPABASE_URL = typeof window !== 'undefined'
  ? (window as any).__ENV__?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || ''
  : '';
const SUPABASE_ANON_KEY = typeof window !== 'undefined'
  ? (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  : '';

async function supabaseRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

function mapToKodaUser(data: any): KodaUser {
  return {
    id: data.id || data.user?.id,
    email: data.email || data.user?.email,
    displayName:
      data.user_metadata?.full_name ||
      data.user?.user_metadata?.full_name ||
      (data.email || data.user?.email || '').split('@')[0],
    avatarUrl: data.user_metadata?.avatar_url || data.user?.user_metadata?.avatar_url,
    plan: 'free',
  };
}

export function useKodaAuth() {
  const authState = useStore(kodaAuthStore);
  const authenticated = useStore(isAuthenticated);
  const user = useStore(currentUser);
  const loading = useStore(isAuthLoading);
  const navigate = useNavigate();

  // Inicializar sessão do localStorage na montagem
  useEffect(() => {
    const loaded = loadKodaSessionFromStorage();
    if (!loaded) {
      kodaAuthStore.set({ user: null, session: null, loading: false });
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await supabaseRequest('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.error || data.error_description) {
      throw new Error(data.error_description || data.error || 'Login failed');
    }

    const user = mapToKodaUser(data.user || data);
    setKodaUser(user, { access_token: data.access_token, refresh_token: data.refresh_token });
    return user;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const data = await supabaseRequest('/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        data: { full_name: displayName || email.split('@')[0] },
      }),
    });

    if (data.error || data.error_description) {
      throw new Error(data.error_description || data.error || 'Signup failed');
    }

    // Auto-login se confirmação de email não for necessária
    if (data.access_token) {
      const user = mapToKodaUser(data.user || data);
      setKodaUser(user, { access_token: data.access_token, refresh_token: data.refresh_token });
      return user;
    }

    return null; // Aguardar confirmação de email
  }, []);

  const signOut = useCallback(async () => {
    const session = kodaAuthStore.get().session;
    if (session?.access_token) {
      await supabaseRequest('/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }
    clearKodaSession();
    navigate('/auth/login');
  }, [navigate]);

  const signInWithGoogle = useCallback(() => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  }, []);

  return {
    user,
    session: authState.session,
    loading,
    isAuthenticated: authenticated,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };
}
