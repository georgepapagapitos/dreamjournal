import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Dream } from '../../types'
import { getMood } from '../ui/MoodPicker'
import './CalendarView.css'

interface CalendarViewProps {
  onSelectDream: (dream: Dream) => void
  onRecordDream: (date: string) => void
}

interface DayData {
  dreams: Dream[]
  maxLucidity: number
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MAX_LUCIDITY = 5
const PREVIEW_LENGTH = 80

export function CalendarView({ onSelectDream, onRecordDream }: CalendarViewProps) {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.dreams.list({ limit: 10000 })
        setDreams(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Build a map: "YYYY-MM-DD" -> { dreams: [...], maxLucidity: N }
  const dreamsByDate: Record<string, DayData> = {}
  dreams.forEach((dream) => {
    const dateKey = (dream.dream_date || dream.created_at).slice(0, 10)
    if (!dreamsByDate[dateKey]) {
      dreamsByDate[dateKey] = { dreams: [], maxLucidity: 0 }
    }
    dreamsByDate[dateKey].dreams.push(dream)
    if (dream.lucidity && dream.lucidity > dreamsByDate[dateKey].maxLucidity) {
      dreamsByDate[dateKey].maxLucidity = dream.lucidity
    }
  })

  // Generate calendar grid for current month
  const startOfMonth = currentMonth.startOf('month')
  const endOfMonth = currentMonth.endOf('month')
  const startDate = startOfMonth.startOf('week')
  const endDate = endOfMonth.endOf('week')

  const calendar: dayjs.Dayjs[] = []
  let day = startDate
  while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
    calendar.push(day)
    day = day.add(1, 'day')
  }

  // Chunk into weeks (7 days per week)
  const weeks: dayjs.Dayjs[][] = []
  for (let i = 0; i < calendar.length; i += 7) {
    weeks.push(calendar.slice(i, i + 7))
  }

  const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'))
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'))
  const handleToday = () => setCurrentMonth(dayjs())

  const handleDayClick = (day: dayjs.Dayjs) => {
    const key = day.format('YYYY-MM-DD')
    setSelectedDate(key)
    setIsClosing(false)
  }

  const handleClosePanel = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedDate(null)
      setIsClosing(false)
    }, 300)
  }

  const handleRecordForDate = () => {
    if (selectedDate) {
      handleClosePanel()
      onRecordDream(selectedDate)
    }
  }

  const selectedDreams = selectedDate ? dreamsByDate[selectedDate]?.dreams || [] : []

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Calendar</h1>
        </div>
        <div className="loading">
          <div className="spinner" />
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in calendar-view">
      <div className="page-header">
        <h1 className="page-title">
          Dream <em>Calendar</em>
        </h1>
        <p className="page-subtitle">
          {Object.keys(dreamsByDate).length} days recorded
        </p>
      </div>

      {/* Month navigation */}
      <nav className="calendar-nav">
        <button onClick={handlePrevMonth} className="calendar-nav__btn" aria-label="Previous month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="calendar-nav__current">
          <h2 className="calendar-nav__month">{currentMonth.format('MMMM YYYY')}</h2>
          <button onClick={handleToday} className="calendar-nav__today">
            Today
          </button>
        </div>
        <button onClick={handleNextMonth} className="calendar-nav__btn" aria-label="Next month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </nav>

      {/* Calendar grid */}
      <div className="calendar-grid">
        <div className="calendar-header">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="calendar-header__day">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-body">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day) => {
                const key = day.format('YYYY-MM-DD')
                const data = dreamsByDate[key]
                const isToday = day.isSame(dayjs(), 'day')
                const isCurrentMonth = day.month() === currentMonth.month()
                const isSelected = selectedDate === key
                const dreamCount = data?.dreams.length || 0

                const classNames = [
                  'calendar-day',
                  !isCurrentMonth && 'calendar-day--other-month',
                  isToday && 'calendar-day--today',
                  isSelected && 'calendar-day--selected',
                  data && 'calendar-day--has-dreams',
                ].filter(Boolean).join(' ')

                return (
                  <div
                    key={key}
                    className={classNames}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="calendar-day__number">{day.date()}</div>
                    {data && (
                      <div className="calendar-day__indicator">
                        {dreamCount > 1 ? (
                          <span className="calendar-day__count">{dreamCount}</span>
                        ) : (
                          <div
                            className="calendar-day__dot"
                            style={{
                              opacity: data.maxLucidity
                                ? 0.4 + (data.maxLucidity / MAX_LUCIDITY) * 0.6
                                : 0.6,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected day dreams panel */}
      {selectedDate && (
        <>
          <div className="calendar-backdrop" onClick={handleClosePanel} />
          <div className={`calendar-panel${isClosing ? ' calendar-panel--closing' : ''}`}>
            <div className="calendar-panel__header">
              <h3 className="calendar-panel__title">
                {dayjs(selectedDate).format('MMMM D, YYYY')}
              </h3>
              <div className="calendar-panel__actions">
                <button onClick={handleRecordForDate} className="calendar-panel__record">
                  + Record
                </button>
                <button onClick={handleClosePanel} className="calendar-panel__close">
                  ✕
                </button>
              </div>
            </div>
            {selectedDreams.length === 0 ? (
              <div className="calendar-panel__empty">No dreams recorded</div>
            ) : (
              <div className="calendar-panel__dreams">
                {selectedDreams.map((dream) => {
                  const mood = getMood(dream.mood)
                  const preview = dream.body.slice(0, PREVIEW_LENGTH)
                  const needsEllipsis = dream.body.length > PREVIEW_LENGTH

                  return (
                    <div
                      key={dream.id}
                      className="calendar-dream-card"
                      onClick={() => onSelectDream(dream)}
                    >
                      <div className="calendar-dream-card__title">
                        {dream.title || 'Untitled dream'}
                      </div>
                      <div className="calendar-dream-card__preview">
                        {preview}
                        {needsEllipsis && '...'}
                      </div>
                      <div className="calendar-dream-card__meta">
                        {mood && (
                          <span className="chip chip--mood">
                            {mood.emoji} {mood.label}
                          </span>
                        )}
                        {dream.lucidity && (
                          <span className="chip chip--lucid">
                            ◈ {dream.lucidity}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}