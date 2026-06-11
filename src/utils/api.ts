import { loadState, saveState, clearState } from './storage'

const BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function getAuthHeaders() {
  const token = loadState('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch(path, options = {}) {
  let endpoint = path
  if (typeof endpoint === 'string' && endpoint.startsWith('/')) {
    if (!endpoint.startsWith('/api') && !endpoint.startsWith('/auth')) {
      endpoint = `/api${endpoint}`
    }
  }
  const url = `${BASE_URL}${endpoint}`
  const init = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {})
    },
    ...options
  }
  if (options.body && typeof options.body !== 'string') {
    init.body = JSON.stringify(options.body)
  }
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw data
  return data
}

export function saveToken(token) {
  saveState('token', token)
}

export function clearToken() {
  clearState('token')
}

export function saveUser(user) {
  saveState('user', user)
}

export function loadUser() {
  return loadState('user')
}

export function clearUser() {
  clearState('user')
}
