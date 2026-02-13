import { useState, useCallback } from 'react'
import { CaptureView } from './components/CaptureView'
import { JournalView } from './components/JournalView'
import { CalendarView } from './components/CalendarView'
import { DetailView } from './components/DetailView'
import { Toast } from './components/Toast'
import { useToast } from './hooks/useToast'
import type { Dream } from './types'

const TAB_JOURNAL = 'journal'
const TAB_CAPTURE = 'capture'
const TAB_CALENDAR = 'calendar'

type Tab = typeof TAB_JOURNAL | typeof TAB_CAPTURE | typeof TAB_CALENDAR

export default function App() {
  const [tab, setTab] = useState<Tab>(TAB_JOURNAL)
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null)
  const [editDream, setEditDream] = useState<Dream | null>(null)
  const [journalKey, setJournalKey] = useState(0)
  const { toast, showToast } = useToast()

  const refreshJournal = useCallback(() => {
    setJournalKey((k) => k + 1)
  }, [])

  const handleSaved = useCallback(() => {
    refreshJournal()
    setEditDream(null)
    setTab(TAB_JOURNAL)
    showToast(editDream ? 'Dream updated ✦' : 'Dream recorded ✦')
  }, [editDream, refreshJournal, showToast])

  const handleSelectDream = useCallback((dream: Dream) => {
    setSelectedDream(dream)
  }, [])

  const handleEdit = useCallback(() => {
    setEditDream(selectedDream)
    setSelectedDream(null)
    setTab(TAB_CAPTURE)
  }, [selectedDream])

  const handleDeleted = useCallback(() => {
    setSelectedDream(null)
    refreshJournal()
  }, [refreshJournal])

  const handleBack = useCallback(() => {
    setSelectedDream(null)
  }, [])

  const handleNavCapture = () => {
    setEditDream(null)
    setSelectedDream(null)
    setTab(TAB_CAPTURE)
  }

  const handleNavJournal = () => {
    setEditDream(null)
    setSelectedDream(null)
    setTab(TAB_JOURNAL)
  }

  return (
    <>
      {/* Background ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(196,130,74,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(100,60,30,0.08) 0%, transparent 50%)',
      }} />

      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Render active view */}
        {selectedDream ? (
          <DetailView
            key={selectedDream.id}
            dream={selectedDream}
            onBack={handleBack}
            onEdit={handleEdit}
            onDeleted={handleDeleted}
            showToast={showToast}
          />
        ) : tab === TAB_CAPTURE ? (
          <CaptureView
            key={editDream?.id ?? 'new'}
            onSaved={handleSaved}
            editDream={editDream}
          />
        ) : tab === TAB_CALENDAR ? (
          <CalendarView
            key={journalKey}
            onSelectDream={handleSelectDream}
          />
        ) : (
          <JournalView
            key={journalKey}
            onSelectDream={handleSelectDream}
          />
        )}
      </div>

      {/* Bottom navigation */}
      {!selectedDream && (
        <nav className="bottom-nav">
          <div className="bottom-nav__inner">
            <button
              className={`nav-btn${tab === TAB_JOURNAL ? ' active' : ''}`}
              onClick={handleNavJournal}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Journal
            </button>

            <button
              className={`nav-btn nav-btn--capture${tab === TAB_CAPTURE ? ' active' : ''}`}
              onClick={handleNavCapture}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Record
            </button>

            <button
              className={`nav-btn${tab === TAB_CALENDAR ? ' active' : ''}`}
              onClick={() => {
                setEditDream(null)
                setSelectedDream(null)
                setTab(TAB_CALENDAR)
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Calendar
            </button>

          </div>
        </nav>
      )}

      <Toast toast={toast} />
    </>
  )
}