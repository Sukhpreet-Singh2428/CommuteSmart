import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// POLISHED: Enhanced API hook with loading states and error handling
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  retryAttempts?: number;
}

export function useApi<T = any>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options.retryAttempts || 3;

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiFunction();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
      setRetryCount(0);
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        // POLISHED: Exponential backoff for retries
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => execute(), delay);
        toast.error(`Request failed. Retrying... (${retryCount + 1}/${maxRetries})`);
      } else {
        options.onError?.(errorMessage);
        toast.error(errorMessage);
      }
      
      throw error;
    }
  }, [apiFunction, options, retryCount, maxRetries]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
    setRetryCount(0);
  }, []);

  const refetch = useCallback(() => {
    setRetryCount(0);
    return execute();
  }, [execute]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [options.immediate, execute]);

  return {
    ...state,
    execute,
    refetch,
    reset,
    retryCount,
    canRetry: retryCount < maxRetries,
  };
}

// POLISHED: Hook for paginated data
export function usePaginatedApi<T>(
  apiFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number; page: number }>,
  initialLimit = 10
) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [allData, setAllData] = useState<T[]>([]);
  
  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi(() => apiFunction(page, limit), {
    immediate: true,
  });

  useEffect(() => {
    if (response?.data) {
      if (page === 1) {
        setAllData(response.data);
      } else {
        setAllData(prev => [...prev, ...response.data]);
      }
    }
  }, [response, page]);

  const loadMore = useCallback(() => {
    if (response && allData.length < response.total) {
      setPage(prev => prev + 1);
    }
  }, [response, allData.length]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
  }, []);

  return {
    data: allData,
    loading,
    error,
    hasMore: response ? allData.length < response.total : false,
    total: response?.total || 0,
    currentPage: page,
    loadMore,
    refetch,
    reset,
    setLimit,
  };
}

// POLISHED: Hook for real-time data with WebSocket simulation
export function useRealTimeApi<T>(
  apiFunction: () => Promise<T>,
  updateInterval: number = 30000 // 30 seconds
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(apiFunction, {
    immediate: true,
    onSuccess: () => {
      setIsConnected(true);
      setLastUpdate(new Date());
    },
    onError: () => {
      setIsConnected(false);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [refetch, updateInterval]);

  return {
    data,
    loading,
    error,
    isConnected,
    lastUpdate,
    refetch,
  };
}

// POLISHED: Hook for optimistic updates
export function useOptimisticApi<T, P>(
  apiFunction: (params: P) => Promise<T>,
  initialData: T[]
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params: P, optimisticUpdate?: (current: T[]) => T[]) => {
    setLoading(true);
    setError(null);

    // POLISHED: Apply optimistic update immediately
    if (optimisticUpdate) {
      const optimisticData = optimisticUpdate(data);
      setData(optimisticData);
    }

    try {
      const result = await apiFunction(params);
      if (Array.isArray(result)) {
        setData(result);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Revert optimistic update on error
      if (optimisticUpdate) {
        setData(data); // Reset to original data
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, data]);

  return {
    data,
    loading,
    error,
    execute,
    setData,
  };
}
