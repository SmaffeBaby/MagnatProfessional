import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

export type ClientItem = {
  id: string
  sortOrder: number
  imagePath?: string | null
  imageUrl: string
  linkUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

const CLIENTS_REFRESH_MS = 10000

export function useClients() {
  const items = ref<ClientItem[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedTitle = computed(() => (
    locale.value === 'en' ? 'Clients' : 'Клиенты'
  ))

  async function loadClients({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/clients', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load clients: ${response.status}`)
      }

      const payload = await response.json()
      items.value = Array.isArray(payload.items) ? payload.items : []
    } catch (requestError) {
      error.value = requestError as Error
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    loadClients()
    refreshTimer = window.setInterval(() => loadClients({ silent: true }), CLIENTS_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    items,
    localizedTitle,
    isLoading,
    error,
    loadClients,
  }
}
