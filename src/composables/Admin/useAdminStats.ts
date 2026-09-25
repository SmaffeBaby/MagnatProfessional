import { computed, reactive, ref } from 'vue'
import { adminRequest } from '../useAdminApi'
import type { StatsItem } from '../useStats'

export type StatsForm = {
  id: string | null
  numberText: string
  sortOrder: number
  text: string
  textEn: string
}

function emptyForm(): StatsForm {
  return {
    id: null,
    numberText: '',
    sortOrder: 0,
    text: '',
    textEn: '',
  }
}

export function useAdminStats() {
  const form = reactive<StatsForm>(emptyForm())
  const items = ref<StatsItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const formTitle = computed(() => form.id ? 'Редактирование показателя' : 'Новый показатель')

  async function loadItems() {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/stats')
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
      const path = form.id ? `/api/admin/stats/${form.id}` : '/api/admin/stats'
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

  async function deleteItem(item: StatsItem) {
    if (!window.confirm(`Удалить показатель «${item.numberText}»?`)) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/stats/${item.id}`, {
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

  function editItem(item: StatsItem) {
    Object.assign(form, {
      id: item.id,
      numberText: item.numberText,
      sortOrder: item.sortOrder,
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
