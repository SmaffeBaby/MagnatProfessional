import { reactive, ref } from 'vue'
import { adminRequest } from '../useAdminApi'
import type { AboutUsContent } from '../useAboutUs'

export type AboutUsForm = {
  text: string
  textEn: string
  buttonText: string
  buttonTextEn: string
}

function emptyForm(): AboutUsForm {
  return {
    text: '',
    textEn: '',
    buttonText: '',
    buttonTextEn: '',
  }
}

function applyContentToForm(form: AboutUsForm, content: AboutUsContent) {
  Object.assign(form, {
    text: content.text || '',
    textEn: content.textEn || '',
    buttonText: content.buttonText || '',
    buttonTextEn: content.buttonTextEn || '',
  })
}

export function useAdminAboutUs() {
  const form = reactive<AboutUsForm>(emptyForm())
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')
  const successMessage = ref('')

  async function loadContent() {
    isLoading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const payload = await adminRequest('/api/admin/about-us')
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
      const payload = await adminRequest('/api/admin/about-us', {
        method: 'PUT',
        body: JSON.stringify(form),
      })

      applyContentToForm(form, payload.content)
      successMessage.value = 'Компонент «О нас» сохранён'
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSaving.value = false
    }
  }

  function clearContent() {
    Object.assign(form, emptyForm())
    error.value = ''
    successMessage.value = ''
  }

  return {
    form,
    isLoading,
    isSaving,
    error,
    successMessage,
    loadContent,
    saveContent,
    clearContent,
  }
}
