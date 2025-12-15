'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Search, TrendingUp, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  initialValue?: string
}

/**
 * Intelligente Suchleiste mit Autocomplete (Feature 1)
 *
 * Features:
 * - Live-Suggestions basierend auf User-Eingabe
 * - Populäre Suchbegriffe wenn kein Input
 * - Debounced API-Calls für Performance
 * - Keyboard-Navigation (Arrow keys, Enter, Escape)
 * - Mobile-optimiert
 */
export function SearchAutocomplete({
  onSearch,
  placeholder,
  className = '',
  initialValue = '',
}: SearchAutocompleteProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPopular, setShowPopular] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced API-Call für Suggestions
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim().length < 2 && searchTerm.trim().length > 0) {
      setSuggestions([])
      setShowPopular(false)
      return
    }

    setIsLoading(true)
    try {
      const url = `/api/search/suggestions?q=${encodeURIComponent(searchTerm)}&limit=8`
      const response = await fetch(url)
      const data = await response.json()

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions)
        setShowPopular(searchTerm.trim().length === 0 && data.suggestions.length > 0)
      } else {
        setSuggestions([])
        setShowPopular(false)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setShowPopular(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce Input-Änderungen - nur wenn User interagiert hat
  useEffect(() => {
    if (!hasInteracted) return

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (query.trim().length === 0) {
      // Wenn leer, zeige populäre Suchbegriffe
      fetchSuggestions('')
      setIsOpen(true)
    } else {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(query)
        setIsOpen(true)
      }, 300) // 300ms Debounce
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, fetchSuggestions, hasInteracted])

  // Handle Search Submit
  const handleSubmit = useCallback(
    (selectedQuery?: string) => {
      const searchTerm = selectedQuery || query.trim()
      if (!searchTerm) return

      setIsOpen(false)
      setSelectedIndex(-1)

      if (onSearch) {
        onSearch(searchTerm)
      } else {
        // Default: Navigate to search page
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
      }
    },
    [query, onSearch, router]
  )

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSubmit(suggestions[selectedIndex])
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative w-full ${className}`}>
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
        className="relative"
      >
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400" />
          <input id="search"
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setHasInteracted(true)
              setQuery(e.target.value)
              setSelectedIndex(-1)
            }}
            onFocus={() => {
              setHasInteracted(true)
              // Lade Suggestions beim ersten Focus
              if (query.trim().length === 0 && suggestions.length === 0) {
                fetchSuggestions('')
              }
              if (suggestions.length > 0 || query.trim().length === 0) {
                setIsOpen(true)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Suchen Sie nach Produkten...'}
            className="w-full rounded-full border-2 border-gray-200 bg-white py-5 pl-12 pr-12 text-base text-gray-900 shadow-lg transition-all duration-200 ease-out placeholder:text-gray-500 hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 md:py-6 md:text-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
                setIsOpen(false)
                inputRef.current?.focus()
              }}
              className="absolute right-4 rounded-full p-1 text-gray-400 transition-all duration-200 ease-out hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              title="Suche löschen"
              aria-label="Suche löschen"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {showPopular && (
                <div className="border-b border-gray-100 px-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    Beliebte Suchbegriffe
                  </div>
                </div>
              )}
              <ul className="max-h-64 overflow-y-auto py-2">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSubmit(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`cursor-pointer px-4 py-3 text-sm transition-colors duration-150 ease-out ${
                      index === selectedIndex
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span>{suggestion}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
