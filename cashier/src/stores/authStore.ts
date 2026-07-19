import { create } from 'zustand';
import api from '@/lib/api';
import type { UserProfile, LoginRequest, LoginResponse } from '@/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setAuth: (user: UserProfile, tokens: { accessToken: string; refreshToken: string }) => void;
  updateUser: (user: UserProfile) => void;
  logout: () => void;
  initialize: () => void;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user, tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  initialize: () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr) as UserProfile;
        set({ user, isAuthenticated: true, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      localStorage.clear();
      set({ isInitialized: true });
    }
  },

  login: async (credentials) => {
    const { data } = await api.post<any>('/auth/login', credentials);
    const { user, tokens } = data;
    get().setAuth(user, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return { ...user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  },
}));
