import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

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

const HYSTORY_COMPANY_REFRESH_MS = 10000

export function useHystoryCompany() {
  const items = ref<HystoryCompanyItem[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedTitle = computed(() => (
    locale.value === 'en' ? 'Company history' : 'История компании'
  ))

  const localizedItems = computed(() => items.value.map((item) => ({
    ...item,
    localizedTitle: locale.value === 'en' && item.titleEn ? item.titleEn : item.title,
    localizedText: locale.value === 'en' && item.textEn ? item.textEn : item.text,
  })))

  async function loadHystoryCompany({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/hystory-company', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load company history: ${response.status}`)
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
    loadHystoryCompany()
    refreshTimer = window.setInterval(() => loadHystoryCompany({ silent: true }), HYSTORY_COMPANY_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    items,
    localizedItems,
    localizedTitle,
    isLoading,
    error,
    loadHystoryCompany,
  }
}
