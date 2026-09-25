import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

export type AboutUsContent = {
  text: string
  textEn?: string | null
  buttonText: string
  buttonTextEn?: string | null
  updatedAt?: string | null
}

const ABOUT_US_REFRESH_MS = 10000

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
  const content = ref<AboutUsContent>(emptyContent())
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedText = computed(() => (
    locale.value === 'en' && content.value.textEn ? content.value.textEn : content.value.text
  ))

  const localizedButtonText = computed(() => (
    locale.value === 'en' && content.value.buttonTextEn ? content.value.buttonTextEn : content.value.buttonText
  ))

  const hasContent = computed(() => Boolean(localizedText.value || localizedButtonText.value))

  async function loadAboutUs({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/about-us', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load about us content: ${response.status}`)
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
    loadAboutUs()
    refreshTimer = window.setInterval(() => loadAboutUs({ silent: true }), ABOUT_US_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    content,
    localizedText,
    localizedButtonText,
    hasContent,
    isLoading,
    error,
    loadAboutUs,
  }
}
