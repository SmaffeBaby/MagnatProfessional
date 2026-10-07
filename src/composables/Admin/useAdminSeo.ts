import { computed, reactive, ref } from 'vue'
import { adminRequest } from '../useAdminApi'
import type { SeoEntry, SeoEntryScope } from '../useSeo'

export type SeoEntryForm = {
  id: string | null
  scope: SeoEntryScope
  path: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  keywords: string
  keywordsEn: string
  hashtags: string
  hashtagsEn: string
  ogTitle: string
  ogTitleEn: string
  ogDescription: string
  ogDescriptionEn: string
  ogImageUrl: string
  canonicalPath: string
  robots: string
  priority: number
  changeFrequency: string
  structuredData: string
  metrics: string
}

function emptyForm(): SeoEntryForm {
  return {
    id: null,
    scope: 'page',
    path: '/',
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    keywords: '',
    keywordsEn: '',
    hashtags: '',
    hashtagsEn: '',
    ogTitle: '',
    ogTitleEn: '',
    ogDescription: '',
    ogDescriptionEn: '',
    ogImageUrl: '',
    canonicalPath: '',
    robots: 'index,follow',
    priority: 0.5,
    changeFrequency: 'weekly',
    structuredData: '',
    metrics: '',
  }
}

export function useAdminSeo() {
  const form = reactive<SeoEntryForm>(emptyForm())
  const entries = ref<SeoEntry[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')
  const successMessage = ref('')

  const formTitle = computed(() => form.id ? 'Редактирование SEO записи' : 'Новая SEO запись')

  async function loadEntries() {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/seo')
      entries.value = payload.entries
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function saveEntry() {
    isSaving.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const path = form.id ? `/api/admin/seo/${form.id}` : '/api/admin/seo'
      const method = form.id ? 'PUT' : 'POST'

      await adminRequest(path, {
        method,
        body: JSON.stringify(form),
      })

      successMessage.value = 'SEO запись сохранена'
      resetForm()
      await loadEntries()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSaving.value = false
    }
  }

  async function deleteEntry(entry: SeoEntry) {
    if (!window.confirm(`Удалить SEO запись для «${entry.path}»?`)) {
      return
    }

    isLoading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      await adminRequest(`/api/admin/seo/${entry.id}`, {
        method: 'DELETE',
      })
      await loadEntries()
      if (form.id === entry.id) {
        resetForm()
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  function editEntry(entry: SeoEntry) {
    Object.assign(form, {
      id: entry.id,
      scope: entry.scope,
      path: entry.path,
      title: entry.title || '',
      titleEn: entry.titleEn || '',
      description: entry.description || '',
      descriptionEn: entry.descriptionEn || '',
      keywords: entry.keywords || '',
      keywordsEn: entry.keywordsEn || '',
      hashtags: entry.hashtags || '',
      hashtagsEn: entry.hashtagsEn || '',
      ogTitle: entry.ogTitle || '',
      ogTitleEn: entry.ogTitleEn || '',
      ogDescription: entry.ogDescription || '',
      ogDescriptionEn: entry.ogDescriptionEn || '',
      ogImageUrl: entry.ogImageUrl || '',
      canonicalPath: entry.canonicalPath || '',
      robots: entry.robots || 'index,follow',
      priority: entry.priority ?? 0.5,
      changeFrequency: entry.changeFrequency || 'weekly',
      structuredData: entry.structuredData || '',
      metrics: entry.metrics || '',
    })
  }

  function resetForm() {
    Object.assign(form, emptyForm())
  }

  function clearEntries() {
    entries.value = []
    resetForm()
    successMessage.value = ''
  }

  return {
    form,
    entries,
    isLoading,
    isSaving,
    error,
    successMessage,
    formTitle,
    loadEntries,
    saveEntry,
    deleteEntry,
    editEntry,
    resetForm,
    clearEntries,
  }
}
