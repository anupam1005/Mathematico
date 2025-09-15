import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryOptions, 
  UseMutationOptions, 
  QueryClient, 
  QueryClientProvider
} from '@tanstack/react-query';
import { ApiError } from '@/lib/error-handler';
import api from '@/lib/api';

// Import toast with dynamic import to handle potential SSR issues
let toast: any;
if (typeof window !== 'undefined') {
  import('sonner').then((mod) => {
    toast = mod.toast;
  });
}

// Type for API response
export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

// Type for paginated response
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Type for query key
type QueryKey = (string | number | boolean | object)[];

// Default query function
const defaultQueryFn = async <T>({ queryKey }: { queryKey: QueryKey }): Promise<T> => {
  const [url, params] = queryKey as [string, Record<string, unknown>];
  const response = await api.get<T>(url, { params });
  return response.data;
};

// Default mutation function
export const defaultMutationFn = async <T, D = unknown>({
  url,
  method = 'post',
  data,
  params,
}: {
  url: string;
  method?: 'post' | 'put' | 'patch' | 'delete';
  data?: D;
  params?: Record<string, unknown>;
}): Promise<T> => {
  const response = await api.request<ApiResponse<T>>({
    method,
    url,
    data,
    params,
  });
  return response.data.data;
};

/**
 * Hook for API queries
 * @param key - Unique key for the query
 * @param url - API endpoint URL
 * @param options - React Query options
 */
type UseApiQueryOptions<T> = Omit<
  UseQueryOptions<T, ApiError, T, QueryKey>,
  'queryKey' | 'queryFn'
>;

export const useApiQuery = <T>(
  key: string | QueryKey, 
  url: string,
  params: Record<string, unknown> = {},
  options: UseApiQueryOptions<T> = {}
) => {
  const queryKey = Array.isArray(key) ? key : [key];
  const queryParams = params || {};
  
  const queryOptions: UseQueryOptions<T, ApiError, T, QueryKey> = {
    queryKey: [...queryKey, queryParams],
    queryFn: () => defaultQueryFn<T>({ queryKey: [url, queryParams] }),
    ...options
  };
  
  return useQuery(queryOptions);
};

/**
 * Hook for paginated queries
 * @param key - Unique key for the query
 * @param url - API endpoint URL
 * @param page - Current page number
 * @param limit - Number of items per page
 * @param filters - Additional filters
 * @param options - React Query options
 */
type UsePaginatedQueryOptions<T> = Omit<
  UseQueryOptions<PaginatedResponse<T>, ApiError, PaginatedResponse<T>, QueryKey>,
  'queryKey' | 'queryFn'
>;

export const usePaginatedQuery = <T>(
  key: string | QueryKey,
  url: string,
  page: number,
  limit: number,
  filters: Record<string, unknown> = {},
  options: UsePaginatedQueryOptions<T> = {}
) => {
  const queryKey = Array.isArray(key) ? key : [key];
  const queryParams = { page, limit, ...filters };
  
  const queryOptions: UseQueryOptions<PaginatedResponse<T>, ApiError, PaginatedResponse<T>, QueryKey> = {
    queryKey: [...queryKey, queryParams],
    queryFn: () => defaultQueryFn<PaginatedResponse<T>>({ queryKey: [url, queryParams] }),
    ...options
  };
  
  return useQuery(queryOptions);
};

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 * @param url - API endpoint URL
 * @param method - HTTP method (default: 'post')
 * @param options - React Query mutation options
 */
type UseApiMutationOptions<T, D> = Omit<
  UseMutationOptions<T, ApiError, D, unknown>,
  'mutationFn'
>;

export const useApiMutation = <T, D = unknown>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options: UseApiMutationOptions<T, D> = {}
) => {
  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const response = await api[method]<T>(url, data);
      return response.data;
    },
    ...options
  });
};

/**
 * Hook for optimistic updates
 * @param url - API endpoint URL
 * @param method - HTTP method (default: 'post')
 * @param queryKey - Query key to update after mutation
 * @param options - Additional options for optimistic updates
 */
type OptimisticMutationOptions<T, D> = {
  onMutate?: (data: D) => Promise<unknown>;
  onError?: (error: ApiError, variables: D, context: unknown) => void;
  onSuccess?: (data: T, variables: D, context: unknown) => void;
  onSettled?: (data: T | undefined, error: ApiError | null, variables: D, context: unknown) => void;
};

export const useOptimisticMutation = <T, D = unknown>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  queryKey: QueryKey,
  options: OptimisticMutationOptions<T, D> = {}
) => {
  const queryClient = useQueryClient();
  
  return useMutation<T, ApiError, D, { previousData?: T }>({
    mutationFn: async (data: D) => {
      const response = await api[method]<T>(url, data);
      return response.data;
    },
    ...options,
    onMutate: async (data: D) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<T>(queryKey);
      
      // Call the user's onMutate if provided
      const context = options.onMutate ? await options.onMutate(data) : undefined;
      
      return { previousData, ...(context || {}) };
    },
    onError: (error: ApiError, variables: D, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      if (options?.onError) {
        options.onError(error, variables, context);
      } else if (toast) {
        toast.error(error.message);
      }
    },
    onSuccess: (data: T, variables: D, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey }).catch(console.error);

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey }).catch(console.error);

      if (options?.onSettled) {
        options.onSettled(data ?? undefined, error, variables, context);
      }
    },
  });
};

export { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider };
export type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
