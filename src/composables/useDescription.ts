import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

export type DescriptionContent = {
  text: string
  textEn?: string | null
  cardText: string
  cardTextEn?: string | null
  desktopPlaquePath?: string | null
  desktopPlaqueUrl?: string | null
  tabletPlaquePath?: string | null
  tabletPlaqueUrl?: string | null
  mobilePlaquePath?: string | null
  mobilePlaqueUrl?: string | null
  updatedAt?: string | null
}

const DESCRIPTION_REFRESH_MS = 10000

function emptyContent(): DescriptionContent {
  return {
    text: '',
    textEn: null,
    cardText: '',
    cardTextEn: null,
    desktopPlaquePath: null,
    desktopPlaqueUrl: null,
    tabletPlaquePath: null,
    tabletPlaqueUrl: null,
    mobilePlaquePath: null,
    mobilePlaqueUrl: null,
    updatedAt: null,
  }
}

export function useDescription() {
  const content = ref<DescriptionContent>(emptyContent())
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedText = computed(() => (
    locale.value === 'en' && content.value.textEn ? content.value.textEn : content.value.text
  ))

  const localizedCardText = computed(() => (
    locale.value === 'en' && content.value.cardTextEn ? content.value.cardTextEn : content.value.cardText
  ))

  const hasContent = computed(() => Boolean(
    localizedText.value ||
    localizedCardText.value ||
    content.value.desktopPlaqueUrl ||
    content.value.tabletPlaqueUrl ||
    content.value.mobilePlaqueUrl,
  ))

  async function loadDescription({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/description', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load description content: ${response.status}`)
      }

      const payload = await response.json()
      content.value = payload.content || emptyContent()
    } catch (requestError) {
      error.value = requestError as Error
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    loadDescription()
    refreshTimer = window.setInterval(() => loadDescription({ silent: true }), DESCRIPTION_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    content,
    localizedText,
    localizedCardText,
    hasContent,
    isLoading,
    error,
    loadDescription,
  }
}
