import { computed, reactive, ref } from 'vue'
import { adminRequest, uploadAdminFile } from '../useAdminApi'
import type { HomePanel, HomePanelTileType } from '../useHomePanels'

export type PanelForm = {
  id: string | null
  title: string
  titleEn: string
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

export type PanelUploadTarget = 'image' | 'video' | 'poster'

function emptyForm(): PanelForm {
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
    tileType: 'wide',
  }
}

export function useAdminHomePanels() {
  const panelForm = reactive<PanelForm>(emptyForm())
  const panels = ref<HomePanel[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const uploadField = ref('')
  const error = ref('')

  const formTitle = computed(() => panelForm.id ? 'Редактирование панели' : 'Новая панель')

  async function loadPanels() {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/home-panels')
      panels.value = payload.panels
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
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function uploadFile(file: File, target: PanelUploadTarget) {
    uploadField.value = target
    error.value = ''

    try {
      const uploaded = await uploadAdminFile(file)
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

  function editPanel(panel: HomePanel) {
    Object.assign(panelForm, {
      id: panel.id,
      title: panel.title,
      titleEn: panel.titleEn || '',
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

  function resetForm() {
    Object.assign(panelForm, emptyForm())
  }

  function clearPanels() {
    panels.value = []
    resetForm()
  }

  return {
    panelForm,
    panels,
    isLoading,
    isSaving,
    uploadField,
    error,
    formTitle,
    loadPanels,
    savePanel,
    deletePanel,
    uploadFile,
    editPanel,
    resetForm,
    clearPanels,
  }
}
