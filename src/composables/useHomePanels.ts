import { onMounted, onUnmounted, ref } from 'vue'

export type HomePanelTileType = 'wide' | 'vertical'
export type PortfolioArticleImage = {
  id: string
  path: string | null
  url: string
  alt?: string
  sortOrder?: number
}

export type PortfolioArticleBlockLayout = 'single-wide' | 'two-medium' | 'three-vertical'

export type PortfolioArticleImageGroup = {
  id: string
  layout: PortfolioArticleBlockLayout
  images: PortfolioArticleImage[]
  sortOrder?: number
}

export type PortfolioArticleBlock = {
  id: string
  title: string
  titleEn?: string | null
  text: string
  textEn?: string | null
  layout: PortfolioArticleBlockLayout
  images: PortfolioArticleImage[]
  imageGroups?: PortfolioArticleImageGroup[]
  sortOrder?: number
}

export type HomePanel = {
  id: string
  title: string
  titleEn?: string | null
  slug?: string | null
  detailText?: string | null
  detailTextEn?: string | null
  mascotPath?: string | null
  mascotUrl?: string | null
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

export type PortfolioCard = HomePanel & {
  panelId: string
  caseHeroPath?: string | null
  caseHeroUrl?: string | null
  articleBlocks?: PortfolioArticleBlock[]
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
