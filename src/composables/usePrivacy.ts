import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

export type PrivacyTableRow = {
  left: string
  right: string
}

export type PrivacyBlock = {
  id: string
  type: 'text' | 'table'
  sortOrder: number
  title: string
  titleEn?: string | null
  text: string
  textEn?: string | null
  tableRows: PrivacyTableRow[]
  tableRowsEn: PrivacyTableRow[]
  createdAt?: string
  updatedAt?: string
}

const PRIVACY_REFRESH_MS = 10000

export function usePrivacy() {
  const blocks = ref<PrivacyBlock[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedTitle = computed(() => (
    locale.value === 'en'
      ? 'Personal data processing policy'
      : 'Политика в отношении обработки персональных данных'
  ))

  const localizedBlocks = computed(() => blocks.value.map((block) => ({
    ...block,
    localizedTitle: locale.value === 'en' && block.titleEn ? block.titleEn : block.title,
    localizedText: locale.value === 'en' && block.textEn ? block.textEn : block.text,
    localizedTableRows: locale.value === 'en' && block.tableRowsEn?.length
      ? block.tableRowsEn
      : block.tableRows,
  })))

  async function loadPrivacy({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/privacy', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load privacy content: ${response.status}`)
      }

      const payload = await response.json()
      blocks.value = Array.isArray(payload.blocks) ? payload.blocks : []
    } catch (requestError) {
      error.value = requestError as Error
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    loadPrivacy()
    refreshTimer = window.setInterval(() => loadPrivacy({ silent: true }), PRIVACY_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    blocks,
    localizedBlocks,
    localizedTitle,
    isLoading,
    error,
    loadPrivacy,
  }
}
