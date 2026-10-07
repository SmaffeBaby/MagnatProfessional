import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'

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
  const query = useApiQuery<{ content: MissionValuesContent, cards: MissionValuesCard[] }>(
    ['mission-values'],
    '/api/mission-values',
  )
  const content = computed(() => query.data.value?.content || emptyContent())
  const cards = computed(() => Array.isArray(query.data.value?.cards) ? query.data.value.cards : [])
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

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

  return {
    content,
    cards,
    localizedTitle,
    localizedMainTextHtml,
    localizedCards,
    hasContent,
    isLoading: query.isLoading,
    error: query.error,
    loadMissionValues: query.refetch,
  }
}
