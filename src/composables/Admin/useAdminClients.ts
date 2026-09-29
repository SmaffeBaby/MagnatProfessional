import { computed, reactive, ref } from 'vue'
import { adminRequest, deleteAdminFile, uploadAdminFile } from '../useAdminApi'
import type { ClientItem } from '../useClients'

export type ClientForm = {
  id: string | null
  sortOrder: number
  imagePath: string | null
  imageUrl: string | null
  linkUrl: string
}

function emptyForm(): ClientForm {
  return {
    id: null,
    sortOrder: 0,
    imagePath: null,
    imageUrl: null,
    linkUrl: '',
  }
}

export function useAdminClients() {
  const form = reactive<ClientForm>(emptyForm())
  const items = ref<ClientItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const uploadField = ref('')
  const error = ref('')

  const formTitle = computed(() => form.id ? 'Редактирование клиента' : 'Новый клиент')

  async function loadItems() {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/clients')
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
      const path = form.id ? `/api/admin/clients/${form.id}` : '/api/admin/clients'
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

  async function deleteItem(item: ClientItem) {
    if (!window.confirm('Удалить клиента?')) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/clients/${item.id}`, {
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

  async function uploadImage(file: File) {
    uploadField.value = 'image'
    error.value = ''

    try {
      const uploaded = await uploadAdminFile(file, 'clients')
      form.imagePath = uploaded.path
      form.imageUrl = uploaded.publicUrl
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
  }

  async function deleteImage() {
    if (form.imagePath) {
      await deleteAdminFile('clients', form.imagePath)
    }

    form.imagePath = null
    form.imageUrl = null
  }

  function editItem(item: ClientItem) {
    Object.assign(form, {
      id: item.id,
      sortOrder: item.sortOrder,
      imagePath: item.imagePath || null,
      imageUrl: item.imageUrl || null,
      linkUrl: item.linkUrl || '',
    })
  }

  function resetForm() {
    Object.assign(form, emptyForm())
  }

  function clearItems() {
    items.value = []
    resetForm()
    error.value = ''
    uploadField.value = ''
  }

  return {
    form,
    items,
    isLoading,
    isSaving,
    uploadField,
    error,
    formTitle,
    loadItems,
    saveItem,
    deleteItem,
    uploadImage,
    deleteImage,
    editItem,
    resetForm,
    clearItems,
  }
}
