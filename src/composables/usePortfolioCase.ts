import { onMounted, ref, watch, type Ref } from 'vue'
import type { HomePanel, PortfolioCard } from './useHomePanels'

export function usePortfolioCase(panelSlug: Ref<string>, cardSlug: Ref<string>) {
  const panel = ref<HomePanel | null>(null)
  const card = ref<PortfolioCard | null>(null)
  const previousCard = ref<PortfolioCard | null>(null)
  const nextCard = ref<PortfolioCard | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function loadPortfolioCase() {
    if (!panelSlug.value || !cardSlug.value) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/portfolio/${encodeURIComponent(panelSlug.value)}/${encodeURIComponent(cardSlug.value)}`, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load portfolio case: ${response.status}`)
      }

      const payload = await response.json()
      panel.value = payload.panel || null
      card.value = payload.card || null
      previousCard.value = payload.previousCard || null
      nextCard.value = payload.nextCard || null
    } catch (requestError) {
      error.value = requestError as Error
      panel.value = null
      card.value = null
      previousCard.value = null
      nextCard.value = null
    } finally {
      isLoading.value = false
    }
  }

  onMounted(loadPortfolioCase)
  watch([panelSlug, cardSlug], loadPortfolioCase)

  return {
    panel,
    card,
    previousCard,
    nextCard,
    isLoading,
    error,
    loadPortfolioCase,
  }
}
