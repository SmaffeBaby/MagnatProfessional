import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'
import { warmMediaUrls } from './useMediaPreload'

export type ClientItem = {
  id: string
  sortOrder: number
  imagePath?: string | null
  imageUrl: string
  linkUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export function useClients() {
  const query = useApiQuery<{ items: ClientItem[] }>(['clients'], '/api/clients')
  const items = computed(() => Array.isArray(query.data.value?.items) ? query.data.value.items : [])
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

  const localizedTitle = computed(() => (
    locale.value === 'en' ? 'Clients' : 'Клиенты'
  ))

  watch(items, (currentItems) => {
    warmMediaUrls(currentItems.map((item) => item.imageUrl))
  })

  return {
    items,
    localizedTitle,
    isLoading: query.isLoading,
    error: query.error,
    loadClients: query.refetch,
  }
}
