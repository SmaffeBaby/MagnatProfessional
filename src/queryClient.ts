import { QueryClient } from '@tanstack/vue-query'
import { ApiError } from './apiError'

export const QUERY_STALE_TIME_MS = 5 * 60 * 1000
export const QUERY_GC_TIME_MS = 30 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_GC_TIME_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => failureCount < 1
        && (!(error instanceof ApiError) || error.status === 408 || error.status === 429 || error.status >= 500),
    },
  },
})
