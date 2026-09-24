import { reactive, ref } from 'vue'
import {
  adminRequest,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '../useAdminApi'

export function useAdminAuth() {
  const loginForm = reactive({
    email: '',
    password: '',
  })
  const isAuthorized = ref(Boolean(getAdminToken()))
  const isLoading = ref(false)
  const error = ref('')

  async function verifySession() {
    try {
      await adminRequest('/api/admin/auth/me')
      isAuthorized.value = true
      error.value = ''
      return true
    } catch (requestError) {
      clearAdminToken()
      isAuthorized.value = false
      error.value = (requestError as Error).message
      return false
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

      setAdminToken(payload.session.access_token)
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
    error,
    verifySession,
    login,
    logout,
  }
}
