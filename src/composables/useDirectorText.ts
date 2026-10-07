import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'
import { warmMediaUrls } from './useMediaPreload'

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
  const query = useApiQuery<{ content: DirectorTextContent }>(['director-text'], '/api/director-text')
  const content = computed(() => query.data.value?.content || emptyContent())
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

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

  watch(displayPhotoUrl, (url) => {
    if (url) {
      warmMediaUrls([url])
    }
  })

  return {
    content,
    localizedText,
    localizedName,
    localizedPosition,
    displayPhotoUrl,
    hasContent,
    isLoading: query.isLoading,
    error: query.error,
    loadDirectorText: query.refetch,
  }
}
