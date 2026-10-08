import { computed, watch, type Ref } from 'vue'
import type { HomePanel, PortfolioCard } from './useHomePanels'
import { useApiQuery, prefetchApiQuery } from './useApiQuery'
import { collectPanelMediaUrls, collectPortfolioCardMediaUrls, warmMediaUrls } from './useMediaPreload'

export type PortfolioCasePayload = {
  panel: HomePanel | null
  card: PortfolioCard | null
  previousCard: PortfolioCard | null
  nextCard: PortfolioCard | null
  relatedCards: PortfolioCard[]
}

export function usePortfolioCase(panelSlug: Ref<string>, cardSlug: Ref<string>) {
  const query = useApiQuery<PortfolioCasePayload>(
    computed(() => ['portfolio-case', panelSlug.value, cardSlug.value]),
    computed(() => `/api/portfolio/${encodeURIComponent(panelSlug.value)}/${encodeURIComponent(cardSlug.value)}`),
    { enabled: computed(() => Boolean(panelSlug.value && cardSlug.value)) },
  )
  const panel = computed(() => query.data.value?.panel || null)
  const card = computed(() => query.data.value?.card || null)
  const previousCard = computed(() => query.data.value?.previousCard || null)
  const nextCard = computed(() => query.data.value?.nextCard || null)
  const relatedCards = computed(() => Array.isArray(query.data.value?.relatedCards) ? query.data.value.relatedCards : [])

  watch([panel, card, previousCard, nextCard, relatedCards], ([currentPanel, currentCard, currentPreviousCard, currentNextCard, currentRelatedCards]) => {
    if (!currentCard) {
      return
    }

    warmMediaUrls([
      ...collectPanelMediaUrls(currentPanel),
      ...collectPortfolioCardMediaUrls(currentCard),
      ...collectPortfolioCardMediaUrls(currentPreviousCard),
      ...collectPortfolioCardMediaUrls(currentNextCard),
      ...currentRelatedCards.flatMap(collectPortfolioCardMediaUrls),
    ])

    for (const relatedCard of currentRelatedCards.slice(0, 4)) {
      if (!relatedCard?.slug) {
        continue
      }

      prefetchApiQuery<PortfolioCasePayload>(
        ['portfolio-case', panelSlug.value, relatedCard.slug],
        `/api/portfolio/${encodeURIComponent(panelSlug.value)}/${encodeURIComponent(relatedCard.slug)}`,
      )
    }
  }, { immediate: true })

  return {
    panel,
    card,
    previousCard,
    nextCard,
    relatedCards,
    isLoading: query.isLoading,
    error: query.error,
    loadPortfolioCase: query.refetch,
  }
}
