import { computed, ref } from 'vue'
import { adminRequest } from '../useAdminApi'

export type ProjectRequestStatus = 'new' | 'in_progress' | 'closed'

export type ProjectRequest = {
  id: string
  name: string
  phone: string
  email: string
  message: string
  status: ProjectRequestStatus
  source: string
  createdAt: string
  updatedAt: string
}

export function useAdminProjectRequests() {
  const requests = ref<ProjectRequest[]>([])
  const statusFilter = ref<'all' | ProjectRequestStatus>('all')
  const searchQuery = ref('')
  const newCount = ref(0)
  const isLoading = ref(false)
  const error = ref('')

  const hasActiveFilters = computed(() => statusFilter.value !== 'all' || searchQuery.value.trim().length > 0)

  async function loadRequests() {
    isLoading.value = true
    error.value = ''

    try {
      const params = new URLSearchParams()

      if (statusFilter.value !== 'all') {
        params.set('status', statusFilter.value)
      }

      if (searchQuery.value.trim()) {
        params.set('search', searchQuery.value.trim())
      }

      const suffix = params.toString() ? `?${params.toString()}` : ''
      const payload = await adminRequest(`/api/admin/project-requests${suffix}`)
      requests.value = payload.requests
      newCount.value = payload.newCount
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function updateStatus(request: ProjectRequest, status: ProjectRequestStatus) {
    isLoading.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/project-requests/${request.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await loadRequests()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  async function deleteRequest(request: ProjectRequest) {
    if (!window.confirm('Удалить заявку?')) {
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      await adminRequest(`/api/admin/project-requests/${request.id}`, {
        method: 'DELETE',
      })
      await loadRequests()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  function resetFilters() {
    statusFilter.value = 'all'
    searchQuery.value = ''
  }

  function clearRequests() {
    requests.value = []
    newCount.value = 0
    statusFilter.value = 'all'
    searchQuery.value = ''
    error.value = ''
  }

  return {
    requests,
    statusFilter,
    searchQuery,
    newCount,
    isLoading,
    error,
    hasActiveFilters,
    loadRequests,
    updateStatus,
    deleteRequest,
    resetFilters,
    clearRequests,
  }
}
