import { computed, watch, type Ref } from 'vue'
import type { HomePanel, PortfolioCard } from './useHomePanels'
import { useApiQuery, prefetchApiQuery } from './useApiQuery'
import { collectPanelMediaUrls, collectPortfolioCardMediaUrls, warmMediaUrls } from './useMediaPreload'

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
      ...currentCards.flatMap(collectPortfolioCardMediaUrls),
    ])

    for (const card of currentCards.slice(0, 4)) {
      if (!card.slug) {
        continue
      }

      prefetchApiQuery(
        ['portfolio-case', panelSlug.value, card.slug],
        `/api/portfolio/${encodeURIComponent(panelSlug.value)}/${encodeURIComponent(card.slug)}`,
      )
    }
  })

  return {
    panel,
    cards,
    isLoading: query.isLoading,
    error: query.error,
    loadPortfolioDetail: query.refetch,
  }
}
