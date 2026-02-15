import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Dream, Stats } from '../../types'
import { getMood } from '../ui/MoodPicker'
import './JournalView.css'

dayjs.extend(relativeTime)

interface JournalViewProps {
  onSelectDream: (dream: Dream) => void
}

export function JournalView({ onSelectDream }: JournalViewProps) {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [search, setSearch] = useState('')
  const [moodFilter, setMoodFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, s] = await Promise.all([
        api.dreams.list({ search: search || null, mood: moodFilter }),
        api.stats.get(),
      ])
      setDreams(d)
      setStats(s)
    } finally {
      setLoading(false)
    }
  }, [search, moodFilter])

  useEffect(() => { load() }, [load])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const MOODS = [
    { id: 'peaceful', emoji: '🌙' },
    { id: 'joyful', emoji: '✨' },
    { id: 'anxious', emoji: '🌀' },
    { id: 'eerie', emoji: '🌫️' },
    { id: 'vivid', emoji: '🔮' },
    { id: 'neutral', emoji: '🌑' },
  ]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">
              Your <em>dreams</em>
            </h1>
            {stats && (
              <p className="page-subtitle">
                {stats.total} {stats.total === 1 ? 'entry' : 'entries'} recorded
                {stats.avg_lucidity ? ` · avg lucidity ${stats.avg_lucidity}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {stats && stats.total > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__value">{stats.total}</div>
            <div className="stat-card__label">Dreams</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">
              {stats.avg_lucidity ?? '—'}
            </div>
            <div className="stat-card__label">Avg Lucidity</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <span className="search-bar__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search your dreams…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Mood filter */}
      <div className="filter-row">
        <button
          className={`filter-chip${!moodFilter ? ' active' : ''}`}
          onClick={() => setMoodFilter(null)}
        >
          All
        </button>
        {MOODS.map((m) => (
          <button
            key={m.id}
            className={`filter-chip${moodFilter === m.id ? ' active' : ''}`}
            onClick={() => setMoodFilter(moodFilter === m.id ? null : m.id)}
          >
            {m.emoji} {m.id.charAt(0).toUpperCase() + m.id.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" /> Loading…
        </div>
      ) : dreams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🌙</div>
          <div className="empty-state__title">
            {search || moodFilter ? 'No dreams found' : 'No dreams yet'}
          </div>
          <div className="empty-state__body">
            {search || moodFilter
              ? 'Try a different search or filter'
              : 'Tap the moon below to record your first dream'}
          </div>
        </div>
      ) : (
        <div>
          {dreams.map((dream) => {
            const mood = getMood(dream.mood)
            return (
              <div key={dream.id} className="dream-card" onClick={() => onSelectDream(dream)}>
                <div className="dream-card__date">
                  <span>{dayjs(dream.dream_date || dream.created_at).format('MMM D, YYYY')}</span>
                  <span>{dayjs(dream.created_at).fromNow()}</span>
                </div>
                <div className={`dream-card__title${!dream.title ? ' dream-card__title--untitled' : ''}`}>
                  {dream.title || 'Untitled dream'}
                </div>
                <div className="dream-card__body">{dream.body}</div>
                <div className="dream-card__meta">
                  {mood && (
                    <span className="chip chip--mood">
                      {mood.emoji} {mood.label}
                    </span>
                  )}
                  {dream.lucidity && (
                    <span className="chip chip--lucid">
                      ◈ Lucidity {dream.lucidity}
                    </span>
                  )}
                  {dream.tags?.map((tag) => (
                    <span key={tag} className="chip chip--tag">#{tag}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}