'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Get system preference
function getSystemTheme(): Theme {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const [userPreference, setUserPreference] = useState<Theme | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Check for saved user preference
    const savedTheme = localStorage.getItem('theme') as Theme | null
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      // User has a saved preference, use it
      setUserPreference(savedTheme)
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      // No user preference, use system preference
      const systemTheme = getSystemTheme()
      setTheme(systemTheme)
      document.documentElement.setAttribute('data-theme', systemTheme)
    }
  }, [])

  // Listen for system theme changes (only if user hasn't set a preference)
  useEffect(() => {
    if (!mounted || userPreference !== null) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light'
      setTheme(systemTheme)
      document.documentElement.setAttribute('data-theme', systemTheme)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [mounted, userPreference])

  // Update theme when it changes (and save user preference)
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme)
      // Only save to localStorage if user has explicitly set a preference
      if (userPreference !== null) {
        localStorage.setItem('theme', theme)
      }
    }
  }, [theme, mounted, userPreference])

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      // Mark that user has set a preference
      setUserPreference(newTheme)
      localStorage.setItem('theme', newTheme)
      return newTheme
    })
  }

  // Always provide the context, even before mounting
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
