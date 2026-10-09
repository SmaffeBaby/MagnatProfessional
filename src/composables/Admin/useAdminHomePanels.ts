import { computed, reactive, ref } from 'vue'
import { adminRequest, deleteAdminFile, getAdminToken, uploadAdminFile } from '../useAdminApi'
import type {
  HomePanel,
  HomePanelTileType,
  PortfolioArticleBlock,
  PortfolioArticleImageGroup,
  PortfolioArticleBlockLayout,
  PortfolioCard,
} from '../useHomePanels'

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

export type PortfolioCardForm = Omit<PanelForm, 'detailText' | 'detailTextEn' | 'mascotPath' | 'mascotUrl'> & {
  articleBlocks: PortfolioArticleBlock[]
}
export type PortfolioCaseForm = {
  cardId: string | null
  title: string
  linkPath: string
  caseHeroPath: string | null
  caseHeroUrl: string | null
  articleBlocks: PortfolioArticleBlock[]
}
export type PanelUploadTarget = 'image' | 'video' | 'poster' | 'mascot'

function createClientId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

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
    articleBlocks: [],
  }
}

function emptyCaseForm(): PortfolioCaseForm {
  return {
    cardId: null,
    title: '',
    linkPath: '/',
    caseHeroPath: null,
    caseHeroUrl: null,
    articleBlocks: [],
  }
}

function cloneArticleBlocks(blocks: PortfolioArticleBlock[] = []): PortfolioArticleBlock[] {
  return blocks.map((block) => ({
    id: block.id,
    title: block.title || '',
    titleEn: block.titleEn || '',
    text: block.text || '',
    textEn: block.textEn || '',
    layout: block.layout,
    sortOrder: block.sortOrder,
    imageGroups: cloneArticleImageGroups(block.imageGroups?.length
      ? block.imageGroups
      : block.images?.length
        ? [{ id: createClientId(), layout: block.layout, images: block.images }]
        : []),
    images: [],
  }))
}

function cloneArticleImageGroups(groups: PortfolioArticleImageGroup[] = []): PortfolioArticleImageGroup[] {
  return groups.map((group, groupIndex) => ({
    id: group.id || createClientId(),
    layout: group.layout || 'single-wide',
    sortOrder: group.sortOrder ?? groupIndex,
    images: (group.images || []).map((image, imageIndex) => ({
      id: image.id || createClientId(),
      path: image.path || null,
      url: image.url || '',
      alt: image.alt || '',
      sortOrder: image.sortOrder ?? imageIndex,
    })),
  }))
}

function flattenArticleBlockImages(block: PortfolioArticleBlock) {
  return (block.imageGroups || []).flatMap((group) => group.images)
}

function getPanelFile(form: PanelForm, target: PanelUploadTarget) {
  switch (target) {
    case 'image':
      return form.imagePath
    case 'video':
      return form.videoPath
    case 'poster':
      return form.posterPath
    case 'mascot':
      return form.mascotPath
  }
}

function setPanelFile(form: PanelForm, target: PanelUploadTarget, path: string | null, url: string | null) {
  switch (target) {
    case 'image':
      form.imagePath = path
      form.imageUrl = url
      break
    case 'video':
      form.videoPath = path
      form.videoUrl = url
      break
    case 'poster':
      form.posterPath = path
      form.posterUrl = url
      break
    case 'mascot':
      form.mascotPath = path
      form.mascotUrl = url
      break
  }
}

function getCardFile(form: PortfolioCardForm, target: Exclude<PanelUploadTarget, 'mascot'>) {
  switch (target) {
    case 'image':
      return form.imagePath
    case 'video':
      return form.videoPath
    case 'poster':
      return form.posterPath
  }
}

function setCardFile(
  form: PortfolioCardForm,
  target: Exclude<PanelUploadTarget, 'mascot'>,
  path: string | null,
  url: string | null,
) {
  switch (target) {
    case 'image':
      form.imagePath = path
      form.imageUrl = url
      break
    case 'video':
      form.videoPath = path
      form.videoUrl = url
      break
    case 'poster':
      form.posterPath = path
      form.posterUrl = url
      break
  }
}

export function useAdminHomePanels() {
  const panelForm = reactive<PanelForm>(emptyForm())
  const cardForm = reactive<PortfolioCardForm>(emptyCardForm())
  const caseForm = reactive<PortfolioCaseForm>(emptyCaseForm())
  const panels = ref<HomePanel[]>([])
  const cards = ref<PortfolioCard[]>([])
  const selectedPanel = ref<HomePanel | null>(null)
  const selectedCaseCard = ref<PortfolioCard | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isSavingCard = ref(false)
  const isLoadingCards = ref(false)
  const uploadField = ref('')
  const error = ref('')

  const formTitle = computed(() => panelForm.id ? 'Редактирование панели' : 'Новая панель')
  const cardFormTitle = computed(() => cardForm.id ? 'Редактирование карточки' : 'Новая карточка')
  const caseFormTitle = computed(() => caseForm.cardId ? `Кейс: ${caseForm.title}` : 'Кейс карточки')

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
      resetCaseForm()
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
      const { articleBlocks: _articleBlocks, ...cardPayload } = cardForm
      const path = cardForm.id
        ? `/api/admin/home-panels/${selectedPanel.value.id}/cards/${cardForm.id}`
        : `/api/admin/home-panels/${selectedPanel.value.id}/cards`
      const method = cardForm.id ? 'PUT' : 'POST'

      await adminRequest(path, {
        method,
        body: JSON.stringify(cardPayload),
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
      if (caseForm.cardId === card.id) {
        resetCaseForm()
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoadingCards.value = false
    }
  }

  async function exportPanelsArchive() {
    error.value = ''

    try {
      const headers = new Headers()
      const token = getAdminToken()

      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      const response = await fetch('/api/admin/home-panels/export', { headers })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || `Request failed with status ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `magnat-home-panels-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (requestError) {
      error.value = (requestError as Error).message
    }
  }

  async function importPanelsArchive(file: File) {
    if (!window.confirm('Импорт заменит текущие панели, карточки и кейсы данными из ZIP-архива. Продолжить?')) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      const body = new FormData()
      body.append('archive', file)
      await adminRequest('/api/admin/home-panels/import', {
        method: 'POST',
        body,
      })

      resetForm()
      resetCardForm()
      resetCaseForm()
      selectedPanel.value = null
      cards.value = []
      await loadPanels()
      window.alert('Импорт завершён.')
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function transferCard(card: PortfolioCard, targetPanelId: string, mode: 'move' | 'copy') {
    if (!selectedPanel.value) {
      error.value = 'Сначала выберите панель'
      return
    }

    const targetPanel = panels.value.find((panel) => panel.id === targetPanelId)
    if (!targetPanel) {
      error.value = 'Целевая панель не найдена'
      return
    }

    const actionText = mode === 'copy' ? 'Скопировать' : 'Переместить'
    if (!window.confirm(`${actionText} карточку «${card.title}» в панель «${targetPanel.title}» вместе с кейсом?`)) {
      return
    }

    isLoadingCards.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/home-panels/${selectedPanel.value.id}/cards/${card.id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({
          targetPanelId,
          mode,
        }),
      })

      await loadCards(selectedPanel.value)
      resetCardForm()
      if (caseForm.cardId === card.id && mode === 'move') {
        resetCaseForm()
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
      setPanelFile(panelForm, target, uploaded.path, uploaded.publicUrl)
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
      setCardFile(cardForm, target, uploaded.path, uploaded.publicUrl)
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
  }

  async function deletePanelFile(target: PanelUploadTarget) {
    const bucket = target === 'mascot' ? 'portfolio' : 'home-panels'
    const path = getPanelFile(panelForm, target)

    if (typeof path === 'string' && path) {
      await deleteAdminFile(bucket, path)
    }

    setPanelFile(panelForm, target, null, null)
  }

  async function deleteCardFile(target: Exclude<PanelUploadTarget, 'mascot'>) {
    const path = getCardFile(cardForm, target)

    if (typeof path === 'string' && path) {
      await deleteAdminFile('portfolio', path)
    }

    setCardFile(cardForm, target, null, null)
  }

  async function uploadCaseHero(file: File) {
    uploadField.value = 'case-hero'
    error.value = ''

    try {
      const uploaded = await uploadAdminFile(file, 'portfolio')
      caseForm.caseHeroPath = uploaded.path
      caseForm.caseHeroUrl = uploaded.publicUrl
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
  }

  async function deleteCaseHero() {
    if (caseForm.caseHeroPath) {
      await deleteAdminFile('portfolio', caseForm.caseHeroPath)
    }

    caseForm.caseHeroPath = null
    caseForm.caseHeroUrl = null
  }

  async function uploadArticleImage(file: File, blockId: string, groupId: string) {
    uploadField.value = `article-${groupId}`
    error.value = ''

    try {
      const uploaded = await uploadAdminFile(file, 'portfolio')
      const block = caseForm.articleBlocks.find((item) => item.id === blockId)
      const group = block?.imageGroups?.find((item) => item.id === groupId)

      if (group) {
        group.images.push({
          id: createClientId(),
          path: uploaded.path,
          url: uploaded.publicUrl,
          alt: '',
        })
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      uploadField.value = ''
    }
  }

  async function deleteArticleImage(blockId: string, groupId: string, imageId: string) {
    const block = caseForm.articleBlocks.find((item) => item.id === blockId)
    const group = block?.imageGroups?.find((item) => item.id === groupId)
    const image = group?.images.find((item) => item.id === imageId)

    if (image?.path) {
      await deleteAdminFile('portfolio', image.path)
    }

    if (group) {
      group.images = group.images.filter((item) => item.id !== imageId)
    }
  }

  function addArticleBlock(layout: PortfolioArticleBlockLayout = 'single-wide') {
    caseForm.articleBlocks.push({
      id: createClientId(),
      title: '',
      titleEn: '',
      text: '',
      textEn: '',
      layout,
      images: [],
      imageGroups: [{
        id: createClientId(),
        layout,
        images: [],
      }],
    })
  }

  function addArticleImageGroup(blockId: string, layout: PortfolioArticleBlockLayout = 'single-wide') {
    const block = caseForm.articleBlocks.find((item) => item.id === blockId)

    if (!block) {
      return
    }

    if (!block.imageGroups) {
      block.imageGroups = []
    }

    block.imageGroups.push({
      id: createClientId(),
      layout,
      images: [],
      sortOrder: block.imageGroups.length,
    })
  }

  async function removeArticleImageGroup(blockId: string, groupId: string) {
    const block = caseForm.articleBlocks.find((item) => item.id === blockId)
    const group = block?.imageGroups?.find((item) => item.id === groupId)

    if (group) {
      await Promise.all(group.images.map((image) => (
        image.path ? deleteAdminFile('portfolio', image.path) : Promise.resolve()
      )))
    }

    if (block?.imageGroups) {
      block.imageGroups = block.imageGroups.filter((item) => item.id !== groupId)
      block.images = flattenArticleBlockImages(block)
    }
  }

  async function removeArticleBlock(blockId: string) {
    const block = caseForm.articleBlocks.find((item) => item.id === blockId)

    if (block) {
      await Promise.all(flattenArticleBlockImages(block).map((image) => (
        image.path ? deleteAdminFile('portfolio', image.path) : Promise.resolve()
      )))
    }

    caseForm.articleBlocks = caseForm.articleBlocks.filter((item) => item.id !== blockId)
  }

  function moveArticleBlock(blockId: string, direction: -1 | 1) {
    const currentIndex = caseForm.articleBlocks.findIndex((block) => block.id === blockId)
    const nextIndex = currentIndex + direction

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= caseForm.articleBlocks.length) {
      return
    }

    const nextBlocks = [...caseForm.articleBlocks]
    const [block] = nextBlocks.splice(currentIndex, 1)
    nextBlocks.splice(nextIndex, 0, block)
    caseForm.articleBlocks = nextBlocks
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
      articleBlocks: [],
    })
  }

  function editCase(card: PortfolioCard) {
    selectedCaseCard.value = card
    Object.assign(caseForm, {
      cardId: card.id,
      title: card.title,
      linkPath: card.linkPath || '/',
      caseHeroPath: card.caseHeroPath || null,
      caseHeroUrl: card.caseHeroUrl || null,
      articleBlocks: cloneArticleBlocks(card.articleBlocks || []),
    })
  }

  async function saveCase() {
    const caseCardId = caseForm.cardId

    if (!selectedPanel.value || !caseCardId) {
      error.value = 'Сначала выберите карточку для кейса'
      return
    }

    const card = cards.value.find((item) => item.id === caseCardId)
    if (!card) {
      error.value = 'Карточка для кейса не найдена'
      return
    }

    isSavingCard.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/home-panels/${selectedPanel.value.id}/cards/${caseCardId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...card,
          caseHeroPath: caseForm.caseHeroPath,
          caseHeroUrl: caseForm.caseHeroUrl,
          articleBlocks: caseForm.articleBlocks.map((block) => ({
            ...block,
            images: flattenArticleBlockImages(block),
          })),
        }),
      })

      await loadCards(selectedPanel.value)
      const updatedCard = cards.value.find((item) => item.id === caseCardId)
      if (updatedCard) {
        editCase(updatedCard)
      }
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isSavingCard.value = false
    }
  }

  function resetForm() {
    Object.assign(panelForm, emptyForm())
  }

  function resetCardForm() {
    Object.assign(cardForm, emptyCardForm())
  }

  function resetCaseForm() {
    selectedCaseCard.value = null
    Object.assign(caseForm, emptyCaseForm())
  }

  function clearPanels() {
    panels.value = []
    cards.value = []
    selectedPanel.value = null
    selectedCaseCard.value = null
    resetForm()
    resetCardForm()
    resetCaseForm()
  }

  return {
    panelForm,
    cardForm,
    caseForm,
    panels,
    cards,
    selectedPanel,
    selectedCaseCard,
    isLoading,
    isSaving,
    isSavingCard,
    isLoadingCards,
    uploadField,
    error,
    formTitle,
    cardFormTitle,
    caseFormTitle,
    loadPanels,
    loadCards,
    savePanel,
    saveCard,
    saveCase,
    deletePanel,
    deleteCard,
    exportPanelsArchive,
    importPanelsArchive,
    transferCard,
    uploadFile,
    uploadCardFile,
    uploadCaseHero,
    deletePanelFile,
    deleteCardFile,
    deleteCaseHero,
    uploadArticleImage,
    deleteArticleImage,
    addArticleBlock,
    addArticleImageGroup,
    removeArticleImageGroup,
    removeArticleBlock,
    moveArticleBlock,
    editPanel,
    editCard,
    editCase,
    resetForm,
    resetCardForm,
    resetCaseForm,
    clearPanels,
  }
}
