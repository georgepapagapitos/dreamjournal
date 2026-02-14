import dayjs from 'dayjs'
import { FormEvent, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { themes } from '../../themes'


function ThemePicker() {
    const { currentTheme, setTheme } = useTheme()

    return (
        <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            {themes.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`theme-option${currentTheme === theme.id ? ' theme-option--active' : ''}`}
                    style={{
                        '--theme-accent': theme.colors.accent,
                        '--theme-glow': theme.colors.accentGlow,
                    } as React.CSSProperties}
                >
                    <div className="theme-option__preview">
                        <div className="theme-option__dot" style={{ background: theme.colors.accent }} />
                        <div className="theme-option__dot" style={{ background: theme.colors.accentGlow }} />
                        <div className="theme-option__dot" style={{ background: theme.colors.gold }} />
                    </div>
                    <div className="theme-option__info">
                        <div className="theme-option__name">{theme.name}</div>
                        <div className="theme-option__description">{theme.description}</div>
                    </div>
                    {currentTheme === theme.id && (
                        <div className="theme-option__check">✓</div>
                    )}
                </button>
            ))}
        </div>
    )
}

export function SettingsView() {
    const { user, logout } = useAuth()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [newUsername, setNewUsername] = useState(user?.username || '')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleBackup = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            const response = await fetch('/api/backup', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Backup failed')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `dream-journal-backup-${dayjs().format('YYYYMMDD')}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            setSuccess('Backup downloaded successfully')
        } catch (error) {
            console.error('Backup failed:', error)
            setError('Backup failed')
        }
    }

    const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            try {
                const result = await api.import(file)
                setSuccess(`Imported ${result.imported} dream${result.imported !== 1 ? 's' : ''}${result.skipped > 0 ? ` · Skipped ${result.skipped}` : ''}`)
            } catch (error: any) {
                setError(`Import failed: ${error.message}`)
            }
        }
        input.click()
    }

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const result = await api.auth.changePassword(currentPassword, newPassword)
            setSuccess(result.message)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setError(err.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    const handleUsernameChange = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (newUsername === user?.username) {
            setError('New username is the same as current username')
            return
        }

        setLoading(true)
        try {
            const updatedUser = await api.auth.changeUsername(newUsername)
            localStorage.setItem('user', JSON.stringify(updatedUser))
            setSuccess('Username changed successfully')
            // Force a small delay before reloading to show success message
            setTimeout(() => window.location.reload(), 1000)
        } catch (err: any) {
            setError(err.message || 'Failed to change username')
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        setLoading(true)
        try {
            await api.auth.deleteAccount()
            logout()
        } catch (err: any) {
            setError(err.message || 'Failed to delete account')
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    if (!user) return null

    return (
        <div className="fade-in settings-view">
            <div className="page-header">
                <h1 className="page-title">
                    <em>Settings</em>
                </h1>
                <p className="page-subtitle">Manage your account</p>
            </div>

            <div className="settings-content">
                {/* Account Info */}
                <section className="settings-section">
                    <h2 className="settings-section-title">Account Information</h2>
                    <div className="settings-info">
                        <div className="settings-info-row">
                            <span className="settings-info-label">Email</span>
                            <span className="settings-info-value">{user.email}</span>
                        </div>
                        <div className="settings-info-row">
                            <span className="settings-info-label">Username</span>
                            <span className="settings-info-value">{user.username}</span>
                        </div>
                        {user.created_at && (
                            <div className="settings-info-row">
                                <span className="settings-info-label">Member since</span>
                                <span className="settings-info-value">
                                    {new Date(user.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Theme Selection */}
                <section className="settings-section">
                    <h2 className="settings-section-title">Appearance</h2>
                    <p className="settings-section-description">
                        Choose a color palette for your journal
                    </p>
                    <ThemePicker />
                </section>

                {/* Backup & Import */}
                <section className="settings-section">
                    <h2 className="settings-section-title">Data Management</h2>
                    <p className="settings-section-description">
                        Export your dreams as a JSON backup file, or import dreams from a previous backup.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button onClick={handleBackup} className="btn btn--ghost" style={{ flex: 1 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export Backup
                        </button>
                        <button onClick={handleImport} className="btn btn--ghost" style={{ flex: 1 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Import Backup
                        </button>
                    </div>
                </section>

                {/* Change Username */}
                <section className="settings-section">
                    <h2 className="settings-section-title">Change Username</h2>
                    <form onSubmit={handleUsernameChange} className="settings-form">
                        <div className="field">
                            <label htmlFor="new-username">New Username</label>
                            <input
                                id="new-username"
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="dreamweaver"
                                minLength={3}
                                maxLength={20}
                                required
                            />
                            <span className="field-hint">3-20 characters, letters, numbers, _ and - only</span>
                        </div>
                        <button type="submit" className="btn btn--primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Username'}
                        </button>
                    </form>
                </section>

                {/* Change Password */}
                <section className="settings-section">
                    <h2 className="settings-section-title">Change Password</h2>
                    <form onSubmit={handlePasswordChange} className="settings-form">
                        <div className="field">
                            <label htmlFor="current-password">Current Password</label>
                            <input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="new-password">New Password</label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={8}
                                required
                            />
                            <span className="field-hint">At least 8 characters</span>
                        </div>
                        <div className="field">
                            <label htmlFor="confirm-password">Confirm New Password</label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn--primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                </section>

                {/* Delete Account */}
                <section className="settings-section settings-section--danger">
                    <h2 className="settings-section-title">Danger Zone</h2>
                    <p className="settings-danger-text">
                        Deleting your account will permanently remove all your dreams and data. This action cannot be undone.
                    </p>
                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn btn--danger"
                        >
                            Delete Account
                        </button>
                    ) : (
                        <div className="settings-confirm">
                            <p className="settings-confirm-text">Are you absolutely sure? This cannot be undone.</p>
                            <div className="settings-confirm-actions">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="btn btn--danger"
                                    disabled={loading}
                                >
                                    {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn--ghost"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Messages */}
                {error && (
                    <div className="settings-message settings-message--error" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="settings-message settings-message--success" role="alert">
                        {success}
                    </div>
                )}
            </div>
        </div>
    )
}