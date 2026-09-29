import { reactive, ref } from 'vue'
import { adminRequest, deleteAdminFile, uploadAdminFile } from '../useAdminApi'
import type { DirectorTextContent } from '../useDirectorText'

export type DirectorTextPhotoTarget = 'photo' | 'thumbnail'

export type DirectorTextForm = {
  text: string
  textEn: string
  photoPath: string | null
  photoUrl: string | null
  thumbnailPath: string | null
  thumbnailUrl: string | null
  name: string
  nameEn: string
  position: string
  positionEn: string
}

function emptyForm(): DirectorTextForm {
  return {
    text: '',
    textEn: '',
    photoPath: null,
    photoUrl: null,
    thumbnailPath: null,
    thumbnailUrl: null,
    name: '',
    nameEn: '',
    position: '',
    positionEn: '',
  }
}

function applyContentToForm(form: DirectorTextForm, content: DirectorTextContent) {
  Object.assign(form, {
    text: content.text || '',
    textEn: content.textEn || '',
    photoPath: content.photoPath || null,
    photoUrl: content.photoUrl || null,
    thumbnailPath: content.thumbnailPath || null,
    thumbnailUrl: content.thumbnailUrl || null,
    name: content.name || '',
    nameEn: content.nameEn || '',
    position: content.position || '',
    positionEn: content.positionEn || '',
  })
}

export function useAdminDirectorText() {
  const form = reactive<DirectorTextForm>(emptyForm())
  const isLoading = ref(false)
  const isSaving = ref(false)
  const uploadField = ref('')
  const error = ref('')
  const successMessage = ref('')

  async function loadContent() {
    isLoading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const payload = await adminRequest('/api/admin/director-text')
      applyContentToForm(form, payload.content)
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function saveContent() {
    isSaving.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const payload = await adminRequest('/api/admin/director-text', {
        method: 'PUT',
        body: JSON.stringify(form),
      })

      applyContentToForm(form, payload.content)
      successMessage.value = 'Компонент DirectorText сохранён'
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSaving.value = false
    }
  }

  async function uploadPhoto(file: File, target: DirectorTextPhotoTarget) {
    uploadField.value = target
    error.value = ''
    successMessage.value = ''

    try {
      const uploaded = await uploadAdminFile(file, 'director-text')
      const pathKey = `${target}Path` as keyof DirectorTextForm
      const urlKey = `${target}Url` as keyof DirectorTextForm
      form[pathKey] = uploaded.path
      form[urlKey] = uploaded.publicUrl
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
  }

  async function deletePhoto(target: DirectorTextPhotoTarget) {
    const pathKey = `${target}Path` as keyof DirectorTextForm
    const urlKey = `${target}Url` as keyof DirectorTextForm
    const path = form[pathKey]

    if (typeof path === 'string' && path) {
      await deleteAdminFile('director-text', path)
    }

    form[pathKey] = null
    form[urlKey] = null
  }

  function clearContent() {
    Object.assign(form, emptyForm())
    error.value = ''
    successMessage.value = ''
    uploadField.value = ''
  }

  return {
    form,
    isLoading,
    isSaving,
    uploadField,
    error,
    successMessage,
    loadContent,
    saveContent,
    uploadPhoto,
    deletePhoto,
    clearContent,
  }
}
