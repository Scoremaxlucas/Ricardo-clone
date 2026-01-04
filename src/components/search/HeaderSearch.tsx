'use client'

import { Folder, Package, Search, Tag, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface EnhancedSuggestion {
  type: 'text' | 'category' | 'brand' | 'product'
  value: string
  label: string
  icon?: string
  image?: string
  price?: number
  categorySlug?: string
  productId?: string
  count?: number
}

interface HeaderSearchProps {
  className?: string
  placeholder?: string
}

/**
 * RICARDO-LEVEL: Enhanced HeaderSearch
 *
 * Features:
 * - Categories, brands, and products in suggestions
 * - Image previews for products
 * - Category icons
 * - Brand counts
 * - Keyboard navigation
 */
export function HeaderSearch({
  className = '',
  placeholder = 'Suche nach Artikel, Verkäufer oder Artikelnummer',
}: HeaderSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch Enhanced Suggestions
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    // Show popular suggestions even with empty query
    if (searchTerm.trim().length < 2 && searchTerm.trim().length > 0) {
      return
    }

    setIsLoading(true)
    try {
      const url = `/api/search/suggestions?q=${encodeURIComponent(searchTerm)}&limit=12&enhanced=true`
      const response = await fetch(url)
      const data = await response.json()

      if (data.enhancedSuggestions && Array.isArray(data.enhancedSuggestions)) {
        setSuggestions(data.enhancedSuggestions)
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        // Fallback to simple suggestions
        setSuggestions(
          data.suggestions.map((s: string) => ({
            type: 'text' as const,
            value: s,
            label: s,
          }))
        )
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

  // Handle Search Submit - supports enhanced suggestions
  const handleSubmit = useCallback(
    (selectedSuggestion?: EnhancedSuggestion | string) => {
      setIsOpen(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()

      // If it's an enhanced suggestion object
      if (selectedSuggestion && typeof selectedSuggestion === 'object') {
        const suggestion = selectedSuggestion as EnhancedSuggestion

        if (suggestion.type === 'category' && suggestion.categorySlug) {
          router.push(`/categories/${suggestion.categorySlug}`)
          return
        }

        if (suggestion.type === 'product' && suggestion.productId) {
          router.push(`/watches/${suggestion.productId}`)
          return
        }

        if (suggestion.type === 'brand') {
          router.push(
            `/search?q=${encodeURIComponent(suggestion.value)}&brand=${encodeURIComponent(suggestion.value)}`
          )
          return
        }

        // Text suggestion - use the value
        router.push(`/search?q=${encodeURIComponent(suggestion.value)}`)
        return
      }

      // Simple string query
      const searchTerm = (
        typeof selectedSuggestion === 'string' ? selectedSuggestion : query
      ).trim()
      if (!searchTerm) return
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    },
    [query, router]
  )

  // Keyboard Navigation - updated for enhanced suggestions
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

  // Get icon for suggestion type
  const getSuggestionIcon = (suggestion: EnhancedSuggestion) => {
    if (suggestion.icon) {
      return <span className="text-base">{suggestion.icon}</span>
    }
    switch (suggestion.type) {
      case 'category':
        return <Folder className="h-4 w-4 text-primary-500" />
      case 'brand':
        return <Tag className="h-4 w-4 text-amber-500" />
      case 'product':
        return <Package className="h-4 w-4 text-blue-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  // Get badge text for suggestion type
  const getSuggestionBadge = (suggestion: EnhancedSuggestion) => {
    switch (suggestion.type) {
      case 'category':
        return <span className="text-xs text-primary-600">Kategorie</span>
      case 'brand':
        return suggestion.count ? (
          <span className="text-xs text-gray-500">{suggestion.count} Artikel</span>
        ) : (
          <span className="text-xs text-amber-600">Marke</span>
        )
      case 'product':
        return suggestion.price ? (
          <span className="text-xs font-medium text-primary-600">
            CHF {suggestion.price.toLocaleString('de-CH')}
          </span>
        ) : null
      default:
        return null
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

  // Handle Focus - show popular suggestions when empty
  const handleFocus = () => {
    setIsOpen(true)
    // Fetch popular suggestions if query is empty
    if (query.trim().length === 0 && suggestions.length === 0) {
      fetchSuggestions('')
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

      {/* RICARDO-LEVEL: Enhanced Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <span className="ml-2 text-sm text-gray-500">Suche...</span>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {/* Group suggestions by type */}
              {(() => {
                const categories = suggestions.filter(s => s.type === 'category')
                const brands = suggestions.filter(s => s.type === 'brand')
                const products = suggestions.filter(s => s.type === 'product')
                const texts = suggestions.filter(s => s.type === 'text')

                let globalIndex = -1

                return (
                  <>
                    {/* Categories Section */}
                    {categories.length > 0 && (
                      <div className="border-b border-gray-100 py-2">
                        <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                          Kategorien
                        </div>
                        {categories.map(suggestion => {
                          globalIndex++
                          const idx = globalIndex
                          return (
                            <button
                              key={`cat-${suggestion.value}`}
                              type="button"
                              onClick={() => handleSubmit(suggestion)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                idx === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-lg">
                                {suggestion.icon || '📁'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span
                                  className={`block truncate font-medium ${idx === selectedIndex ? 'text-primary-700' : 'text-gray-900'}`}
                                >
                                  {suggestion.label}
                                </span>
                              </div>
                              {getSuggestionBadge(suggestion)}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Brands Section */}
                    {brands.length > 0 && (
                      <div className="border-b border-gray-100 py-2">
                        <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                          Marken
                        </div>
                        {brands.map(suggestion => {
                          globalIndex++
                          const idx = globalIndex
                          return (
                            <button
                              key={`brand-${suggestion.value}`}
                              type="button"
                              onClick={() => handleSubmit(suggestion)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                idx === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <Tag className="h-5 w-5 flex-shrink-0 text-amber-500" />
                              <div className="min-w-0 flex-1">
                                <span
                                  className={`block truncate font-medium ${idx === selectedIndex ? 'text-primary-700' : 'text-gray-900'}`}
                                >
                                  {suggestion.label}
                                </span>
                              </div>
                              {getSuggestionBadge(suggestion)}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Products Section */}
                    {products.length > 0 && (
                      <div className="border-b border-gray-100 py-2">
                        <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                          Artikel
                        </div>
                        {products.map(suggestion => {
                          globalIndex++
                          const idx = globalIndex
                          return (
                            <button
                              key={`product-${suggestion.value}`}
                              type="button"
                              onClick={() => handleSubmit(suggestion)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                idx === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              {suggestion.image ? (
                                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                  <Image
                                    src={suggestion.image}
                                    alt={suggestion.label}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span
                                  className={`block truncate text-sm font-medium ${idx === selectedIndex ? 'text-primary-700' : 'text-gray-900'}`}
                                >
                                  {suggestion.label}
                                </span>
                              </div>
                              {getSuggestionBadge(suggestion)}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Text Suggestions Section */}
                    {texts.length > 0 && (
                      <div className="py-2">
                        {(categories.length > 0 || brands.length > 0 || products.length > 0) && (
                          <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                            Suchvorschläge
                          </div>
                        )}
                        {texts.map(suggestion => {
                          globalIndex++
                          const idx = globalIndex
                          return (
                            <button
                              key={`text-${suggestion.value}`}
                              type="button"
                              onClick={() => handleSubmit(suggestion)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                                idx === selectedIndex
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {suggestion.icon ? (
                                <span className="text-base">{suggestion.icon}</span>
                              ) : (
                                <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              )}
                              <span className="truncate">{suggestion.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
