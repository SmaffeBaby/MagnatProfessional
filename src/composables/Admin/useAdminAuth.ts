import { onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  adminRequest,
  clearAdminToken,
  getAdminToken,
  setAdminSession,
  AdminApiError,
} from '../useAdminApi'

export function useAdminAuth() {
  const loginForm = reactive({
    email: '',
    password: '',
  })
  const isAuthorized = ref(Boolean(getAdminToken()))
  const isLoading = ref(false)
  const isChecking = ref(Boolean(getAdminToken()))
  const error = ref('')

  function syncSession() { isAuthorized.value = Boolean(getAdminToken()) }
  onMounted(() => {
    window.addEventListener('magnat-admin-session-change', syncSession)
    window.addEventListener('storage', syncSession)
  })
  onUnmounted(() => {
    window.removeEventListener('magnat-admin-session-change', syncSession)
    window.removeEventListener('storage', syncSession)
  })

  async function verifySession() {
    try {
      await adminRequest('/api/admin/auth/me')
      isAuthorized.value = true
      error.value = ''
      return true
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        clearAdminToken()
        isAuthorized.value = false
      }
      error.value = (requestError as Error).message
      return false
    } finally {
      isChecking.value = false
    }
  }

  async function login(onSuccess?: () => Promise<void> | void) {
    isLoading.value = true
    error.value = ''

    try {
      const payload = await adminRequest('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })

      setAdminSession(payload.session)
      isAuthorized.value = true
      loginForm.password = ''
      await onSuccess?.()
    } catch (requestError) {
      error.value = (requestError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    clearAdminToken()
    isAuthorized.value = false
    loginForm.password = ''
  }

  return {
    loginForm,
    isAuthorized,
    isLoading,
    isChecking,
    error,
    verifySession,
    login,
    logout,
  }
}
