import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'

export type DirectorTextContent = {
  text: string
  textEn?: string | null
  photoPath?: string | null
  photoUrl?: string | null
  thumbnailPath?: string | null
  thumbnailUrl?: string | null
  name: string
  nameEn?: string | null
  position: string
  positionEn?: string | null
  updatedAt?: string | null
}

const DIRECTOR_TEXT_REFRESH_MS = 10000

function emptyContent(): DirectorTextContent {
  return {
    text: '',
    textEn: null,
    photoPath: null,
    photoUrl: null,
    thumbnailPath: null,
    thumbnailUrl: null,
    name: '',
    nameEn: null,
    position: '',
    positionEn: null,
    updatedAt: null,
  }
}

export function useDirectorText() {
  const content = ref<DirectorTextContent>(emptyContent())
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)
  let refreshTimer: number | null = null

  const localizedText = computed(() => (
    locale.value === 'en' && content.value.textEn ? content.value.textEn : content.value.text
  ))

  const localizedName = computed(() => (
    locale.value === 'en' && content.value.nameEn ? content.value.nameEn : content.value.name
  ))

  const localizedPosition = computed(() => (
    locale.value === 'en' && content.value.positionEn ? content.value.positionEn : content.value.position
  ))

  const displayPhotoUrl = computed(() => content.value.thumbnailUrl || content.value.photoUrl || '')

  const hasContent = computed(() => Boolean(
    localizedText.value ||
    localizedName.value ||
    localizedPosition.value ||
    displayPhotoUrl.value,
  ))

  async function loadDirectorText({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/director-text', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load director text content: ${response.status}`)
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
    loadDirectorText()
    refreshTimer = window.setInterval(() => loadDirectorText({ silent: true }), DIRECTOR_TEXT_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    content,
    localizedText,
    localizedName,
    localizedPosition,
    displayPhotoUrl,
    hasContent,
    isLoading,
    error,
    loadDirectorText,
  }
}
