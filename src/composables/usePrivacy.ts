import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'

export type PrivacyTableRow = {
  left: string
  right: string
}

export type PrivacyBlock = {
  id: string
  type: 'text' | 'table'
  sortOrder: number
  title: string
  titleEn?: string | null
  text: string
  textEn?: string | null
  tableRows: PrivacyTableRow[]
  tableRowsEn: PrivacyTableRow[]
  createdAt?: string
  updatedAt?: string
}

export function usePrivacy() {
  const query = useApiQuery<{ blocks: PrivacyBlock[] }>(['privacy'], '/api/privacy')
  const blocks = computed(() => Array.isArray(query.data.value?.blocks) ? query.data.value.blocks : [])
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

  const localizedTitle = computed(() => (
    locale.value === 'en'
      ? 'Personal data processing policy'
      : 'Политика в отношении обработки персональных данных'
  ))

  const localizedBlocks = computed(() => blocks.value.map((block) => ({
    ...block,
    localizedTitle: locale.value === 'en' && block.titleEn ? block.titleEn : block.title,
    localizedText: locale.value === 'en' && block.textEn ? block.textEn : block.text,
    localizedTableRows: locale.value === 'en' && block.tableRowsEn?.length
      ? block.tableRowsEn
      : block.tableRows,
  })))

  return {
    blocks,
    localizedBlocks,
    localizedTitle,
    isLoading: query.isLoading,
    error: query.error,
    loadPrivacy: query.refetch,
  }
}
