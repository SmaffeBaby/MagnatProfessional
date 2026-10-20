const ADMIN_TOKEN_KEY = 'magnat-admin-access-token'
const ADMIN_SESSION_KEY = 'magnat-admin-session'
const SESSION_EVENT = 'magnat-admin-session-change'
type AdminSession = { access_token: string; refresh_token?: string; expires_at?: number }
export class AdminApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}
export function getAdminToken() { return window.localStorage.getItem(ADMIN_TOKEN_KEY) }
function getSession(): AdminSession | null {
  try { return JSON.parse(window.localStorage.getItem(ADMIN_SESSION_KEY) || 'null') } catch { return null }
}
export function setAdminSession(session: AdminSession) {
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at }))
  window.localStorage.setItem(ADMIN_TOKEN_KEY, session.access_token)
  window.dispatchEvent(new Event(SESSION_EVENT))
}
export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
  window.localStorage.removeItem(ADMIN_TOKEN_KEY)
  window.dispatchEvent(new Event(SESSION_EVENT))
}
let refreshing: Promise<void> | null = null
async function refreshSession(failedToken: string | null) {
  if (refreshing) return refreshing
  const refresh = async () => {
    // Another tab may have refreshed while this tab was waiting for the lock.
    if (getAdminToken() !== failedToken) return
    const session = getSession()
    if (!session?.refresh_token) return
    const response = await fetch('/api/admin/auth/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
    if (!response.ok) {
      if (response.status === 401 && getAdminToken() === failedToken) clearAdminToken()
      throw new AdminApiError(response.status === 401 ? 'Сессия завершена. Войдите снова.' : 'Не удалось обновить сессию. Повторите попытку.', response.status)
    }
    const payload = await response.json()
    // Do not restore a session after logout or overwrite a different login.
    if (getAdminToken() === failedToken) setAdminSession(payload.session)
  }
  refreshing = (typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('magnat-admin-session-refresh', refresh)
    : refresh()).finally(() => { refreshing = null })
  return refreshing
}
export async function adminRequest(path: string, options: RequestInit = {}) {
  const authenticated = !['/api/admin/auth/login', '/api/admin/auth/refresh'].includes(path)
  let token = getAdminToken()
  const session = getSession()
  if (authenticated && session?.refresh_token && session.expires_at && session.expires_at * 1000 <= Date.now() + 60_000) {
    await refreshSession(token)
    token = getAdminToken()
  }
  const send = (accessToken: string | null) => {
    const headers = new Headers(options.headers)
    if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    if (authenticated && accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    return fetch(path, { ...options, headers })
  }
  let response = await send(token)
  if (authenticated && response.status === 401 && getSession()?.refresh_token) {
    await refreshSession(token)
    token = getAdminToken()
    if (token) response = await send(token)
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    if (authenticated && response.status === 401 && getAdminToken() === token) clearAdminToken()
    throw new AdminApiError(payload.error || `Request failed with status ${response.status}`, response.status)
  }
  if (response.status === 204) return null
  return response.json()
}
export async function uploadAdminFile(file: File, bucket = 'home-panels') {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', bucket)
  return adminRequest('/api/admin/storage/upload', { method: 'POST', body })
}
export async function deleteAdminFile(bucket: string, path: string) {
  return adminRequest('/api/admin/storage/file', { method: 'DELETE', body: JSON.stringify({ bucket, path }) })
}
