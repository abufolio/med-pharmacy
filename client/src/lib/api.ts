import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });
        const newToken = data.tokens?.accessToken || data.accessToken;
        localStorage.setItem('accessToken', newToken);
        if (data.tokens?.refreshToken) {
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
        }
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Helper: extract error message ──
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * API service helper — unwraps AxiosResponse so callers get JSON body directly.
 * Backend wraps all responses as { success: true, data: ..., ...rest }.
 * This strips `success` and returns `{ data: ..., ...rest }`.
 */
async function extractData<T>(promise: Promise<AxiosResponse<T>>): Promise<T> {
  const { data } = await promise;
  return data;
}

export const apiService = {
  get: <T>(url: string, config?: Record<string, unknown>) =>
    extractData<T>(api.get<T>(url, config)),
  post: <T>(url: string, body?: unknown, config?: Record<string, unknown>) =>
    extractData<T>(api.post<T>(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: Record<string, unknown>) =>
    extractData<T>(api.patch<T>(url, body, config)),
  delete: <T>(url: string, config?: Record<string, unknown>) =>
    extractData<T>(api.delete<T>(url, config)),
};

export default api;
