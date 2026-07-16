'use client';

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Token getter/setter — set imperatively by AuthProvider on mount
let _getAccessToken: () => string | null = () => null;
let _getRefreshToken: () => string | null = () => null;
let _setTokens: (t: { accessToken: string; refreshToken: string; expiresIn: number }) => void = () => {};
let _logout: () => void = () => {};

export function initApiAuth(config: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (t: { accessToken: string; refreshToken: string; expiresIn: number }) => void;
  logout: () => void;
}) {
  _getAccessToken = config.getAccessToken;
  _getRefreshToken = config.getRefreshToken;
  _setTokens = config.setTokens;
  _logout = config.logout;
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = _getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = _getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken,
          });
          _setTokens(data.data.tokens);
          original.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`;
          return api(original);
        } catch {
          _logout();
        }
      }
    }
    return Promise.reject(error);
  },
);

// --- Typed API helpers ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get<ApiResponse<T>>(url, { params });
  return res.data;
}

export async function post<T>(url: string, body?: unknown) {
  const res = await api.post<ApiResponse<T>>(url, body);
  return res.data;
}

export async function patch<T>(url: string, body?: unknown) {
  const res = await api.patch<ApiResponse<T>>(url, body);
  return res.data;
}

export async function del<T>(url: string) {
  const res = await api.delete<ApiResponse<T>>(url);
  return res.data;
}
