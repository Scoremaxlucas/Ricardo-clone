'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileActiveFilterChips } from '@/components/search/MobileActiveFilterChips'
import { MobileFilterSheet } from '@/components/search/MobileFilterSheet'
import { MobileSearchControls } from '@/components/search/MobileSearchControls'
import { MobileSortSheet } from '@/components/search/MobileSortSheet'
import { ProductCard } from '@/components/ui/ProductCard'

import { useLanguage } from '@/contexts/LanguageContext'
import { getBrandsForCategory, searchBrands } from '@/data/brands'
import { ChevronDown, Filter, Grid3x3, List, Loader2, Package, X } from 'lucide-react'
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
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>('')
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({})
  const [localMinPrice, setLocalMinPrice] = useState<string>('')
  const [localMaxPrice, setLocalMaxPrice] = useState<string>('')
  const sliderContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Mobile sheet states
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false)

  // Parse URL parameters (no category filter - show all items)
  const urlParams = searchParams

  const minPrice = urlParams?.get('minPrice') || ''
  const maxPrice = urlParams?.get('maxPrice') || ''
  const condition = urlParams?.get('condition') || ''
  const brand = urlParams?.get('brand') || ''
  const isAuction = urlParams?.get('isAuction') || ''
  const postalCode = urlParams?.get('postalCode') || ''
  const sortBy = urlParams?.get('sortBy') || 'relevance'

  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  // Update selectedBrands when brand changes
  useEffect(() => {
    if (brand) {
      setSelectedBrands([brand])
    } else {
      setSelectedBrands([])
    }
  }, [brand])

  // Initialize local price values
  useEffect(() => {
    setLocalMinPrice(minPrice || '0.05')
    setLocalMaxPrice(maxPrice || '1000000')
  }, [minPrice, maxPrice])

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

  // Search function - load all items (no category filter)
  const performSearch = useCallback(async (params: URLSearchParams, signal?: AbortSignal) => {
    setLoading(true)

    try {
      let url = '/api/watches/search'
      const searchParams = new URLSearchParams()

      const min = params.get('minPrice') || ''
      const max = params.get('maxPrice') || ''
      const cond = params.get('condition') || ''
      const br = params.get('brand') || ''
      const auction = params.get('isAuction') || ''
      const plz = params.get('postalCode') || ''
      const sort = params.get('sortBy') || 'relevance'

      // No category or query - show all items
      if (min) searchParams.append('minPrice', min)
      if (max) searchParams.append('maxPrice', max)
      if (cond) searchParams.append('condition', cond)
      if (br) searchParams.append('brand', br)
      if (auction) searchParams.append('isAuction', auction)
      if (plz) searchParams.append('postalCode', plz)
      if (sort) searchParams.append('sortBy', sort)

      if (searchParams.toString()) {
        url += '?' + searchParams.toString()
      }

      const res = await fetch(url, { signal })
      if (signal?.aborted) return

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()

      const watchesData = Array.isArray(data.watches) ? data.watches : []

      if (signal?.aborted) return

      setWatches(watchesData)

      // Load brand counts in background
      const brandCountsParams = new URLSearchParams()
      if (min) brandCountsParams.append('minPrice', min)
      if (max) brandCountsParams.append('maxPrice', max)
      if (cond) brandCountsParams.append('condition', cond)
      if (auction) brandCountsParams.append('isAuction', auction)
      if (plz) brandCountsParams.append('postalCode', plz)

      fetch(`/api/watches/brand-counts?${brandCountsParams.toString()}`, { signal })
        .then(res => {
          if (signal?.aborted) return
          if (res.ok) return res.json()
        })
        .then(data => {
          if (signal?.aborted) return
          if (data?.brandCounts) {
            setBrandCounts(data.brandCounts)
          }
        })
        .catch(error => {
          if (!signal?.aborted) {
            console.error('Error loading brand counts:', error)
            const counts: Record<string, number> = {}
            watchesData.forEach((w: WatchItem) => {
              if (w.brand) {
                counts[w.brand] = (counts[w.brand] || 0) + 1
              }
            })
            setBrandCounts(counts)
          }
        })
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

  // Load available brands
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const allBrands = await searchBrands('')
        setAvailableBrands(allBrands)
      } catch (error) {
        console.error('Error loading brands:', error)
      }
    }
    loadBrands()
  }, [])

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

  const filteredBrands = availableBrands.filter(b =>
    b.toLowerCase().includes(brandSearchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6 md:py-8 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-3 hidden text-sm text-gray-600 sm:block md:mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            {t.search.homepage}
          </Link>
          <span className="mx-2">›</span>
          <span>Alle Kategorien</span>
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

        <div className="flex gap-6">
          {/* Desktop Sidebar Filters - Hidden on mobile */}
          <aside className="hidden w-64 flex-shrink-0 md:block">
            <div className="sticky top-4 space-y-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
                <button
                  onClick={() => {
                    router.push('/categories')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Zurücksetzen
                </button>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">Preis</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={localMinPrice}
                      onChange={e => setLocalMinPrice(e.target.value)}
                      placeholder="Min"
                      aria-label="Mindestpreis"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <input
                      type="number"
                      value={localMaxPrice}
                      onChange={e => setLocalMaxPrice(e.target.value)}
                      placeholder="Max"
                      aria-label="Maximalpreis"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      if (localMinPrice && localMinPrice !== '0.05') {
                        params.set('minPrice', localMinPrice)
                      } else {
                        params.delete('minPrice')
                      }
                      if (localMaxPrice && localMaxPrice !== '1000000') {
                        params.set('maxPrice', localMaxPrice)
                      } else {
                        params.delete('maxPrice')
                      }
                      router.push(`/categories?${params.toString()}`)
                    }}
                    className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    Anwenden
                  </button>
                </div>
              </div>

              {/* Condition Filter */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">Zustand</h3>
                <div className="space-y-2">
                  {['neu', 'wie-neu', 'gebraucht', 'defekt'].map(cond => (
                    <label
                      key={cond}
                      className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="condition"
                        checked={condition === cond}
                        onChange={() => updateFilter('condition', cond)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {cond === 'neu'
                          ? 'Neu'
                          : cond === 'wie-neu'
                            ? 'Wie neu'
                            : cond === 'gebraucht'
                              ? 'Gebraucht'
                              : 'Defekt'}
                      </span>
                    </label>
                  ))}
                  {condition && (
                    <button
                      onClick={() => updateFilter('condition', null)}
                      className="w-full text-left text-sm text-primary-600 hover:text-primary-700"
                    >
                      Alle anzeigen
                    </button>
                  )}
                </div>
              </div>

              {/* Brand Filter */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">Marke</h3>
                <div className="mb-2">
                  <input
                    type="text"
                    value={brandSearchQuery}
                    onChange={e => setBrandSearchQuery(e.target.value)}
                    placeholder="Marke suchen..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {filteredBrands.slice(0, 50).map(b => {
                    const count = brandCounts[b] || 0
                    const isSelected = selectedBrands.includes(b)
                    return (
                      <label
                        key={b}
                        className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newBrands = isSelected
                              ? selectedBrands.filter(brand => brand !== b)
                              : [...selectedBrands, b]
                            setSelectedBrands(newBrands)
                            updateFilter('brand', newBrands.length > 0 ? newBrands[0] : null)
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="flex-1 text-sm text-gray-700">{b}</span>
                        {count > 0 && <span className="text-xs text-gray-500">{count}</span>}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Auction Filter */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">Angebotsart</h3>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isAuction === 'true'}
                      onChange={e => updateFilter('isAuction', e.target.checked ? 'true' : null)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Nur Auktionen</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
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
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenFilter(null)}
                      />
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

            {/* Active Filters Chips - Desktop */}
            {(minPrice || maxPrice || condition || brand || isAuction || postalCode) && (
              <div className="mb-4 hidden flex-wrap items-center gap-2 md:flex">
                <span className="text-sm font-medium text-gray-700">Aktive Filter:</span>
                {minPrice && minPrice !== '0.05' && (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800">
                    <span>Min: CHF {parseInt(minPrice).toLocaleString('de-CH')}</span>
                    <button
                      onClick={() => updateFilter('minPrice', null)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary-200"
                      aria-label="Filter entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {maxPrice && maxPrice !== '1000000' && (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800">
                    <span>Max: CHF {parseInt(maxPrice).toLocaleString('de-CH')}</span>
                    <button
                      onClick={() => updateFilter('maxPrice', null)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary-200"
                      aria-label="Filter entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {condition && (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800">
                    <span>
                      Zustand:{' '}
                      {condition === 'neu'
                        ? 'Neu'
                        : condition === 'wie-neu'
                          ? 'Wie neu'
                          : condition === 'gebraucht'
                            ? 'Gebraucht'
                            : 'Defekt'}
                    </span>
                    <button
                      onClick={() => updateFilter('condition', null)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary-200"
                      aria-label="Filter entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {brand && (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800">
                    <span>Marke: {brand}</span>
                    <button
                      onClick={() => updateFilter('brand', null)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary-200"
                      aria-label="Filter entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {isAuction === 'true' && (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800">
                    <span>Nur Auktionen</span>
                    <button
                      onClick={() => updateFilter('isAuction', null)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary-200"
                      aria-label="Filter entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => router.push('/categories')}
                  className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary-500 hover:bg-gray-50 hover:text-primary-600"
                >
                  Alle zurücksetzen
                </button>
              </div>
            )}

            {/* Results */}
            {loading ? (
              // Loading state - skeleton grid
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-lg bg-gray-200 md:h-80"
                  />
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
                  Versuchen Sie es mit anderen Filtern.
                </p>
                <button
                  onClick={() => router.push('/categories')}
                  className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 md:text-base"
                >
                  Filter zurücksetzen
                </button>
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
        </div>
      </div>
      <Footer />

      {/* Mobile Sheets */}
      <MobileFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        availableBrands={availableBrands}
        brandCounts={brandCounts}
      />
      <MobileSortSheet isOpen={isSortSheetOpen} onClose={() => setIsSortSheetOpen(false)} />
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
        <Footer />
      </div>
    }>
      <CategoriesPageContent />
    </Suspense>
  )
}
