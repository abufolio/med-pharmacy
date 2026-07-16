'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { get, type ApiResponse, type PaginatedResponse } from '@/lib/api/client';

interface UseApiListOptions<T> {
  url: string;
  page?: number;
  limit?: number;
  params?: Record<string, unknown>;
  enabled?: boolean;
}

interface UseApiListResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiList<T>({ url, page = 1, limit = 20, params, enabled = true }: UseApiListOptions<T>): UseApiListResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await get<PaginatedResponse<T>>(url, {
        page: String(page),
        limit: String(limit),
        ...params,
      });
      if (mountedRef.current) {
        setData(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Maʼlumotlarni yuklashda xatolik');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [url, page, limit, JSON.stringify(params), enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  return {
    data,
    total,
    page,
    limit,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// Single item fetcher
export function useApiGet<T>(url: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await get<T>(url);
      setData(res.data);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Maʼlumotlarni yuklashda xatolik');
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
