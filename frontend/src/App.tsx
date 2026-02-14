import { useCallback, useState } from 'react'
import { AuthView } from './components/AuthView'
import { CalendarView } from './components/CalendarView'
import { CaptureView } from './components/CaptureView'
import { DetailView } from './components/DetailView'
import { JournalView } from './components/JournalView'
import { StatsView } from './components/StatsView'
import { Toast } from './components/Toast'
import { useAuth } from './contexts/AuthContext'
import { useToast } from './hooks/useToast'
import type { Dream } from './types'
import { SettingsView } from './components/SettingsView'

const TAB_JOURNAL = 'journal'
const TAB_CAPTURE = 'capture'
const TAB_CALENDAR = 'calendar'
const TAB_STATS = 'stats'
const TAB_SETTINGS = 'settings'

type Tab = typeof TAB_JOURNAL | typeof TAB_CAPTURE | typeof TAB_CALENDAR | typeof TAB_STATS | typeof TAB_SETTINGS

export default function App() {
  const { user, loading: authLoading, logout } = useAuth()
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

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)',
      }}>
        <div className="loading">
          <div className="spinner" /> Loading…
        </div>
      </div>
    )
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthView />
  }

  return (
    <>
      {/* Background ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(196,130,74,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(100,60,30,0.08) 0%, transparent 50%)',
      }} />

      {/* User menu */}
      <div className="user-menu">
        <span className="user-menu__name">{user.username}</span>
        <button
          className="user-menu__btn"
          onClick={() => {
            setEditDream(null)
            setSelectedDream(null)
            setTab(TAB_SETTINGS)
          }}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button className="user-menu__logout" onClick={logout}>
          Sign out
        </button>
      </div>

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
        ) : tab === TAB_STATS ? (
          <StatsView key={journalKey} />
        ) :
          tab === TAB_SETTINGS ? (
            <SettingsView key={journalKey} />
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

            <button
              className={`nav-btn${tab === TAB_STATS ? ' active' : ''}`}
              onClick={() => {
                setEditDream(null)
                setSelectedDream(null)
                setTab(TAB_STATS)
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              Stats
            </button>

          </div>
        </nav>
      )}

      <Toast toast={toast} />
    </>
  )
}