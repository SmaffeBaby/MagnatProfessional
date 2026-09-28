import { computed, reactive, ref } from 'vue'
import { adminRequest } from '../useAdminApi'
import type { HystoryCompanyItem } from '../useHystoryCompany'

export type HystoryCompanyForm = {
  id: string | null
  year: string
  sortOrder: number
  title: string
  titleEn: string
  text: string
  textEn: string
}

function emptyForm(): HystoryCompanyForm {
  return {
    id: null,
    year: '',
    sortOrder: 0,
    title: '',
    titleEn: '',
    text: '',
    textEn: '',
  }
}

export function useAdminHystoryCompany() {
  const form = reactive<HystoryCompanyForm>(emptyForm())
  const items = ref<HystoryCompanyItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const formTitle = computed(() => form.id ? 'Редактирование события' : 'Новое событие')

  async function loadItems() {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/hystory-company')
      items.value = payload.items
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function saveItem() {
    isSaving.value = true
    error.value = ''

    try {
      const path = form.id ? `/api/admin/hystory-company/${form.id}` : '/api/admin/hystory-company'
      const method = form.id ? 'PUT' : 'POST'

      await adminRequest(path, {
        method,
        body: JSON.stringify(form),
      })

      resetForm()
      await loadItems()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSaving.value = false
    }
  }

  async function deleteItem(item: HystoryCompanyItem) {
    if (!window.confirm(`Удалить событие «${item.year}»?`)) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/hystory-company/${item.id}`, {
        method: 'DELETE',
      })
      await loadItems()
      if (form.id === item.id) {
        resetForm()
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  function editItem(item: HystoryCompanyItem) {
    Object.assign(form, {
      id: item.id,
      year: item.year,
      sortOrder: item.sortOrder,
      title: item.title,
      titleEn: item.titleEn || '',
      text: item.text,
      textEn: item.textEn || '',
    })
  }

  function resetForm() {
    Object.assign(form, emptyForm())
  }

  function clearItems() {
    items.value = []
    resetForm()
  }

  return {
    form,
    items,
    isLoading,
    isSaving,
    error,
    formTitle,
    loadItems,
    saveItem,
    deleteItem,
    editItem,
    resetForm,
    clearItems,
  }
}
