import { FormEvent, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export function AuthView() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [attempted, setAttempted] = useState(false)
    const { login, register } = useAuth()

    const validateForm = () => {
        const errors: Record<string, string> = {}

        // Email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email address'
        }

        // Username validation (only for signup)
        if (!isLogin) {
            if (!username) {
                errors.username = 'Username is required'
            } else if (username.length < 3) {
                errors.username = 'Username must be at least 3 characters'
            } else if (username.length > 20) {
                errors.username = 'Username must be at most 20 characters'
            } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                errors.username = 'Username can only contain letters, numbers, _ and -'
            }
        }

        // Password validation
        if (!password) {
            errors.password = 'Password is required'
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters'
        }

        // Confirm password (only for signup)
        if (!isLogin) {
            if (!confirmPassword) {
                errors.confirmPassword = 'Please confirm your password'
            } else if (password !== confirmPassword) {
                errors.confirmPassword = 'Passwords do not match'
            }
        }

        return errors
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setAttempted(true)
        setError('')

        const errors = validateForm()
        setValidationErrors(errors)

        if (Object.keys(errors).length > 0) {
            return
        }

        setLoading(true)

        try {
            if (isLogin) {
                await login(email, password)
            } else {
                await register(email, username, password)
            }
        } catch (err: any) {
            // Parse backend error messages
            let errorMessage = 'Something went wrong'
            try {
                const errorData = JSON.parse(err.message)
                errorMessage = errorData.detail || errorMessage
            } catch {
                errorMessage = err.message || errorMessage
            }
            setError(errorMessage)
            setLoading(false)
        }
    }

    const switchMode = () => {
        setIsLogin(!isLogin)
        setError('')
        setValidationErrors({})
        setPassword('')
        setConfirmPassword('')
        setAttempted(false)
    }

    return (
        <div className="auth-container">
            {/* Background ambient glow */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                background: 'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(196,130,74,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(100,60,30,0.08) 0%, transparent 50%)',
            }} />

            <div className="auth-box">
                <div className="auth-header">
                    <h1 className="auth-title">
                        Dream <em>Journal</em>
                    </h1>
                    <p className="auth-subtitle">
                        {isLogin ? 'Welcome back' : 'Start your journey'}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={attempted && validationErrors.email ? 'invalid' : ''}
                            aria-invalid={attempted && validationErrors.email ? 'true' : 'false'}
                            aria-describedby={attempted && validationErrors.email ? 'email-error' : undefined}
                            required
                            autoFocus
                        />
                        {attempted && validationErrors.email && (
                            <span id="email-error" className="field-error" role="alert">
                                {validationErrors.email}
                            </span>
                        )}
                    </div>

                    {!isLogin && (
                        <div className="field">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="dreamweaver"
                                className={attempted && validationErrors.username ? 'invalid' : ''}
                                aria-invalid={attempted && validationErrors.username ? 'true' : 'false'}
                                aria-describedby="username-hint username-error"
                                required
                            />
                            <span id="username-hint" className="field-hint">
                                3-20 characters, letters, numbers, _ and - only
                            </span>
                            {attempted && validationErrors.username && (
                                <span id="username-error" className="field-error" role="alert">
                                    {validationErrors.username}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={attempted && validationErrors.password ? 'invalid' : ''}
                            aria-invalid={attempted && validationErrors.password ? 'true' : 'false'}
                            aria-describedby={!isLogin ? 'password-hint password-error' : validationErrors.password ? 'password-error' : undefined}
                            required
                        />
                        {!isLogin && (
                            <span id="password-hint" className="field-hint">
                                At least 8 characters
                            </span>
                        )}
                        {attempted && validationErrors.password && (
                            <span id="password-error" className="field-error" role="alert">
                                {validationErrors.password}
                            </span>
                        )}
                    </div>

                    {!isLogin && (
                        <div className="field">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={attempted && validationErrors.confirmPassword ? 'invalid' : ''}
                                aria-invalid={attempted && validationErrors.confirmPassword ? 'true' : 'false'}
                                aria-describedby={attempted && validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
                                required
                            />
                            {attempted && validationErrors.confirmPassword && (
                                <span id="confirm-password-error" className="field-error" role="alert">
                                    {validationErrors.confirmPassword}
                                </span>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={loading}
                    >
                        {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        type="button"
                        onClick={switchMode}
                        className="auth-toggle-btn"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    )
}