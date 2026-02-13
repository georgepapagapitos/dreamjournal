import type { Dream, DreamCreate, Stats } from '../types'

const BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
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