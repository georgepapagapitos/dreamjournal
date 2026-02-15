import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../api/client'
import type { DetailedStats } from '../../types'
import { getMood } from '../ui/MoodPicker'
import './StatsView.css'

export function StatsView() {
    const [stats, setStats] = useState<DetailedStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await api.stats.getDetailed()
                setStats(data)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1 className="page-title">Statistics</h1>
                </div>
                <div className="loading">
                    <div className="spinner" /> Loading…
                </div>
            </div>
        )
    }

    if (!stats || stats.total_dreams === 0) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1 className="page-title">Statistics</h1>
                </div>
                <div className="empty-state">
                    <div className="empty-state__icon">📊</div>
                    <div className="empty-state__title">No data yet</div>
                    <div className="empty-state__body">
                        Record some dreams to see your statistics
                    </div>
                </div>
            </div>
        )
    }

    // Get CSS variables
    const root = getComputedStyle(document.documentElement)
    const amber = root.getPropertyValue('--amber').trim()
    const amberGlow = root.getPropertyValue('--amber-glow').trim()
    const gold = root.getPropertyValue('--gold').trim()
    const goldLight = root.getPropertyValue('--gold-light').trim()
    const amberDeep = root.getPropertyValue('--amber-deep').trim()
    const inkMuted = root.getPropertyValue('--ink-muted').trim()
    const amberRgb = root.getPropertyValue('--amber-rgb').trim()
    const inkSoftRgb = root.getPropertyValue('--ink-soft-rgb').trim()
    const parchment = root.getPropertyValue('--parchment').trim()

    const CHART_COLORS = [amber, amberGlow, gold, goldLight, amberDeep, inkMuted]

    return (
        <div className="fade-in stats-view">
            <div className="page-header">
                <h1 className="page-title">
                    Your <em>Statistics</em>
                </h1>
                <p className="page-subtitle">
                    Insights from {stats.total_dreams} {stats.total_dreams === 1 ? 'dream' : 'dreams'}
                </p>
            </div>

            {/* Key Metrics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__value">{stats.total_dreams}</div>
                    <div className="stat-card__label">Total Dreams</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.current_streak}</div>
                    <div className="stat-card__label">Day Streak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">
                        {stats.lucidity_trend.length > 0
                            ? stats.lucidity_trend[stats.lucidity_trend.length - 1].avg_lucidity
                            : '—'}
                    </div>
                    <div className="stat-card__label">Recent Lucidity</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.top_tags.length}</div>
                    <div className="stat-card__label">Unique Tags</div>
                </div>
            </div>

            {/* Dreams Over Time */}
            {stats.dreams_by_month.length > 0 && (
                <div className="chart-section">
                    <h2 className="chart-title">Dreams Over Time</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.dreams_by_month}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${amberRgb}, 0.1)`} />
                            <XAxis dataKey="month" stroke={inkMuted} tick={{ fill: inkMuted, fontSize: 12 }} />
                            <YAxis stroke={inkMuted} tick={{ fill: inkMuted, fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: `rgba(${inkSoftRgb}, 0.95)`,
                                    border: `1px solid rgba(${amberRgb}, 0.3)`,
                                    borderRadius: '8px',
                                    color: parchment
                                }}
                            />
                            <Bar dataKey="count" fill={amber} radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Lucidity Trend */}
            {stats.lucidity_trend.length > 0 && (
                <div className="chart-section">
                    <h2 className="chart-title">Lucidity Progression</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={stats.lucidity_trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${amberRgb}, 0.1)`} />
                            <XAxis dataKey="month" stroke={inkMuted} tick={{ fill: inkMuted, fontSize: 12 }} />
                            <YAxis domain={[0, 5]} stroke={inkMuted} tick={{ fill: inkMuted, fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: `rgba(${inkSoftRgb}, 0.95)`,
                                    border: `1px solid rgba(${amberRgb}, 0.3)`,
                                    borderRadius: '8px',
                                    color: parchment
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="avg_lucidity"
                                stroke={amberGlow}
                                strokeWidth={3}
                                dot={{ fill: amber, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Dreams by Day of Week */}
            {stats.dreams_by_day.length > 0 && (
                <div className="chart-section">
                    <h2 className="chart-title">Dreams by Day of Week</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.dreams_by_day}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${amberRgb}, 0.1)`} />
                            <XAxis dataKey="day" stroke={inkMuted} tick={{ fill: inkMuted, fontSize: 12 }} />
                            <YAxis stroke={inkMuted} tick={{ fill: inkMuted, fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: `rgba(${inkSoftRgb}, 0.95)`,
                                    border: `1px solid rgba(${amberRgb}, 0.3)`,
                                    borderRadius: '8px',
                                    color: parchment
                                }}
                            />
                            <Bar dataKey="count" fill={gold} radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Mood Distribution */}
            {stats.mood_distribution.length > 0 && (
                <div className="chart-section">
                    <h2 className="chart-title">Mood Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.mood_distribution}
                                dataKey="count"
                                nameKey="mood"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ mood, percent }) => {
                                    const moodObj = getMood(mood)
                                    return `${moodObj?.emoji || ''} ${(percent * 100).toFixed(0)}%`
                                }}
                                labelLine={false}
                            >
                                {stats.mood_distribution.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: `rgba(${inkSoftRgb}, 0.95)`,
                                    border: `1px solid rgba(${amberRgb}, 0.3)`,
                                    borderRadius: '8px',
                                    color: parchment
                                }}
                                formatter={(value: any, name: string) => {
                                    const moodObj = getMood(name)
                                    return [value, moodObj?.label || name]
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top Tags */}
            {stats.top_tags.length > 0 && (
                <div className="chart-section">
                    <h2 className="chart-title">Top Dream Themes</h2>
                    <div className="tag-cloud">
                        {stats.top_tags.map((item, index) => (
                            <div
                                key={item.tag}
                                className="tag-cloud-item"
                                style={{
                                    fontSize: `${Math.max(14, Math.min(32, 14 + (item.count * 2)))}px`,
                                    opacity: 1 - (index * 0.08),
                                }}
                            >
                                #{item.tag}
                                <span className="tag-count">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}