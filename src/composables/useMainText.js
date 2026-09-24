import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

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

const MAIN_TEXT_REFRESH_MS = 10000

export function useMainText() {
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  const content = ref(fallbackContent)
  const etag = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  let refreshTimer = null

  const localizedContent = computed(() => content.value[locale.value] || content.value.ru)

  async function loadMainText({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const headers = {
        Accept: 'application/json',
      }

      if (etag.value) {
        headers['If-None-Match'] = etag.value
      }

      const response = await fetch('/api/main-text', {
        headers,
      })

      if (response.status === 304) {
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to load main text: ${response.status}`)
      }

      const payload = await response.json()
      etag.value = response.headers.get('ETag')
      content.value = {
        ru: payload.ru || fallbackContent.ru,
        en: payload.en || fallbackContent.en,
      }
    } catch (requestError) {
      error.value = requestError
      content.value = fallbackContent
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    loadMainText()
    refreshTimer = window.setInterval(() => loadMainText({ silent: true }), MAIN_TEXT_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    content: localizedContent,
    error,
    isLoading,
    loadMainText,
  }
}
