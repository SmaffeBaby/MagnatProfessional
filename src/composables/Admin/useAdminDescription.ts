import { reactive, ref } from 'vue'
import { adminRequest, uploadAdminFile } from '../useAdminApi'
import type { DescriptionContent } from '../useDescription'

export type DescriptionPlaqueTarget = 'desktopPlaque' | 'tabletPlaque' | 'mobilePlaque'

export type DescriptionForm = {
  text: string
  textEn: string
  cardText: string
  cardTextEn: string
  desktopPlaquePath: string | null
  desktopPlaqueUrl: string | null
  tabletPlaquePath: string | null
  tabletPlaqueUrl: string | null
  mobilePlaquePath: string | null
  mobilePlaqueUrl: string | null
}

function emptyForm(): DescriptionForm {
  return {
    text: '',
    textEn: '',
    cardText: '',
    cardTextEn: '',
    desktopPlaquePath: null,
    desktopPlaqueUrl: null,
    tabletPlaquePath: null,
    tabletPlaqueUrl: null,
    mobilePlaquePath: null,
    mobilePlaqueUrl: null,
  }
}

function applyContentToForm(form: DescriptionForm, content: DescriptionContent) {
  Object.assign(form, {
    text: content.text || '',
    textEn: content.textEn || '',
    cardText: content.cardText || '',
    cardTextEn: content.cardTextEn || '',
    desktopPlaquePath: content.desktopPlaquePath || null,
    desktopPlaqueUrl: content.desktopPlaqueUrl || null,
    tabletPlaquePath: content.tabletPlaquePath || null,
    tabletPlaqueUrl: content.tabletPlaqueUrl || null,
    mobilePlaquePath: content.mobilePlaquePath || null,
    mobilePlaqueUrl: content.mobilePlaqueUrl || null,
  })
}

export function useAdminDescription() {
  const form = reactive<DescriptionForm>(emptyForm())
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
      const payload = await adminRequest('/api/admin/description')
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
      const payload = await adminRequest('/api/admin/description', {
        method: 'PUT',
        body: JSON.stringify(form),
      })

      applyContentToForm(form, payload.content)
      successMessage.value = 'Компонент «Описание» сохранён'
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSaving.value = false
    }
  }

  async function uploadPlaque(file: File, target: DescriptionPlaqueTarget) {
    uploadField.value = target
    error.value = ''
    successMessage.value = ''

    try {
      const uploaded = await uploadAdminFile(file)
      const pathKey = `${target}Path` as keyof DescriptionForm
      const urlKey = `${target}Url` as keyof DescriptionForm
      form[pathKey] = uploaded.path
      form[urlKey] = uploaded.publicUrl
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
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
    uploadPlaque,
    clearContent,
  }
}
