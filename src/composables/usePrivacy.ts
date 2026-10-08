import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguageStore } from './useLanguageStore'
import { useApiQuery } from './useApiQuery'

export type LegalDocumentKey = 'privacy' | 'user-agreement' | 'policy'

export type PrivacyTableRow = {
  left: string
  right: string
}

export type PrivacyBlock = {
  id: string
  documentKey?: LegalDocumentKey
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

const documentTitles: Record<LegalDocumentKey, { ru: string; en: string }> = {
  privacy: {
    ru: 'Политика в отношении обработки персональных данных',
    en: 'Personal data processing policy',
  },
  'user-agreement': {
    ru: 'Пользовательское соглашение',
    en: 'User agreement',
  },
  policy: {
    ru: 'Политика',
    en: 'Policy',
  },
}

function resolveDocumentKey(documentKey: MaybeRefOrGetter<LegalDocumentKey>) {
  return toValue(documentKey) || 'privacy'
}

export function useLegalDocument(documentKey: MaybeRefOrGetter<LegalDocumentKey> = 'privacy') {
  const query = useApiQuery<{ blocks: PrivacyBlock[] }>(
    computed(() => ['legal-document', resolveDocumentKey(documentKey)]),
    computed(() => `/api/legal-documents/${resolveDocumentKey(documentKey)}`),
  )
  const blocks = computed(() => Array.isArray(query.data.value?.blocks) ? query.data.value.blocks : [])
  const languageStore = useLanguageStore()
  const { locale } = storeToRefs(languageStore)

  const localizedTitle = computed(() => {
    const titles = documentTitles[resolveDocumentKey(documentKey)] || documentTitles.privacy

    return locale.value === 'en' ? titles.en : titles.ru
  })

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
    loadDocument: query.refetch,
    loadPrivacy: query.refetch,
  }
}

export function usePrivacy() {
  return useLegalDocument('privacy')
}
