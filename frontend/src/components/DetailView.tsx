import dayjs from 'dayjs'
import { useState } from 'react'
import { api } from '../api/client'
import type { Dream } from '../types'
import { getMood } from './MoodPicker'

const LUCIDITY_LABELS = ['Hazy', 'Dim', 'Clear', 'Vivid', 'Lucid']
const SLEEP_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Deep']

interface DetailViewProps {
  dream: Dream
  onBack: () => void
  onEdit: () => void
  onDeleted: () => void
  showToast: (message: string) => void
}

export function DetailView({ dream, onBack, onEdit, onDeleted, showToast }: DetailViewProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const mood = getMood(dream.mood)

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await api.dreams.delete(dream.id)
      showToast('Dream deleted')
      onDeleted()
    } catch (e) {
      console.error(e)
      setDeleting(false)
    }
  }

  return (
    <div className="detail-view fade-in">
      <button className="detail-view__back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to journal
      </button>

      <div className="detail-view__date">
        {dayjs(dream.dream_date || dream.created_at).format('dddd, MMMM D, YYYY')}
        {dream.updated_at !== dream.created_at && (
          <> · Edited {dayjs(dream.updated_at).fromNow()}</>
        )}
      </div>

      <h1 className="detail-view__title">
        {dream.title || <em style={{ opacity: 0.45, fontStyle: 'italic' }}>Untitled dream</em>}
      </h1>

      <div className="detail-view__meta">
        {mood && (
          <span className="chip chip--mood">{mood.emoji} {mood.label}</span>
        )}
        {dream.lucidity && (
          <span className="chip chip--lucid">
            ◈ {LUCIDITY_LABELS[dream.lucidity - 1]} (lucidity {dream.lucidity})
          </span>
        )}
        {dream.sleep_quality && (
          <span className="chip chip--mood" style={{ opacity: 0.8 }}>
            🌙 Sleep: {SLEEP_LABELS[dream.sleep_quality - 1]}
          </span>
        )}
        {dream.tags?.map((tag) => (
          <span key={tag} className="chip chip--tag">#{tag}</span>
        ))}
      </div>

      <div className="detail-view__body">{dream.body}</div>

      <div className="detail-view__actions">
        <button className="btn btn--ghost" style={{ flex: 1 }} onClick={onEdit}>
          Edit
        </button>
        <button
          className="btn btn--danger"
          style={{ flex: 1 }}
          onClick={handleDelete}
          disabled={deleting}
        >
          {confirmDelete ? 'Confirm delete?' : deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
      {confirmDelete && !deleting && (
        <button
          className="btn btn--ghost"
          style={{ marginTop: 8, width: '100%', fontSize: 13 }}
          onClick={() => setConfirmDelete(false)}
        >
          Cancel
        </button>
      )}
    </div>
  )
}