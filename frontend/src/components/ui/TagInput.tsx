import { KeyboardEvent, useState } from 'react'
import './TagInput.css'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = (val: string) => {
    const trimmed = val.trim().toLowerCase().replace(/\s+/g, '-')
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="tags-wrap" onClick={() => document.getElementById('tag-input')?.focus()}>
      {tags.map((tag) => (
        <span key={tag} className="tag-pill">
          {tag}
          <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag) }}>×</button>
        </span>
      ))}
      <input
        id="tag-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={tags.length === 0 ? 'flying, ocean, chase…' : ''}
      />
    </div>
  )
}