import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

export type MissionValuesContent = {
  mainText: string
  mainTextEn?: string | null
  mainTextHtml: string
  mainTextHtmlEn?: string | null
  updatedAt?: string | null
}

export type MissionValuesCard = {
  id: string
  sortOrder: number
  title: string
  titleEn?: string | null
  text: string
  textEn?: string | null
  createdAt?: string
  updatedAt?: string
}

const MISSION_VALUES_REFRESH_MS = 10000

function emptyContent(): MissionValuesContent {
  return {
    mainText: '',
    mainTextEn: null,
    mainTextHtml: '',
    mainTextHtmlEn: null,
    updatedAt: null,
  }
}

export function useMissionValues() {
  const content = ref<MissionValuesContent>(emptyContent())
  const cards = ref<MissionValuesCard[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedTitle = computed(() => (
    locale.value === 'en' ? 'Mission and values' : 'Миссия и ценности'
  ))

  const localizedMainTextHtml = computed(() => (
    locale.value === 'en' && content.value.mainTextHtmlEn
      ? content.value.mainTextHtmlEn
      : content.value.mainTextHtml
  ))

  const localizedCards = computed(() => cards.value.map((card) => ({
    ...card,
    localizedTitle: locale.value === 'en' && card.titleEn ? card.titleEn : card.title,
    localizedText: locale.value === 'en' && card.textEn ? card.textEn : card.text,
  })))

  const hasContent = computed(() => Boolean(localizedMainTextHtml.value || localizedCards.value.length))

  async function loadMissionValues({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/mission-values', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load mission values: ${response.status}`)
      }

      const payload = await response.json()
      content.value = payload.content || emptyContent()
      cards.value = Array.isArray(payload.cards) ? payload.cards : []
    } catch (requestError) {
      error.value = requestError as Error
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    loadMissionValues()
    refreshTimer = window.setInterval(() => loadMissionValues({ silent: true }), MISSION_VALUES_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    content,
    cards,
    localizedTitle,
    localizedMainTextHtml,
    localizedCards,
    hasContent,
    isLoading,
    error,
    loadMissionValues,
  }
}
