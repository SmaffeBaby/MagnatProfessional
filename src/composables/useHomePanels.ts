import { computed, watch } from 'vue'
import { useApiQuery } from './useApiQuery'
import { collectPanelPreviewMediaUrls, warmMediaUrls } from './useMediaPreload'

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

export function useHomePanels() {
  const query = useApiQuery<{ panels: HomePanel[] }>(['home-panels'], '/api/home-panels')
  const panels = computed(() => Array.isArray(query.data.value?.panels) ? query.data.value.panels : [])

  watch(panels, (items) => {
    warmMediaUrls(items.flatMap(collectPanelPreviewMediaUrls))
  })

  return {
    panels,
    isLoading: query.isLoading,
    error: query.error,
    loadHomePanels: query.refetch,
  }
}
