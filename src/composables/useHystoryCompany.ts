import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'

export type HystoryCompanyItem = {
  id: string
  year: string
  sortOrder: number
  title: string
  titleEn?: string | null
  text: string
  textEn?: string | null
  createdAt?: string
  updatedAt?: string
}

export function useHystoryCompany() {
  const query = useApiQuery<{ items: HystoryCompanyItem[] }>(['hystory-company'], '/api/hystory-company')
  const items = computed(() => Array.isArray(query.data.value?.items) ? query.data.value.items : [])
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

  const localizedTitle = computed(() => (
    locale.value === 'en' ? 'Company history' : 'История компании'
  ))

  const localizedItems = computed(() => items.value.map((item) => ({
    ...item,
    localizedTitle: locale.value === 'en' && item.titleEn ? item.titleEn : item.title,
    localizedText: locale.value === 'en' && item.textEn ? item.textEn : item.text,
  })))

  return {
    items,
    localizedItems,
    localizedTitle,
    isLoading: query.isLoading,
    error: query.error,
    loadHystoryCompany: query.refetch,
  }
}
