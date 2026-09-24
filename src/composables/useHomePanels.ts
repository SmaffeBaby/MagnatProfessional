import { onMounted, onUnmounted, ref } from 'vue'

export type HomePanelTileType = 'wide' | 'vertical'

export type HomePanel = {
  id: string
  title: string
  titleEn?: string | null
  sortOrder: number
  gradientFromColor: string
  gradientFromOpacity: number
  gradientToColor: string
  gradientToOpacity: number
  gradientToPosition: number
  imagePath?: string | null
  imageUrl?: string | null
  videoPath?: string | null
  videoUrl?: string | null
  posterPath?: string | null
  posterUrl?: string | null
  linkPath: string
  tileType: HomePanelTileType
}

const HOME_PANELS_REFRESH_MS = 10000

export function useHomePanels() {
  const panels = ref<HomePanel[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  let refreshTimer: number | null = null

  async function loadHomePanels({ silent = false } = {}) {
    if (!silent) {
      isLoading.value = true
    }

    error.value = null

    try {
      const response = await fetch('/api/home-panels', {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load home panels: ${response.status}`)
      }

      const payload = await response.json()
      panels.value = Array.isArray(payload.panels) ? payload.panels : []
    } catch (requestError) {
      error.value = requestError as Error
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    loadHomePanels()
    refreshTimer = window.setInterval(() => loadHomePanels({ silent: true }), HOME_PANELS_REFRESH_MS)
  })

  onUnmounted(() => {
    if (refreshTimer) {
      window.clearInterval(refreshTimer)
    }
  })

  return {
    panels,
    isLoading,
    error,
    loadHomePanels,
  }
}
