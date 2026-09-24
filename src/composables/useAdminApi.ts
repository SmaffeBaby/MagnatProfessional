const ADMIN_TOKEN_KEY = 'magnat-admin-access-token'

export function getAdminToken() {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function adminRequest(path: string, options: RequestInit = {}) {
  const token = getAdminToken()
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function uploadAdminFile(file: File) {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', 'home-panels')

  return adminRequest('/api/admin/storage/upload', {
    method: 'POST',
    body,
  })
}
