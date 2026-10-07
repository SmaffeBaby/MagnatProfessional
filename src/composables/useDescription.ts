import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'
import { warmMediaUrls } from './useMediaPreload'

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
  const query = useApiQuery<{ content: DescriptionContent }>(['description'], '/api/description')
  const content = computed(() => query.data.value?.content || emptyContent())
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

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

  watch(content, (currentContent) => {
    warmMediaUrls([
      currentContent.desktopPlaqueUrl,
      currentContent.tabletPlaqueUrl,
      currentContent.mobilePlaqueUrl,
    ].filter((url): url is string => Boolean(url)))
  })

  return {
    content,
    localizedText,
    localizedCardText,
    hasContent,
    isLoading: query.isLoading,
    error: query.error,
    loadDescription: query.refetch,
  }
}
