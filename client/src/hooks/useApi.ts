import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { useToastStore } from '@/components/ui/toast';
import type { PaginatedResponse } from '@/types';

// Generic fetch hook
export function useFetch<T>(
  key: string[],
  url: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T>({
    queryKey: [...key, params],
    queryFn: async () => {
      const { data } = await api.get(url, { params });
      return data;
    },
    ...options,
  });
}

// Generic paginated fetch hook
export function usePaginatedFetch<T>(
  key: string[],
  url: string,
  page = 1,
  limit = 20,
  extraParams?: Record<string, any>,
) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [...key, { page, limit, ...extraParams }],
    queryFn: async () => {
      const { data } = await api.get(url, { params: { page, limit, ...extraParams } });
      return data;
    },
  });
}

// Generic mutation hook with toast
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData }>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> & {
    successMessage?: string;
    invalidateKeys?: string[][];
  },
) {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const { data } = await mutationFn(variables);
      return data;
    },
    onSuccess: (data, variables, context) => {
      if (options?.successMessage) {
        addToast(options.successMessage, 'success');
      }
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      (options?.onSuccess as any)?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      addToast(getErrorMessage(error), 'error');
      (options?.onError as any)?.(error, variables, context);
    },
    ...options,
  });
}
