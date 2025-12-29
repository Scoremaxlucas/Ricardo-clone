'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

interface HeaderSearchProps {
  isHeroVisible?: boolean
  onMobileSearchOpen?: () => void
}

/**
 * HeaderSearch - Persistent search input in the header
 *
 * Features:
 * - Desktop: Full input on non-home pages, collapsed on homepage when hero visible
 * - Mobile: Icon that triggers overlay (handled by parent)
 * - URL-driven: reads query from URL, updates URL on submit
 * - Keyboard shortcut: "/" focuses search on desktop
 */
function HeaderSearchContent({ isHeroVisible = true, onMobileSearchOpen }: HeaderSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current query from URL
  const currentQuery = searchParams?.get('q') || ''
  const [inputValue, setInputValue] = useState(currentQuery)
  const [isExpanded, setIsExpanded] = useState(false)

  // Determine if we're on the homepage
  const isHomepage = pathname === '/'

  // Determine if search should be shown expanded
  // - Always expanded on non-home pages
  // - Expanded on homepage when hero is not visible or user clicked to expand
  const shouldShowExpanded = !isHomepage || !isHeroVisible || isExpanded

  // Sync input value with URL query param
  useEffect(() => {
    setInputValue(currentQuery)
  }, [currentQuery])

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only on desktop, and not when typing in an input
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName)
      ) {
        e.preventDefault()
        if (isHomepage && isHeroVisible) {
          setIsExpanded(true)
        }
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isHomepage, isHeroVisible])

  // Handle search submit
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmed = inputValue.trim()
      if (!trimmed) return

      // Build URL with existing category params if present
      const params = new URLSearchParams()
      params.set('q', trimmed)

      // Preserve category and subcategory if on search page
      const category = searchParams?.get('category')
      const subcategory = searchParams?.get('subcategory')
      if (category) params.set('category', category)
      if (subcategory) params.set('subcategory', subcategory)

      router.push(`/search?${params.toString()}`)
      inputRef.current?.blur()
      setIsExpanded(false)
    },
    [inputValue, searchParams, router]
  )

  // Handle expand click on homepage
  const handleExpandClick = useCallback(() => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // Handle blur - collapse on homepage if empty
  const handleBlur = useCallback(() => {
    if (isHomepage && !inputValue.trim()) {
      // Delay to allow click events to fire
      setTimeout(() => setIsExpanded(false), 200)
    }
  }, [isHomepage, inputValue])

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('')
    inputRef.current?.focus()
  }, [])

  return (
    <>
      {/* Desktop Search */}
      <div className="hidden md:block">
        {shouldShowExpanded ? (
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onBlur={handleBlur}
                placeholder="Suchen..."
                aria-label="Suche"
                className="h-10 w-64 rounded-full border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-500 hover:border-gray-300 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 lg:w-80 xl:w-96"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  aria-label="Suche löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        ) : (
          // Collapsed state on homepage - just an icon button
          <button
            type="button"
            onClick={handleExpandClick}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-primary-600"
            aria-label="Suche öffnen"
            title="Suche (Tastenkürzel: /)"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mobile Search Icon */}
      <button
        type="button"
        onClick={onMobileSearchOpen}
        className="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 md:hidden"
        aria-label="Suche öffnen"
      >
        <Search className="h-5 w-5" />
      </button>
    </>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export function HeaderSearch(props: HeaderSearchProps) {
  return (
    <Suspense
      fallback={
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600"
          aria-label="Suche"
        >
          <Search className="h-5 w-5" />
        </button>
      }
    >
      <HeaderSearchContent {...props} />
    </Suspense>
  )
}
