'use client'

import { Search, TrendingUp, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

interface DesktopSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * DesktopSearchOverlay - Search overlay modal for desktop
 *
 * Features:
 * - Modal overlay with centered search input
 * - Search suggestions/autocomplete
 * - Keyboard handling (ESC closes, Enter submits, Cmd/Ctrl+K opens)
 * - URL-driven state
 */
function DesktopSearchOverlayContent({ isOpen, onClose }: DesktopSearchOverlayProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current query from URL
  const currentQuery = searchParams?.get('q') || ''
  const [inputValue, setInputValue] = useState(currentQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Sync input value with URL query param when overlay opens
  useEffect(() => {
    if (isOpen) {
      setInputValue(currentQuery)
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 100)
      // Load suggestions
      fetchSuggestions('')
    }
  }, [isOpen, currentQuery])

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      const url = `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`
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
    if (!isOpen) return

    const timeout = setTimeout(() => {
      fetchSuggestions(inputValue)
    }, 300)

    return () => clearTimeout(timeout)
  }, [inputValue, isOpen, fetchSuggestions])

  // Handle search submit
  const handleSubmit = useCallback(
    (query?: string) => {
      const searchTerm = query || inputValue.trim()
      if (!searchTerm) return

      // Build URL with existing category params if present
      const params = new URLSearchParams()
      params.set('q', searchTerm)

      // Preserve category and subcategory
      const category = searchParams?.get('category')
      const subcategory = searchParams?.get('subcategory')
      if (category) params.set('category', category)
      if (subcategory) params.set('subcategory', subcategory)

      router.push(`/search?${params.toString()}`)
      onClose()
    },
    [inputValue, searchParams, router, onClose]
  )

  // Keyboard navigation
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
    }
  }

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('')
    inputRef.current?.focus()
  }, [])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-[101] flex items-start justify-center px-4 pt-[20vh]">
        <div
          className="animate-in fade-in slide-in-from-top-4 pointer-events-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="border-b border-gray-100 p-4">
            <form
              onSubmit={e => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value)
                    setSelectedIndex(-1)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Suchen..."
                  aria-label="Suche"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="h-14 w-full rounded-xl border-0 bg-gray-50 pl-12 pr-12 text-base text-gray-900 transition-colors placeholder:text-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    aria-label="Suche löschen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Suggestions */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center px-4 py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                {!inputValue.trim() && (
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    Beliebte Suchbegriffe
                  </div>
                )}
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => handleSubmit(suggestion)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 transition-colors ${
                          index === selectedIndex
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
                        <span className="text-base">{suggestion}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : inputValue.trim() ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>Drücke Enter, um nach &quot;{inputValue}&quot; zu suchen</p>
              </div>
            ) : null}
          </div>

          {/* Footer hint */}
          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Drücke ESC zum Schließen</span>
              <span>⌘K oder Strg+K zum Öffnen</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export function DesktopSearchOverlay(props: DesktopSearchOverlayProps) {
  // Don't render anything if not open (avoid unnecessary Suspense)
  if (!props.isOpen) return null

  return (
    <Suspense fallback={null}>
      <DesktopSearchOverlayContent {...props} />
    </Suspense>
  )
}
