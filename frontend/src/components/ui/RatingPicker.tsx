import './RatingPicker.css'

interface RatingPickerProps {
  value: number | null
  onChange: (value: number | null) => void
  labels?: string[]
}

export function RatingPicker({ value, onChange, labels }: RatingPickerProps) {
  return (
    <div className="rating-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`rating-btn${value === n ? ' active' : ''}`}
          onClick={() => onChange(value === n ? null : n)}
          title={labels?.[n - 1]}
        >
          {labels ? labels[n - 1] : n}
        </button>
      ))}
    </div>
  )
}