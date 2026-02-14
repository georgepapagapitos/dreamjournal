import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Dream } from '../../types'

dayjs.extend(isoWeek)
dayjs.extend(weekOfYear)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface CalendarViewProps {
  onSelectDream: (dream: Dream) => void
}

interface DayData {
  dreams: Dream[]
  maxLucidity: number
}

export function CalendarView({ onSelectDream }: CalendarViewProps) {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

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
  dreams.forEach((d) => {
    const dateKey = (d.dream_date || d.created_at).slice(0, 10)
    if (!dreamsByDate[dateKey]) {
      dreamsByDate[dateKey] = { dreams: [], maxLucidity: 0 }
    }
    dreamsByDate[dateKey].dreams.push(d)
    if (d.lucidity && d.lucidity > dreamsByDate[dateKey].maxLucidity) {
      dreamsByDate[dateKey].maxLucidity = d.lucidity
    }
  })

  // Generate a full year grid (GitHub-style: weeks as columns, days as rows)
  const startOfYear = dayjs(`${year}-01-01`)
  const endOfYear = dayjs(`${year}-12-31`)

  // Start from the first Sunday on or before Jan 1
  let currentDay = startOfYear.startOf('week')
  const weeks: Dayjs[][] = []

  while (currentDay.isBefore(endOfYear) || currentDay.isSame(endOfYear, 'day')) {
    const week: Dayjs[] = []
    for (let i = 0; i < 7; i++) {
      week.push(currentDay)
      currentDay = currentDay.add(1, 'day')
    }
    weeks.push(week)
  }

  // Calculate month label positions (which week column each month starts)
  const monthPositions: { month: number; weekIndex: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, idx) => {
    const monthOfFirstDay = week[0].month()
    if (monthOfFirstDay !== lastMonth && week[0].year() === year) {
      monthPositions.push({ month: monthOfFirstDay, weekIndex: idx })
      lastMonth = monthOfFirstDay
    }
  })

  const getCellIntensity = (day: Dayjs): number => {
    if (!day.isSame(dayjs(), 'year') && day.year() !== year) return 0
    const key = day.format('YYYY-MM-DD')
    const data = dreamsByDate[key]
    if (!data) return 0

    // Base intensity: recorded = 1
    // Lucidity boost: +0.15 per lucidity point (max +0.75 for lucidity 5)
    const boost = data.maxLucidity ? data.maxLucidity * 0.15 : 0
    return Math.min(1 + boost, 1.75) // cap at 1.75
  }

  const handleDayClick = (day: Dayjs) => {
    const key = day.format('YYYY-MM-DD')
    const data = dreamsByDate[key]
    if (data && data.dreams.length >= 1) {
      onSelectDream(data.dreams[0])
    }
  }

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Calendar</h1>
        </div>
        <div className="loading">
          <div className="spinner" /> Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          Dream <em>Calendar</em>
        </h1>
        <p className="page-subtitle">
          {Object.keys(dreamsByDate).length} days recorded in {year}
        </p>
      </div>

      {/* Year selector */}
      <div className="year-selector">
        <button onClick={() => setYear((y) => y - 1)}>‹</button>
        <span>{year}</span>
        <button onClick={() => setYear((y) => y + 1)}>›</button>
      </div>

      {/* Heatmap */}
      <div className="heatmap-container">
        {/* Month labels */}
        <div className="heatmap-months">
          {monthPositions.map(({ month, weekIndex }) => (
            <div
              key={month}
              className="month-label"
              style={{ left: `${weekIndex * 14 + 40}px` }}
            >
              {MONTHS[month]}
            </div>
          ))}
        </div>

        {/* Day labels */}
        <div className="heatmap-days">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Grid */}
        <div className="heatmap-grid">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="heatmap-week">
              {week.map((day, dIdx) => {
                const intensity = getCellIntensity(day)
                const isToday = day.isSame(dayjs(), 'day')
                const isOutOfYear = day.year() !== year
                const key = day.format('YYYY-MM-DD')
                const data = dreamsByDate[key]

                return (
                  <div
                    key={dIdx}
                    className={`heatmap-cell${isToday ? ' is-today' : ''}${isOutOfYear ? ' out-of-year' : ''
                      }${data ? ' has-dream' : ''}`}
                    style={{
                      '--intensity': intensity,
                    } as React.CSSProperties}
                    onClick={() => data && handleDayClick(day)}
                    title={
                      data
                        ? `${day.format('MMM D')}: ${data.dreams.length} dream${data.dreams.length > 1 ? 's' : ''
                        }${data.maxLucidity ? ` (lucidity ${data.maxLucidity})` : ''}`
                        : day.format('MMM D')
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="legend-cell" style={{ '--intensity': 0 } as React.CSSProperties} />
          <div className="legend-cell" style={{ '--intensity': 1 } as React.CSSProperties} />
          <div className="legend-cell" style={{ '--intensity': 1.3 } as React.CSSProperties} />
          <div className="legend-cell" style={{ '--intensity': 1.6 } as React.CSSProperties} />
          <div className="legend-cell" style={{ '--intensity': 1.75 } as React.CSSProperties} />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}