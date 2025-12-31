'use client'

import { ArrowLeft, Search, TrendingUp, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * MobileSearchOverlay - Full-screen search overlay for mobile
 *
 * Features:
 * - Full-screen overlay with search input
 * - Popular search suggestions
 * - Keyboard handling (ESC closes, Enter submits)
 * - URL-driven state
 */
function MobileSearchOverlayContent({ isOpen, onClose }: MobileSearchOverlayProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current query from URL
  const currentQuery = searchParams?.get('q') || ''
  const [inputValue, setInputValue] = useState(currentQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
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

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('')
    inputRef.current?.focus()
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-white md:hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Zurück"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <form
          onSubmit={e => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex-1"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Suchen..."
              aria-label="Suche"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="h-12 w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-11 text-base text-gray-900 transition-colors placeholder:text-gray-500 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 flex items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Suche löschen"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto">
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
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
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
            <p>Drücke Enter, um nach "{inputValue}" zu suchen</p>
          </div>
        ) : null}
      </div>

      {/* Quick action - search button at bottom */}
      {inputValue.trim() && (
        <div className="safe-area-inset-bottom border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 py-3 font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
            style={{ minHeight: '48px' }}
          >
            <Search className="h-5 w-5" />
            Suchen
          </button>
        </div>
      )}
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export function MobileSearchOverlay(props: MobileSearchOverlayProps) {
  // Don't render anything if not open (avoid unnecessary Suspense)
  if (!props.isOpen) return null

  return (
    <Suspense fallback={null}>
      <MobileSearchOverlayContent {...props} />
    </Suspense>
  )
}
