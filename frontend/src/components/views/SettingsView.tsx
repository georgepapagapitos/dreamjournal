import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../api/client'

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