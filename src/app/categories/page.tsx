'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileActiveFilterChips } from '@/components/search/MobileActiveFilterChips'
import { MobileFilterSheet } from '@/components/search/MobileFilterSheet'
import { MobileSearchControls } from '@/components/search/MobileSearchControls'
import { MobileSortSheet } from '@/components/search/MobileSortSheet'
import { ProductCard } from '@/components/ui/ProductCard'

import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronDown, Grid3x3, List, Loader2, Package } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

interface WatchItem {
  id: string
  title: string
  brand?: string
  model?: string
  price: number
  images: string[]
  createdAt: string
  condition?: string
  city?: string
  postalCode?: string
  auctionEnd?: string
  buyNowPrice?: number
  isAuction?: boolean
  bids?: any[]
  boosters?: string[]
}

function CategoriesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [watches, setWatches] = useState<WatchItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  // Mobile sheet states
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false)

  // Parse URL parameters (no filters - show all items)
  const sortBy = searchParams?.get('sortBy') || 'relevance'

  // Load favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch('/api/favorites', {
          cache: 'force-cache',
        })
        if (response.ok) {
          const data = await response.json()
          setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }
    fetchFavorites()
  }, [])

  const toggleFavorite = async (watchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const method = favorites.has(watchId) ? 'DELETE' : 'POST'
      const response = await fetch(`/api/favorites/${watchId}`, { method })

      if (response.ok) {
        setFavorites(prev => {
          const newSet = new Set(prev)
          if (favorites.has(watchId)) {
            newSet.delete(watchId)
          } else {
            newSet.add(watchId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  // Search function - load all items (no filters)
  const performSearch = useCallback(async (params: URLSearchParams, signal?: AbortSignal) => {
    setLoading(true)

    try {
      let url = '/api/watches/search'
      const searchParams = new URLSearchParams()

      const sort = params.get('sortBy') || 'relevance'
      if (sort) searchParams.append('sortBy', sort)

      if (searchParams.toString()) {
        url += '?' + searchParams.toString()
      }

      // CRITICAL: cache: 'no-store' ensures freshly published listings appear immediately
      const res = await fetch(url, { signal, cache: 'no-store' })
      if (signal?.aborted) return

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()

      const watchesData = Array.isArray(data.watches) ? data.watches : []

      if (signal?.aborted) return

      setWatches(watchesData)
    } catch (error) {
      if (!signal?.aborted) {
        console.error('Search error:', error)
        setWatches([])
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  // Perform search when URL params change
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const params = new URLSearchParams(searchParams.toString())
    performSearch(params, abortControllerRef.current.signal)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [searchParams, performSearch])

  const abortControllerRef = useRef<AbortController | null>(null)

  // Filter handlers
  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/categories?${params.toString()}`)
    },
    [searchParams, router]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Desktop Filter Chips - Hidden on mobile */}
      <div className="hidden md:block">
        <Suspense fallback={null}>{/* No filter chips - show all items */}</Suspense>
      </div>

      {/* Mobile Controls - Sticky */}
      <MobileSearchControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFilterOpen={() => setIsFilterSheetOpen(true)}
        onSortOpen={() => setIsSortSheetOpen(true)}
        resultsCount={watches.length}
        loading={loading}
      />

      {/* Mobile Active Filter Chips */}
      <MobileActiveFilterChips />

      <main className="flex-1 pb-8">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-4 md:py-8">
          {/* Breadcrumb - Desktop only */}
          <div className="mb-4 hidden text-sm text-gray-600 md:block">
            <Link href="/" className="text-primary-600 hover:text-primary-700">
              {t.search.homepage}
            </Link>
            <span className="mx-2">›</span>
            <span>Alle Kategorien</span>
          </div>

          {/* Desktop Results Header - Hidden on mobile */}
          <div className="mb-6 hidden items-center justify-between md:flex">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
                {loading ? t.search.loading : `${watches.length} ${t.search.results}`}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Sortierung */}
              <div className="relative">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setOpenFilter(openFilter === 'sort' ? null : 'sort')
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 transition-colors hover:border-primary-500"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {t.search.sortBy}:{' '}
                    {sortBy === 'relevance'
                      ? t.search.sortRelevance
                      : sortBy === 'ending'
                        ? t.search.sortEnding
                        : sortBy === 'newest'
                          ? t.search.sortNewest
                          : sortBy === 'price-low'
                            ? t.search.sortPriceLow
                            : sortBy === 'price-high'
                              ? t.search.sortPriceHigh
                              : t.search.sortBids}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openFilter === 'sort' ? 'rotate-180' : ''}`}
                  />
                </button>

                {openFilter === 'sort' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                      {[
                        { value: 'relevance', label: t.search.sortRelevance },
                        { value: 'newest', label: t.search.sortNewest },
                        { value: 'price-low', label: t.search.sortPriceLow },
                        { value: 'price-high', label: t.search.sortPriceHigh },
                        { value: 'ending', label: t.search.sortEnding },
                        { value: 'bids', label: t.search.sortBids },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateFilter('sortBy', option.value)
                            setOpenFilter(null)
                          }}
                          className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                            sortBy === option.value
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  aria-label="Gitteransicht"
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  aria-label="Listenansicht"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            // Loading state - skeleton grid
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200 md:h-80" />
              ))}
            </div>
          ) : watches.length === 0 ? (
            // Empty state
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center md:p-12">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300 md:h-16 md:w-16" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900 md:text-xl">
                {t.search.noResults}
              </h2>
              <p className="mb-6 text-sm text-gray-600 md:text-base">
                Aktuell sind keine Artikel verfügbar.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid view
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {watches.map(w => (
                <ProductCard
                  key={w.id}
                  product={{
                    id: w.id,
                    title: w.title,
                    brand: w.brand,
                    price: w.price,
                    images: w.images,
                    city: w.city,
                    postalCode: w.postalCode,
                    auctionEnd: w.auctionEnd,
                    buyNowPrice: w.buyNowPrice,
                    isAuction: w.isAuction,
                    bids: w.bids,
                    boosters: w.boosters,
                  }}
                  onFavoriteToggle={(id, isFavorite) => {
                    setFavorites(prev => {
                      const newSet = new Set(prev)
                      if (isFavorite) {
                        newSet.add(id)
                      } else {
                        newSet.delete(id)
                      }
                      return newSet
                    })
                  }}
                />
              ))}
            </div>
          ) : (
            // List view
            <div className="space-y-3">
              {watches.map(w => (
                <ProductCard
                  key={w.id}
                  id={w.id}
                  title={w.title}
                  brand={w.brand}
                  price={w.price}
                  images={w.images}
                  city={w.city}
                  postalCode={w.postalCode}
                  auctionEnd={w.auctionEnd}
                  buyNowPrice={w.buyNowPrice}
                  isAuction={w.isAuction}
                  bids={w.bids}
                  boosters={w.boosters}
                  variant="list"
                  showBuyNowButton={true}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Mobile Sheets */}
      <MobileFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        availableBrands={[]}
        brandCounts={{}}
      />
      <MobileSortSheet isOpen={isSortSheetOpen} onClose={() => setIsSortSheetOpen(false)} />
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
          <Footer />
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  )
}
