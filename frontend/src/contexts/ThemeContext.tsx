import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { applyTheme, getThemeById } from '../themes'

interface ThemeContextType {
    currentTheme: string
    setTheme: (themeId: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<string>(() => {
        return localStorage.getItem('theme') || 'amber'
    })

    useEffect(() => {
        const theme = getThemeById(currentTheme)
        applyTheme(theme)
    }, [currentTheme])

    const setTheme = (themeId: string) => {
        setCurrentTheme(themeId)
        localStorage.setItem('theme', themeId)
    }

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}