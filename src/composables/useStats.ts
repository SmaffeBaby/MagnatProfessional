import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'

export type StatsItem = {
  id: string
  numberText: string
  sortOrder: number
  text: string
  textEn?: string | null
  createdAt?: string
  updatedAt?: string
}

export function useStats() {
  const query = useApiQuery<{ items: StatsItem[] }>(['stats'], '/api/stats')
  const items = computed(() => Array.isArray(query.data.value?.items) ? query.data.value.items : [])
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

  const localizedItems = computed(() => items.value.map((item) => ({
    ...item,
    localizedText: locale.value === 'en' && item.textEn ? item.textEn : item.text,
  })))

  return {
    items,
    localizedItems,
    isLoading: query.isLoading,
    error: query.error,
    loadStats: query.refetch,
  }
}
