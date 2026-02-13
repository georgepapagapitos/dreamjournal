import { useState, FormEvent } from 'react'
import { api } from '../api/client'
import { TagInput } from './TagInput'
import { RatingPicker } from './RatingPicker'
import { MoodPicker } from './MoodPicker'
import dayjs from 'dayjs'
import type { Dream } from '../types'

const LUCIDITY_LABELS = ['Hazy', 'Dim', 'Clear', 'Vivid', 'Lucid']
const SLEEP_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Deep']

interface CaptureViewProps {
  onSaved: () => void
  editDream?: Dream | null
}

export function CaptureView({ onSaved, editDream }: CaptureViewProps) {
  const isEdit = !!editDream

  const [form, setForm] = useState({
    title: editDream?.title ?? '',
    body: editDream?.body ?? '',
    mood: editDream?.mood ?? null,
    lucidity: editDream?.lucidity ?? null,
    sleep_quality: editDream?.sleep_quality ?? null,
    tags: editDream?.tags ?? [],
    dream_date: editDream?.dream_date ?? dayjs().format('YYYY-MM-DD'),
  })

  const [showMeta, setShowMeta] = useState(isEdit || false)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(key: K) => (val: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.body.trim()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        title: form.title?.trim() || null,
      }
      if (isEdit && editDream) {
        await api.dreams.update(editDream.id, payload)
      } else {
        await api.dreams.create(payload)
      }
      onSaved()
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          {isEdit ? 'Edit dream' : <>Capture a <em>dream</em></>}
        </h1>
        <p className="page-subtitle">
          {isEdit ? 'Update your entry' : 'Write while it\'s still fresh'}
        </p>
      </div>

      <form className="capture-form" onSubmit={handleSubmit}>
        {/* Title */}
        <div className="field">
          <input
            className="title-input"
            type="text"
            placeholder="Give it a title…"
            value={form.title ?? ''}
            onChange={(e) => set('title')(e.target.value)}
            maxLength={120}
          />
        </div>

        {/* Body */}
        <div className="field">
          <textarea
            placeholder="What happened in your dream…"
            value={form.body}
            onChange={(e) => set('body')(e.target.value)}
            autoFocus={!isEdit}
          />
        </div>

        {/* Dream date */}
        <div className="field">
          <label>Dream date</label>
          <input
            type="date"
            value={form.dream_date}
            onChange={(e) => set('dream_date')(e.target.value)}
          />
        </div>

        {/* Metadata toggle */}
        <button
          type="button"
          className="meta-toggle"
          onClick={() => setShowMeta((v) => !v)}
        >
          <span>{showMeta ? '▲' : '▼'} &nbsp;Mood, clarity & tags</span>
          <span style={{ fontSize: '12px', opacity: 0.5 }}>
            {[form.mood, form.lucidity, form.sleep_quality, form.tags.length ? 'tags' : null]
              .filter(Boolean).length > 0 ? '●' : ''}
          </span>
        </button>

        {showMeta && (
          <div className="meta-section">
            {/* Mood */}
            <div className="field">
              <label>Mood</label>
              <MoodPicker value={form.mood} onChange={set('mood')} />
            </div>

            {/* Lucidity */}
            <div className="field">
              <label>Lucidity</label>
              <RatingPicker value={form.lucidity} onChange={set('lucidity')} labels={LUCIDITY_LABELS} />
            </div>

            {/* Sleep quality */}
            <div className="field">
              <label>Sleep quality</label>
              <RatingPicker value={form.sleep_quality} onChange={set('sleep_quality')} labels={SLEEP_LABELS} />
            </div>

            {/* Tags */}
            <div className="field">
              <label>Tags</label>
              <TagInput tags={form.tags} onChange={set('tags')} />
            </div>
          </div>
        )}

        <button
          className="btn btn--primary"
          type="submit"
          disabled={!form.body.trim() || saving}
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Record dream'}
        </button>
      </form>
    </div>
  )
}