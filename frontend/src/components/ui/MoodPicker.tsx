import './MoodPicker.css'

interface Mood {
  id: string
  label: string
  emoji: string
}

export const MOODS: Mood[] = [
  { id: 'peaceful', label: 'Peaceful', emoji: '🌙' },
  { id: 'joyful', label: 'Joyful', emoji: '✨' },
  { id: 'anxious', label: 'Anxious', emoji: '🌀' },
  { id: 'eerie', label: 'Eerie', emoji: '🌫️' },
  { id: 'vivid', label: 'Vivid', emoji: '🔮' },
  { id: 'neutral', label: 'Neutral', emoji: '🌑' },
]

interface MoodPickerProps {
  value: string | null
  onChange: (value: string | null) => void
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="mood-grid">
      {MOODS.map((mood) => (
        <button
          key={mood.id}
          type="button"
          className={`mood-btn${value === mood.id ? ' active' : ''}`}
          onClick={() => onChange(value === mood.id ? null : mood.id)}
        >
          <span className="mood-emoji">{mood.emoji}</span>
          {mood.label}
        </button>
      ))}
    </div>
  )
}

export function getMood(id: string | null): Mood | undefined {
  if (!id) return undefined
  return MOODS.find((m) => m.id === id)
}