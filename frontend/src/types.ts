export interface Dream {
  id: number
  user_id: number
  title: string | null
  body: string
  mood: string | null
  lucidity: number | null
  sleep_quality: number | null
  tags: string[]
  dream_date: string
  is_public: number
  share_token: string | null
  created_at: string
  updated_at: string
}

export interface DreamCreate {
  title?: string | null
  body: string
  mood?: string | null
  lucidity?: number | null
  sleep_quality?: number | null
  tags?: string[]
  dream_date?: string
}

export interface Stats {
  total: number
  moods: Record<string, number>
  avg_lucidity: number | null
}

export interface User {
  id: number
  email: string
  username: string
  created_at?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}