'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface HeaderSearchProps {
  className?: string
  placeholder?: string
}

/**
 * HeaderSearch - Ricardo-Style Searchbar mit separatem Such-Button
 *
 * Features:
 * - Große, prominente Searchbar (wie Ricardo)
 * - Separater grüner Such-Button
 * - Inline Dropdown mit Suggestions
 * - Keyboard-Navigation
 */
export function HeaderSearch({
  className = '',
  placeholder = 'Suche nach Artikel, Verkäufer oder Artikelnummer',
}: HeaderSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch Suggestions - nur wenn User etwas eingibt
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    // Mindestens 2 Zeichen für Suggestions
    if (searchTerm.trim().length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const url = `/api/search/suggestions?q=${encodeURIComponent(searchTerm)}&limit=8`
      const response = await fetch(url)
      const data = await response.json()

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced fetch on input change
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (!isOpen) return

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 250)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, isOpen, fetchSuggestions])

  // Handle Search Submit
  const handleSubmit = useCallback(
    (selectedQuery?: string) => {
      const searchTerm = selectedQuery || query.trim()
      if (!searchTerm) return

      setIsOpen(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()

      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    },
    [query, router]
  )

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
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
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle Focus
  const handleFocus = () => {
    if (query.trim().length >= 2) {
      setIsOpen(true)
    }
  }

  // Clear input
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Ricardo-Style Search Form: Input + Button */}
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex"
      >
        {/* Input Container */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(-1)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="h-12 w-full rounded-l-lg border border-r-0 border-gray-300 bg-white pl-12 pr-10 text-base text-gray-900 transition-colors placeholder:text-gray-500 hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Suche löschen"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Ricardo-Style Search Button */}
        <button
          type="submit"
          className="flex h-12 items-center justify-center rounded-r-lg bg-primary-600 px-6 text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Suchen"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSubmit(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
