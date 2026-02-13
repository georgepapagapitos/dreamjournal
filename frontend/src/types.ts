export interface Dream {
  id: number
  title: string | null
  body: string
  mood: string | null
  lucidity: number | null
  sleep_quality: number | null
  tags: string[]
  dream_date: string
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