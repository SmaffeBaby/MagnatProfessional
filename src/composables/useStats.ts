import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

export type StatsItem = {
  id: string
  numberText: string
  sortOrder: number
  text: string
  textEn?: string | null
  createdAt?: string
  updatedAt?: string
}

const STATS_REFRESH_MS = 10000

export function useStats() {
  const items = ref<StatsItem[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedItems = computed(() => items.value.map((item) => ({
    ...item,
    localizedText: locale.value === 'en' && item.textEn ? item.textEn : item.text,
  })))

  async function loadStats({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/stats', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.status}`)
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
    loadStats()
    refreshTimer = window.setInterval(() => loadStats({ silent: true }), STATS_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    items,
    localizedItems,
    isLoading,
    error,
    loadStats,
  }
}
