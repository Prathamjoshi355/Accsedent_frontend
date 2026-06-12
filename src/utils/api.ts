import { loadState, saveState, clearState } from './storage';

const BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE ||
  'https://accsedent-backend.vercel.app'
).replace(/\/+$/, '');

function getAuthHeaders(): Record<string, string> {
  const token = loadState('token');

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const endpoint =
    path.startsWith('/api') || path.startsWith('/auth')
      ? path
      : `/api${path.startsWith('/') ? path : `/${path}`}`;

  const url = `${BASE_URL}${endpoint}`;

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  });

  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  if (config.body != null && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw {
        status: response.status,
        ...data
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Token helpers
export const saveToken = (token: string) => saveState('token', token);
export const clearToken = () => clearState('token');

// User helpers
export const saveUser = (user: unknown) => saveState('user', user);
export const loadUser = () => loadState('user');
export const clearUser = () => clearState('user');