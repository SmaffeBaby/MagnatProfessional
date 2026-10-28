import { computed, watch, type Ref } from 'vue'
import type { HomePanel, PortfolioCard } from './useHomePanels'
import { useApiQuery } from './useApiQuery'
import { collectPanelMediaUrls, collectPanelPreviewMediaUrls, warmMediaUrls } from './useMediaPreload'

export type PortfolioDetailPayload = {
  panel: HomePanel | null
  cards: PortfolioCard[]
}

export function usePortfolioDetail(panelSlug: Ref<string>) {
  const query = useApiQuery<PortfolioDetailPayload>(
    computed(() => ['portfolio-detail', panelSlug.value]),
    computed(() => `/api/portfolio/${encodeURIComponent(panelSlug.value)}`),
    { enabled: computed(() => Boolean(panelSlug.value)) },
  )
  const panel = computed(() => query.data.value?.panel || null)
  const cards = computed(() => Array.isArray(query.data.value?.cards) ? query.data.value.cards : [])

  watch([panel, cards], ([currentPanel, currentCards]) => {
    warmMediaUrls([
      ...collectPanelMediaUrls(currentPanel),
      ...currentCards.flatMap(collectPanelPreviewMediaUrls),
    ])
  }, { immediate: true })

  return {
    panel,
    cards,
    isLoading: query.isLoading,
    error: query.error,
    loadPortfolioDetail: query.refetch,
  }
}
