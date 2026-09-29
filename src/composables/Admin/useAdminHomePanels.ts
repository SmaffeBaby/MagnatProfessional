import { computed, reactive, ref } from 'vue'
import { adminRequest, deleteAdminFile, uploadAdminFile } from '../useAdminApi'
import type { HomePanel, HomePanelTileType, PortfolioCard } from '../useHomePanels'

export type PanelForm = {
  id: string | null
  title: string
  titleEn: string
  detailText: string
  detailTextEn: string
  mascotPath: string | null
  mascotUrl: string | null
  sortOrder: number
  gradientFromColor: string
  gradientFromOpacity: number
  gradientToColor: string
  gradientToOpacity: number
  gradientToPosition: number
  imagePath: string | null
  imageUrl: string | null
  videoPath: string | null
  videoUrl: string | null
  posterPath: string | null
  posterUrl: string | null
  linkPath: string
  tileType: HomePanelTileType
}

export type PortfolioCardForm = Omit<PanelForm, 'detailText' | 'detailTextEn' | 'mascotPath' | 'mascotUrl'>
export type PanelUploadTarget = 'image' | 'video' | 'poster' | 'mascot'

function emptyForm(): PanelForm {
  return {
    id: null,
    title: '',
    titleEn: '',
    detailText: '',
    detailTextEn: '',
    mascotPath: null,
    mascotUrl: null,
    sortOrder: 0,
    gradientFromColor: '#DA2128',
    gradientFromOpacity: 1,
    gradientToColor: '#DA2128',
    gradientToOpacity: 0,
    gradientToPosition: 70,
    imagePath: null,
    imageUrl: null,
    videoPath: null,
    videoUrl: null,
    posterPath: null,
    posterUrl: null,
    linkPath: '/',
    tileType: 'wide',
  }
}

function emptyCardForm(): PortfolioCardForm {
  return {
    id: null,
    title: '',
    titleEn: '',
    sortOrder: 0,
    gradientFromColor: '#DA2128',
    gradientFromOpacity: 1,
    gradientToColor: '#DA2128',
    gradientToOpacity: 0,
    gradientToPosition: 70,
    imagePath: null,
    imageUrl: null,
    videoPath: null,
    videoUrl: null,
    posterPath: null,
    posterUrl: null,
    linkPath: '/',
    tileType: 'vertical',
  }
}

export function useAdminHomePanels() {
  const panelForm = reactive<PanelForm>(emptyForm())
  const cardForm = reactive<PortfolioCardForm>(emptyCardForm())
  const panels = ref<HomePanel[]>([])
  const cards = ref<PortfolioCard[]>([])
  const selectedPanel = ref<HomePanel | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isSavingCard = ref(false)
  const isLoadingCards = ref(false)
  const uploadField = ref('')
  const error = ref('')

  const formTitle = computed(() => panelForm.id ? 'Редактирование панели' : 'Новая панель')
  const cardFormTitle = computed(() => cardForm.id ? 'Редактирование карточки' : 'Новая карточка')

  async function loadPanels() {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/home-panels')
      panels.value = payload.panels
      if (selectedPanel.value) {
        selectedPanel.value = panels.value.find((panel) => panel.id === selectedPanel.value?.id) || null
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function savePanel() {
    isSaving.value = true
    error.value = ''

    try {
      const path = panelForm.id
        ? `/api/admin/home-panels/${panelForm.id}`
        : '/api/admin/home-panels'
      const method = panelForm.id ? 'PUT' : 'POST'

      await adminRequest(path, {
        method,
        body: JSON.stringify(panelForm),
      })

      resetForm()
      await loadPanels()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSaving.value = false
    }
  }

  async function deletePanel(panel: HomePanel) {
    if (!window.confirm(`Удалить панель «${panel.title}»?`)) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/home-panels/${panel.id}`, {
        method: 'DELETE',
      })
      await loadPanels()
      if (panelForm.id === panel.id) {
        resetForm()
      }
      if (selectedPanel.value?.id === panel.id) {
        selectedPanel.value = null
        cards.value = []
        resetCardForm()
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function loadCards(panel: HomePanel) {
    selectedPanel.value = panel
    isLoadingCards.value = true
    error.value = ''

    try {
      const payload = await adminRequest(`/api/admin/home-panels/${panel.id}/cards`)
      cards.value = payload.cards
      resetCardForm()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoadingCards.value = false
    }
  }

  async function saveCard() {
    if (!selectedPanel.value) {
      error.value = 'Сначала выберите панель'
      return
    }

    isSavingCard.value = true
    error.value = ''

    try {
      const path = cardForm.id
        ? `/api/admin/home-panels/${selectedPanel.value.id}/cards/${cardForm.id}`
        : `/api/admin/home-panels/${selectedPanel.value.id}/cards`
      const method = cardForm.id ? 'PUT' : 'POST'

      await adminRequest(path, {
        method,
        body: JSON.stringify(cardForm),
      })

      resetCardForm()
      await loadCards(selectedPanel.value)
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSavingCard.value = false
    }
  }

  async function deleteCard(card: PortfolioCard) {
    if (!selectedPanel.value || !window.confirm(`Удалить карточку «${card.title}»?`)) {
      return
    }

    isLoadingCards.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/home-panels/${selectedPanel.value.id}/cards/${card.id}`, {
        method: 'DELETE',
      })
      await loadCards(selectedPanel.value)
      if (cardForm.id === card.id) {
        resetCardForm()
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoadingCards.value = false
    }
  }

  async function uploadFile(file: File, target: PanelUploadTarget) {
    uploadField.value = target
    error.value = ''

    try {
      const bucket = target === 'mascot' ? 'portfolio' : 'home-panels'
      const uploaded = await uploadAdminFile(file, bucket)
      if (target === 'mascot') {
        panelForm.mascotPath = uploaded.path
        panelForm.mascotUrl = uploaded.publicUrl
        return
      }

      const pathKey = `${target}Path` as keyof PanelForm
      const urlKey = `${target}Url` as keyof PanelForm
      panelForm[pathKey] = uploaded.path
      panelForm[urlKey] = uploaded.publicUrl
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
  }

  async function uploadCardFile(file: File, target: Exclude<PanelUploadTarget, 'mascot'>) {
    uploadField.value = `card-${target}`
    error.value = ''

    try {
      const uploaded = await uploadAdminFile(file, 'portfolio')
      const pathKey = `${target}Path` as keyof PortfolioCardForm
      const urlKey = `${target}Url` as keyof PortfolioCardForm
      cardForm[pathKey] = uploaded.path
      cardForm[urlKey] = uploaded.publicUrl
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
  }

  async function deletePanelFile(target: PanelUploadTarget) {
    const bucket = target === 'mascot' ? 'portfolio' : 'home-panels'
    const pathKey = `${target}Path` as keyof PanelForm
    const urlKey = `${target}Url` as keyof PanelForm
    const path = panelForm[pathKey]

    if (typeof path === 'string' && path) {
      await deleteAdminFile(bucket, path)
    }

    panelForm[pathKey] = null
    panelForm[urlKey] = null
  }

  async function deleteCardFile(target: Exclude<PanelUploadTarget, 'mascot'>) {
    const pathKey = `${target}Path` as keyof PortfolioCardForm
    const urlKey = `${target}Url` as keyof PortfolioCardForm
    const path = cardForm[pathKey]

    if (typeof path === 'string' && path) {
      await deleteAdminFile('portfolio', path)
    }

    cardForm[pathKey] = null
    cardForm[urlKey] = null
  }

  function editPanel(panel: HomePanel) {
    Object.assign(panelForm, {
      id: panel.id,
      title: panel.title,
      titleEn: panel.titleEn || '',
      detailText: panel.detailText || '',
      detailTextEn: panel.detailTextEn || '',
      mascotPath: panel.mascotPath || null,
      mascotUrl: panel.mascotUrl || null,
      sortOrder: panel.sortOrder,
      gradientFromColor: panel.gradientFromColor || '#DA2128',
      gradientFromOpacity: panel.gradientFromOpacity ?? 1,
      gradientToColor: panel.gradientToColor || '#DA2128',
      gradientToOpacity: panel.gradientToOpacity ?? 0,
      gradientToPosition: panel.gradientToPosition ?? 70,
      imagePath: panel.imagePath || null,
      imageUrl: panel.imageUrl || null,
      videoPath: panel.videoPath || null,
      videoUrl: panel.videoUrl || null,
      posterPath: panel.posterPath || null,
      posterUrl: panel.posterUrl || null,
      linkPath: panel.linkPath || '/',
      tileType: panel.tileType,
    })
  }

  function editCard(card: PortfolioCard) {
    Object.assign(cardForm, {
      id: card.id,
      title: card.title,
      titleEn: card.titleEn || '',
      sortOrder: card.sortOrder,
      gradientFromColor: card.gradientFromColor || '#DA2128',
      gradientFromOpacity: card.gradientFromOpacity ?? 1,
      gradientToColor: card.gradientToColor || '#DA2128',
      gradientToOpacity: card.gradientToOpacity ?? 0,
      gradientToPosition: card.gradientToPosition ?? 70,
      imagePath: card.imagePath || null,
      imageUrl: card.imageUrl || null,
      videoPath: card.videoPath || null,
      videoUrl: card.videoUrl || null,
      posterPath: card.posterPath || null,
      posterUrl: card.posterUrl || null,
      linkPath: card.linkPath || '/',
      tileType: card.tileType,
    })
  }

  function resetForm() {
    Object.assign(panelForm, emptyForm())
  }

  function resetCardForm() {
    Object.assign(cardForm, emptyCardForm())
  }

  function clearPanels() {
    panels.value = []
    cards.value = []
    selectedPanel.value = null
    resetForm()
    resetCardForm()
  }

  return {
    panelForm,
    cardForm,
    panels,
    cards,
    selectedPanel,
    isLoading,
    isSaving,
    isSavingCard,
    isLoadingCards,
    uploadField,
    error,
    formTitle,
    cardFormTitle,
    loadPanels,
    loadCards,
    savePanel,
    saveCard,
    deletePanel,
    deleteCard,
    uploadFile,
    uploadCardFile,
    deletePanelFile,
    deleteCardFile,
    editPanel,
    editCard,
    resetForm,
    resetCardForm,
    clearPanels,
  }
}
