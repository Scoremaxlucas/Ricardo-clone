'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronDown, Filter, Grid3x3, List } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

interface MobileSearchControlsProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onFilterOpen: () => void
  onSortOpen: () => void
  resultsCount: number
  loading: boolean
}

export function MobileSearchControls({
  viewMode,
  onViewModeChange,
  onFilterOpen,
  onSortOpen,
  resultsCount,
  loading,
}: MobileSearchControlsProps) {
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchParams?.get('minPrice') || searchParams?.get('maxPrice')) count++
    if (searchParams?.get('condition')) count++
    if (searchParams?.get('brand')) count++
    if (searchParams?.get('isAuction')) count++
    if (searchParams?.get('postalCode')) count++
    return count
  }, [searchParams])

  // Get current sort label
  const sortBy = searchParams?.get('sortBy') || 'relevance'
  const sortLabel = useMemo(() => {
    switch (sortBy) {
      case 'relevance':
        return t.search.sortRelevance
      case 'ending':
        return t.search.sortEnding
      case 'newest':
        return t.search.sortNewest
      case 'price-low':
        return t.search.sortPriceLow
      case 'price-high':
        return t.search.sortPriceHigh
      case 'bids':
        return t.search.sortBids
      default:
        return t.search.sortRelevance
    }
  }, [sortBy, t])

  return (
    <div className="sticky top-0 z-40 border-b border-gray-200 bg-white md:hidden">
      {/* Results count */}
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        <span className="font-medium text-gray-900">
          {loading ? (
            <span className="text-gray-500">{t.search.loading}</span>
          ) : (() => {
            const query = searchParams?.get('q') || ''
            if (query) {
              return (
                <>
                  {resultsCount} {resultsCount === 1 ? 'Ergebnis' : 'Ergebnisse'} für{' '}
                  <span className="text-primary-600">&quot;{query}&quot;</span>
                </>
              )
            }
            return `${resultsCount} ${resultsCount === 1 ? 'Resultat' : 'Resultate'}`
          })()}
        </span>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {/* Filter button */}
        <button
          type="button"
          onClick={onFilterOpen}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
          aria-label={`Filter öffnen${activeFilterCount > 0 ? `, ${activeFilterCount} aktiv` : ''}`}
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort button */}
        <button
          type="button"
          onClick={onSortOpen}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
          aria-label="Sortierung ändern"
        >
          <span className="truncate">{sortLabel}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </button>

        {/* View toggle */}
        <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`flex h-9 w-9 items-center justify-center rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            aria-label="Rasteransicht"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex h-9 w-9 items-center justify-center rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            aria-label="Listenansicht"
            aria-pressed={viewMode === 'list'}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
