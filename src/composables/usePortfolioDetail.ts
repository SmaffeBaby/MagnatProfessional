import { onMounted, ref, watch, type Ref } from 'vue'
import type { HomePanel, PortfolioCard } from './useHomePanels'

export function usePortfolioDetail(panelSlug: Ref<string>) {
  const panel = ref<HomePanel | null>(null)
  const cards = ref<PortfolioCard[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function loadPortfolioDetail() {
    if (!panelSlug.value) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/portfolio/${encodeURIComponent(panelSlug.value)}`, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load portfolio detail: ${response.status}`)
      }

      const payload = await response.json()
      panel.value = payload.panel || null
      cards.value = Array.isArray(payload.cards) ? payload.cards : []
    } catch (requestError) {
      error.value = requestError as Error
      panel.value = null
      cards.value = []
    } finally {
      isLoading.value = false
    }
  }

  onMounted(loadPortfolioDetail)
  watch(panelSlug, loadPortfolioDetail)

  return {
    panel,
    cards,
    isLoading,
    error,
    loadPortfolioDetail,
  }
}
