import { computed, reactive, ref } from 'vue'
import { adminRequest } from '../useAdminApi'
import type { MissionValuesCard, MissionValuesContent } from '../useMissionValues'

export type MissionValuesContentForm = {
  mainText: string
  mainTextEn: string
  mainTextHtml: string
  mainTextHtmlEn: string
}

export type MissionValuesCardForm = {
  id: string | null
  sortOrder: number
  title: string
  titleEn: string
  text: string
  textEn: string
}

function emptyContentForm(): MissionValuesContentForm {
  return {
    mainText: '',
    mainTextEn: '',
    mainTextHtml: '',
    mainTextHtmlEn: '',
  }
}

function emptyCardForm(): MissionValuesCardForm {
  return {
    id: null,
    sortOrder: 0,
    title: '',
    titleEn: '',
    text: '',
    textEn: '',
  }
}

function applyContentToForm(form: MissionValuesContentForm, content: MissionValuesContent) {
  Object.assign(form, {
    mainText: content.mainText || '',
    mainTextEn: content.mainTextEn || '',
    mainTextHtml: content.mainTextHtml || content.mainText || '',
    mainTextHtmlEn: content.mainTextHtmlEn || content.mainTextEn || '',
  })
}

export function useAdminMissionValues() {
  const contentForm = reactive<MissionValuesContentForm>(emptyContentForm())
  const cardForm = reactive<MissionValuesCardForm>(emptyCardForm())
  const cards = ref<MissionValuesCard[]>([])
  const isLoading = ref(false)
  const isSavingContent = ref(false)
  const isSavingCard = ref(false)
  const error = ref('')
  const successMessage = ref('')

  const cardFormTitle = computed(() => cardForm.id ? 'Редактирование карточки' : 'Новая карточка')

  async function loadContent() {
    isLoading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const payload = await adminRequest('/api/admin/mission-values')
      applyContentToForm(contentForm, payload.content)
      cards.value = payload.cards
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function saveContent() {
    isSavingContent.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const payload = await adminRequest('/api/admin/mission-values', {
        method: 'PUT',
        body: JSON.stringify(contentForm),
      })

      applyContentToForm(contentForm, payload.content)
      successMessage.value = 'Главный текст сохранён'
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSavingContent.value = false
    }
  }

  async function saveCard() {
    isSavingCard.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const path = cardForm.id ? `/api/admin/mission-values/cards/${cardForm.id}` : '/api/admin/mission-values/cards'
      const method = cardForm.id ? 'PUT' : 'POST'

      await adminRequest(path, {
        method,
        body: JSON.stringify(cardForm),
      })

      resetCardForm()
      await loadContent()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSavingCard.value = false
    }
  }

  async function deleteCard(card: MissionValuesCard) {
    if (!window.confirm(`Удалить карточку «${card.title}»?`)) {
      return
    }

    isLoading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      await adminRequest(`/api/admin/mission-values/cards/${card.id}`, {
        method: 'DELETE',
      })
      await loadContent()
      if (cardForm.id === card.id) {
        resetCardForm()
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  function editCard(card: MissionValuesCard) {
    Object.assign(cardForm, {
      id: card.id,
      sortOrder: card.sortOrder,
      title: card.title,
      titleEn: card.titleEn || '',
      text: card.text,
      textEn: card.textEn || '',
    })
  }

  function resetCardForm() {
    Object.assign(cardForm, emptyCardForm())
  }

  function clearContent() {
    Object.assign(contentForm, emptyContentForm())
    cards.value = []
    resetCardForm()
    error.value = ''
    successMessage.value = ''
  }

  return {
    contentForm,
    cardForm,
    cards,
    isLoading,
    isSavingContent,
    isSavingCard,
    error,
    successMessage,
    cardFormTitle,
    loadContent,
    saveContent,
    saveCard,
    deleteCard,
    editCard,
    resetCardForm,
    clearContent,
  }
}
