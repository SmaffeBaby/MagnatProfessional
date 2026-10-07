import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'

const fallbackContent = {
  ru: {
    titleText: 'Более 30 лет успешной',
    rightText: 'работы',
    descriptionText: 'MAGNAT PROFESSIONAL — продакшн-студия полного цикла: от брендинга и мероприятий до застройки выставочных стендов. Работаем на стыке дизайна, инженерии и продакшна.',
    buttonText: 'Обсудить проект',
  },
  en: {
    titleText: 'More than 30 years of successful',
    rightText: 'work',
    descriptionText: 'MAGNAT PROFESSIONAL is a full-cycle production studio: from branding and events to exhibition stand construction. We work at the intersection of design, engineering, and production.',
    buttonText: 'Discuss project',
  },
}

export function useMainText() {
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  const query = useApiQuery(['main-text'], '/api/main-text')
  const content = computed(() => ({
    ru: query.data.value?.ru || fallbackContent.ru,
    en: query.data.value?.en || fallbackContent.en,
  }))

  const localizedContent = computed(() => content.value[locale.value] || content.value.ru)

  return {
    content: localizedContent,
    error: query.error,
    isLoading: query.isLoading,
    loadMainText: query.refetch,
  }
}
