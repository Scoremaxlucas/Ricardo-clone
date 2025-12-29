'use client'

import { Search } from 'lucide-react'
import { Suspense } from 'react'

interface HeaderSearchProps {
  isHeroVisible?: boolean
  onMobileSearchOpen?: () => void
  onDesktopSearchOpen?: () => void
}

/**
 * HeaderSearch - Search trigger in the header
 *
 * Features:
 * - Desktop (lg+): Shows a search trigger button that opens overlay
 * - Mobile: Icon that triggers mobile overlay (handled by parent)
 * - Keyboard shortcut: Cmd/Ctrl+K handled by parent
 */
function HeaderSearchContent({
  onMobileSearchOpen,
  onDesktopSearchOpen,
}: HeaderSearchProps) {
  return (
    <>
      {/* Desktop Search Trigger - Only visible on lg+ */}
      <button
        type="button"
        onClick={onDesktopSearchOpen}
        className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition-all duration-200 hover:border-primary-300 hover:bg-gray-50 hover:text-primary-600 lg:flex"
        aria-label="Suche öffnen"
        title="Suche (⌘K oder Strg+K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden xl:inline">Suchen…</span>
      </button>

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

// Wrapper with Suspense boundary
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
