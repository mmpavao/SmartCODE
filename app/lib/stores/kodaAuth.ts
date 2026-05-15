/**
 * KODA AUTH STORE
 * Gerencia a sessão do usuário autenticado via Supabase Auth
 */
import { atom, computed } from 'nanostores';

export interface KodaUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface KodaAuthState {
  user: KodaUser | null;
  session: { access_token: string; refresh_token: string } | null;
  loading: boolean;
}

export const kodaAuthStore = atom<KodaAuthState>({
  user: null,
  session: null,
  loading: true,
});

export const isAuthenticated = computed(kodaAuthStore, (state) => !!state.user);
export const currentUser = computed(kodaAuthStore, (state) => state.user);
export const isAuthLoading = computed(kodaAuthStore, (state) => state.loading);

export function setKodaUser(user: KodaUser | null, session: KodaAuthState['session'] = null) {
  kodaAuthStore.set({ user, session, loading: false });
  if (user && session) {
    try {
      localStorage.setItem('koda_session', JSON.stringify({ user, session }));
    } catch {}
  } else {
    try {
      localStorage.removeItem('koda_session');
    } catch {}
  }
}

export function loadKodaSessionFromStorage(): boolean {
  try {
    const raw = localStorage.getItem('koda_session');
    if (!raw) return false;
    const { user, session } = JSON.parse(raw) as KodaAuthState;
    if (user && session) {
      kodaAuthStore.set({ user, session, loading: false });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function clearKodaSession() {
  kodaAuthStore.set({ user: null, session: null, loading: false });
  try {
    localStorage.removeItem('koda_session');
  } catch {}
}
