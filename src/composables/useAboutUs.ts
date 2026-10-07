import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'

export type AboutUsContent = {
  text: string
  textEn?: string | null
  buttonText: string
  buttonTextEn?: string | null
  updatedAt?: string | null
}

function emptyContent(): AboutUsContent {
  return {
    text: '',
    textEn: null,
    buttonText: '',
    buttonTextEn: null,
    updatedAt: null,
  }
}

export function useAboutUs() {
  const query = useApiQuery<{ content: AboutUsContent }>(['about-us'], '/api/about-us')
  const content = computed(() => query.data.value?.content || emptyContent())
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

  const localizedText = computed(() => (
    locale.value === 'en' && content.value.textEn ? content.value.textEn : content.value.text
  ))

  const localizedButtonText = computed(() => (
    locale.value === 'en' && content.value.buttonTextEn ? content.value.buttonTextEn : content.value.buttonText
  ))

  const hasContent = computed(() => Boolean(localizedText.value || localizedButtonText.value))

  return {
    content,
    localizedText,
    localizedButtonText,
    hasContent,
    isLoading: query.isLoading,
    error: query.error,
    loadAboutUs: query.refetch,
  }
}
