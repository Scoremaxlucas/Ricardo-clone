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
function HeaderSearchContent({ onMobileSearchOpen, onDesktopSearchOpen }: HeaderSearchProps) {
  return (
    <>
      {/* Desktop Search Trigger - Visible on md+ (desktop header) */}
      <button
        type="button"
        onClick={onDesktopSearchOpen}
        className="hidden w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm transition-all duration-200 hover:border-primary-300 hover:bg-gray-50 hover:text-primary-600 md:flex lg:px-4"
        aria-label="Suche öffnen"
        title="Suche (⌘K oder Strg+K)"
      >
        <Search className="h-4 w-4 flex-none" />
        <span className="hidden truncate lg:inline">Suchen…</span>
        <kbd className="ml-auto hidden rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 xl:inline">
          ⌘K
        </kbd>
      </button>

      {/* Mobile Search Icon - Only visible below md */}
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
