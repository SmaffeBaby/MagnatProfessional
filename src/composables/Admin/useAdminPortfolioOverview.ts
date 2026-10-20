import { onUnmounted, ref } from 'vue'
import { adminRequest } from '../useAdminApi'

export type PortfolioOverviewCategory = {
  id: string
  title: string
  cases: { id: string; title: string; titleEn?: string }[]
}
export type PortfolioOverviewCase = PortfolioOverviewCategory['cases'][number] & { categoryId: string; categoryTitle: string }

export function filterPortfolioCases(cases: PortfolioOverviewCase[], query: string) {
  const search = query.trim().toLocaleLowerCase()
  return cases.filter(item => [item.title, item.titleEn, item.categoryTitle].some(value => value?.toLocaleLowerCase().includes(search)))
}

export function useAdminPortfolioOverview() {
  const categories = ref<PortfolioOverviewCategory[]>([])
  const isLoading = ref(true)
  const error = ref('')
  let requestId = 0
  onUnmounted(() => { requestId++ })
  async function load() {
    const currentRequest = ++requestId
    isLoading.value = true
    error.value = ''
    try {
      const payload = await adminRequest('/api/admin/portfolio-overview')
      if (currentRequest === requestId) categories.value = payload.categories
    } catch (requestError) {
      if (currentRequest === requestId) error.value = (requestError as Error).message
    } finally {
      if (currentRequest === requestId) isLoading.value = false
    }
  }
  return { categories, isLoading, error, load }
}
