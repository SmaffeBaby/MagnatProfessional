import { useQuery, type UseQueryReturnType } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS, queryClient } from '../queryClient'

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
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
    queryFn: () => fetchJson<T>(toValue(path)),
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
    queryFn: () => fetchJson<T>(path),
    staleTime: options.staleTime ?? QUERY_STALE_TIME_MS,
    gcTime: options.gcTime ?? QUERY_GC_TIME_MS,
  })
}
