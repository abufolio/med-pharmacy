import { create } from 'zustand';
import type { UserProfile, AuthTokens } from '@/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setAuth: (user: UserProfile, tokens: AuthTokens) => void;
  updateUser: (user: UserProfile) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user, tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isInitialized: true });
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isInitialized: true });
  },

  initialize: () => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (stored && token) {
      try {
        const user = JSON.parse(stored) as UserProfile;
        set({ user, isAuthenticated: true, isInitialized: true });
        return;
      } catch {
        // Invalid stored data
      }
    }
    set({ isInitialized: true });
  },
}));
