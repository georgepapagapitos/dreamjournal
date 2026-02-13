import type { Dream, DreamCreate, Stats, AuthResponse, User } from '../types'

const BASE = '/api'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers 
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    if (res.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null as T
  return res.json()
}

interface ListParams {
  search?: string | null
  mood?: string | null
  tag?: string | null
  limit?: number
  offset?: number
}

export const api = {
  auth: {
    register: (email: string, username: string, password: string) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { email, username, password } as any,
      }),
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password } as any,
      }),
    me: () => request<User>('/auth/me'),
  },
  dreams: {
    list: (params: ListParams = {}) => {
      const q = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v != null && v !== '')
        ) as Record<string, string>
      )
      return request<Dream[]>(`/dreams${q.toString() ? '?' + q : ''}`)
    },
    get: (id: number) => request<Dream>(`/dreams/${id}`),
    create: (data: DreamCreate) => request<Dream>('/dreams', { method: 'POST', body: data as any }),
    update: (id: number, data: Partial<DreamCreate>) =>
      request<Dream>(`/dreams/${id}`, { method: 'PUT', body: data as any }),
    delete: (id: number) => request<void>(`/dreams/${id}`, { method: 'DELETE' }),
  },
  tags: {
    list: () => request<string[]>('/tags'),
  },
  stats: {
    get: () => request<Stats>('/stats'),
  },
}