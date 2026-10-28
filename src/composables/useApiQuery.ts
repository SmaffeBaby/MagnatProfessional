import { useQuery, type UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS, queryClient } from '../queryClient'
import { ApiError } from '../apiError'

export async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, path)
  }

  return response.json() as Promise<T>
}

export function useApiQuery<T>(
  queryKey: MaybeRefOrGetter<readonly unknown[]>,
  path: MaybeRefOrGetter<string>,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
    staleTime?: number
    gcTime?: number
  } = {},
): UseQueryReturnType<T, Error> {
  return useQuery<T, Error>({
    queryKey,
    queryFn: ({ signal }) => fetchJson<T>(toValue(path), signal),
    enabled: computed(() => options.enabled === undefined ? true : Boolean(toValue(options.enabled))),
    staleTime: options.staleTime ?? QUERY_STALE_TIME_MS,
    gcTime: options.gcTime ?? QUERY_GC_TIME_MS,
  })
}

export function prefetchApiQuery<T>(
  queryKey: readonly unknown[],
  path: string,
  options: {
    staleTime?: number
    gcTime?: number
  } = {},
) {
  return queryClient.prefetchQuery<T, Error>({
    queryKey,
    queryFn: ({ signal }) => fetchJson<T>(path, signal),
    retry: false,
    staleTime: options.staleTime ?? QUERY_STALE_TIME_MS,
    gcTime: options.gcTime ?? QUERY_GC_TIME_MS,
  })
}
