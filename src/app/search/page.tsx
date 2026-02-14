'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { AISearchAssistant } from '@/components/search/AISearchAssistant'
import { MobileActiveFilterChips } from '@/components/search/MobileActiveFilterChips'
import { MobileFilterSheet } from '@/components/search/MobileFilterSheet'
import { MobileSearchControls } from '@/components/search/MobileSearchControls'
import { MobileSortSheet } from '@/components/search/MobileSortSheet'
import { FilterChips } from '@/components/ui/FilterChips'
import { ProductCard } from '@/components/ui/ProductCard'
import { SearchResultsSkeleton } from '@/components/ui/Skeleton'

import { useLanguage } from '@/contexts/LanguageContext'
import { getBrandsForCategory, searchBrands } from '@/data/brands'
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Package, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

const RESULTS_PER_PAGE = 36

// Ricardo-style pagination with numbered page buttons
function PaginationControls({
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalResults: number
  onPageChange: (page: number) => void
}) {
  // Build page number array with ellipsis like Ricardo:
  // [1] ... [4] [5] [6] [7] [8] ... [20]
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 7 // Max number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Always show first page
      pages.push(1)

      // Calculate the range around current page
      let rangeStart = Math.max(2, currentPage - 2)
      let rangeEnd = Math.min(totalPages - 1, currentPage + 2)

      // Adjust range to always show ~5 middle pages
      if (currentPage <= 4) {
        rangeStart = 2
        rangeEnd = Math.min(6, totalPages - 1)
      } else if (currentPage >= totalPages - 3) {
        rangeStart = Math.max(2, totalPages - 5)
        rangeEnd = totalPages - 1
      }

      // Add left ellipsis
      if (rangeStart > 2) {
        pages.push('ellipsis')
      }

      // Add range pages
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i)
      }

      // Add right ellipsis
      if (rangeEnd < totalPages - 1) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()
  const startItem = (currentPage - 1) * RESULTS_PER_PAGE + 1
  const endItem = Math.min(currentPage * RESULTS_PER_PAGE, totalResults)

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      {/* Result range info */}
      <p className="text-sm text-gray-500">
        {startItem}–{endItem} von {totalResults.toLocaleString('de-CH')} Ergebnissen
      </p>

      {/* Page buttons */}
      <nav className="flex items-center gap-1" aria-label="Seitennavigation">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-600"
          aria-label="Vorherige Seite"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 w-10 items-center justify-center text-sm text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600'
              }`}
              aria-label={`Seite ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-600"
          aria-label="Nächste Seite"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}

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

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    document.title = 'Suche — Helvenda.ch'
  }, [])
  const { t, translateSubcategory } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [watches, setWatches] = useState<WatchItem[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>('')
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({})
  const [localMinPrice, setLocalMinPrice] = useState<string>('')
  const [localMaxPrice, setLocalMaxPrice] = useState<string>('')
  const [didYouMean, setDidYouMean] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState<number>(0)
  const sliderContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Mobile sheet states
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false)

  // Parse URL parameters
  const urlParams = searchParams

  const query = (urlParams?.get('q') || '').trim()
  const category = (urlParams?.get('category') || '').trim()
  const subcategory = (urlParams?.get('subcategory') || '').trim()
  const minPrice = urlParams?.get('minPrice') || ''
  const maxPrice = urlParams?.get('maxPrice') || ''
  const condition = urlParams?.get('condition') || ''
  const brand = urlParams?.get('brand') || '' // Legacy single brand
  const brandsParam = urlParams?.get('brands') || '' // New: comma-separated brands
  const isAuction = urlParams?.get('isAuction') || ''
  const postalCode = urlParams?.get('postalCode') || ''
  const sortBy = urlParams?.get('sortBy') || 'relevance'
  const pageParam = parseInt(urlParams?.get('page') || '1', 10)
  const currentPage = Math.max(1, isNaN(pageParam) ? 1 : pageParam)

  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  // Update selectedBrands when brands parameter changes
  useEffect(() => {
    if (brandsParam) {
      // New: comma-separated brands
      setSelectedBrands(brandsParam.split(',').map(b => b.trim()).filter(Boolean))
    } else if (brand) {
      // Legacy: single brand
      setSelectedBrands([brand])
    } else {
      setSelectedBrands([])
    }
  }, [brandsParam, brand])

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

  // Search function
  const performSearch = useCallback(async (params: URLSearchParams, signal?: AbortSignal) => {
    setLoading(true)

    try {
      let url = '/api/watches/search'
      const searchParams = new URLSearchParams()

      const q = (params.get('q') || '').trim()
      const cat = (params.get('category') || '').trim()
      const subcat = (params.get('subcategory') || '').trim()
      const min = params.get('minPrice') || ''
      const max = params.get('maxPrice') || ''
      const cond = params.get('condition') || ''
      const br = params.get('brand') || '' // Legacy single brand
      const brs = params.get('brands') || '' // New: comma-separated brands
      const auction = params.get('isAuction') || ''
      const plz = params.get('postalCode') || ''
      const sort = params.get('sortBy') || 'relevance'

      if (q) searchParams.append('q', q)
      if (cat) searchParams.append('category', cat)
      if (subcat) searchParams.append('subcategory', subcat)
      if (min) searchParams.append('minPrice', min)
      if (max) searchParams.append('maxPrice', max)
      if (cond) searchParams.append('condition', cond)
      // Support multiple brands (comma-separated)
      if (brs) {
        searchParams.append('brands', brs)
      } else if (br) {
        searchParams.append('brand', br)
      }
      if (auction) searchParams.append('isAuction', auction)
      if (plz) searchParams.append('postalCode', plz)
      if (sort) searchParams.append('sortBy', sort)

      // Pagination
      const page = parseInt(params.get('page') || '1', 10) || 1
      const limit = RESULTS_PER_PAGE
      const offset = (page - 1) * limit
      searchParams.append('limit', String(limit))
      searchParams.append('offset', String(offset))

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
      setTotalResults(data.total || watchesData.length)

      // Set "Did you mean?" suggestion if provided
      if (data.didYouMean && data.didYouMean !== q.toLowerCase()) {
        setDidYouMean(data.didYouMean)
      } else {
        setDidYouMean(null)
      }

      // Load brand counts in background
      const brandCountsParams = new URLSearchParams()
      if (cat) brandCountsParams.append('category', cat)
      if (subcat) brandCountsParams.append('subcategory', subcat)
      if (min) brandCountsParams.append('minPrice', min)
      if (max) brandCountsParams.append('maxPrice', max)
      if (cond) brandCountsParams.append('condition', cond)
      if (auction) brandCountsParams.append('isAuction', auction)
      if (plz) brandCountsParams.append('postalCode', plz)
      if (q) brandCountsParams.append('q', q)

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

      // Extract available brands
      const brands = Array.from(
        new Set(watchesData.map((w: WatchItem) => w.brand).filter(Boolean))
      ).sort() as string[]

      if (cat) {
        const categoryBrands = getBrandsForCategory(cat)
        const allAvailableBrands = Array.from(new Set([...brands, ...categoryBrands])).sort()
        setAvailableBrands(allAvailableBrands)
      } else {
        setAvailableBrands(brands)
      }
    } catch (error) {
      if (!signal?.aborted) {
        console.error('Error fetching watches:', error)
        setWatches([])
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  // Immediate search on params change
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    performSearch(searchParams, abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [searchParams, performSearch])

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value && value.trim() !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      // Reset to page 1 when filters change
      if (key !== 'page') {
        params.delete('page')
      }

      const newUrl = `/search?${params.toString()}`
      router.replace(newUrl)
    },
    [searchParams, router]
  )

  const applyBrandFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedBrands.length > 0) {
      // Use 'brands' parameter with comma-separated values for multiple brands
      params.set('brands', selectedBrands.join(','))
      params.delete('brand') // Remove legacy single brand param
    } else {
      params.delete('brands')
      params.delete('brand')
    }

    // Reset to page 1 when brand filter changes
    params.delete('page')

    const newUrl = `/search?${params.toString()}`
    router.replace(newUrl)
  }, [selectedBrands, searchParams, router])

  // Navigate to a specific page
  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (page <= 1) {
        params.delete('page')
      } else {
        params.set('page', String(page))
      }
      const newUrl = `/search?${params.toString()}`
      router.push(newUrl)
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [searchParams, router]
  )

  const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE))

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brandName)) {
        return prev.filter(b => b !== brandName)
      } else {
        return [...prev, brandName]
      }
    })
  }

  const removeFilter = (key: string) => {
    updateFilter(key, '')
  }

  const applyPriceFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (localMinPrice && localMinPrice !== '0.05' && localMinPrice.trim() !== '') {
      params.set('minPrice', localMinPrice)
    } else {
      params.delete('minPrice')
    }

    if (localMaxPrice && localMaxPrice !== '1000000' && localMaxPrice.trim() !== '') {
      params.set('maxPrice', localMaxPrice)
    } else {
      params.delete('maxPrice')
    }

    // Reset to page 1 when price filter changes
    params.delete('page')

    const newUrl = `/search?${params.toString()}`
    router.replace(newUrl)
  }, [localMinPrice, localMaxPrice, searchParams, router])

  const handleSortChange = useCallback(
    (newSort: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('sortBy', newSort)
      // Reset to page 1 when sort changes
      params.delete('page')

      const newUrl = `/search?${params.toString()}`
      router.replace(newUrl)
    },
    [searchParams, router]
  )

  // Close filter dropdowns on outside click (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
        setOpenFilter(null)
      }
    }

    if (openFilter) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openFilter])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      {/* Desktop Filter Chips */}
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <FilterChips />
        </Suspense>
      </div>

      {/* Mobile Controls - Sticky */}
      <MobileSearchControls
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
            {category ? (
              <>
                <Link href="/search" className="text-primary-600 hover:text-primary-700">
                  {t.search.title}
                </Link>
                <span className="mx-2">›</span>
                <span className="capitalize">
                  {t.categories[category as keyof typeof t.categories] ||
                    category.replace(/-/g, ' ')}
                </span>
                {subcategory && (
                  <>
                    <span className="mx-2">›</span>
                    <span>{translateSubcategory(subcategory)}</span>
                  </>
                )}
              </>
            ) : (
              <span>{t.search.title}</span>
            )}
          </div>

          {/* Desktop Filter Bar - Hidden on mobile */}
          <div className="mb-6 hidden rounded-lg border border-gray-200 bg-white p-4 md:block">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">{t.search.filters}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {/* Preis Filter */}
              <div className="relative">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setOpenFilter(openFilter === 'price' ? null : 'price')
                  }}
                  className="filter-button flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:border-primary-500"
                >
                  <span className="text-sm font-medium text-gray-700">{t.search.price}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'price' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFilter === 'price' && (
                  <div
                    className="filter-dropdown absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      <div className="price-filter-container" ref={sliderContainerRef}>
                        <label className="mb-3 block text-sm font-medium text-gray-700">
                          {t.search.price}: CHF{' '}
                          {parseFloat(localMinPrice || '0.05').toLocaleString('de-CH')} - CHF{' '}
                          {parseFloat(localMaxPrice || '1000000').toLocaleString('de-CH')}
                        </label>
                        <div className="relative h-12">
                          <div className="absolute left-0 right-0 top-5 h-2 rounded-lg bg-gray-200"></div>
                          <div
                            className="pointer-events-none absolute top-5 h-2 rounded-lg bg-primary-600"
                            style={{
                              left: `${(parseFloat(localMinPrice || '0.05') / 1000000) * 100}%`,
                              width: `${Math.max(0, ((parseFloat(localMaxPrice || '1000000') - parseFloat(localMinPrice || '0.05')) / 1000000) * 100)}%`,
                            }}
                          />
                          <input
                            type="range"
                            min="0.05"
                            max="1000000"
                            step="100"
                            value={localMinPrice || '0.05'}
                            onChange={e => {
                              const val = e.target.value
                              const minVal = parseFloat(val)
                              const maxVal = parseFloat(localMaxPrice || '1000000')
                              const newMin =
                                minVal < maxVal
                                  ? Math.min(minVal, maxVal - 0.05)
                                  : Math.max(0.05, maxVal - 0.05)
                              setLocalMinPrice(newMin.toString())
                            }}
                            className="absolute top-0 z-20 h-12 w-full cursor-pointer appearance-none bg-transparent"
                            style={{ pointerEvents: 'none' }}
                            aria-label="Mindestpreis"
                          />
                          <input
                            type="range"
                            min="0.05"
                            max="1000000"
                            step="100"
                            value={localMaxPrice || '1000000'}
                            onChange={e => {
                              const val = e.target.value
                              const minVal = parseFloat(localMinPrice || '0.05')
                              const maxVal = parseFloat(val)
                              const newMax =
                                maxVal > minVal
                                  ? Math.max(maxVal, minVal + 0.05)
                                  : Math.min(1000000, minVal + 0.05)
                              setLocalMaxPrice(newMax.toString())
                            }}
                            className="absolute top-0 z-30 h-12 w-full cursor-pointer appearance-none bg-transparent"
                            style={{ pointerEvents: 'none' }}
                            aria-label="Maximalpreis"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Min. (CHF)
                          </label>
                          <input
                            type="number"
                            min="0.05"
                            step="0.05"
                            value={localMinPrice}
                            onChange={e => setLocalMinPrice(e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                            placeholder="0.05"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Max. (CHF)
                          </label>
                          <input
                            type="number"
                            min="0.05"
                            step="0.05"
                            value={localMaxPrice}
                            onChange={e => setLocalMaxPrice(e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                            placeholder="1'000'000"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const hasCustomPrice =
                            (localMinPrice && localMinPrice !== '0.05') ||
                            (localMaxPrice && localMaxPrice !== '1000000')
                          if (hasCustomPrice) {
                            applyPriceFilter()
                          }
                          setOpenFilter(null)
                        }}
                        className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                          (localMinPrice && localMinPrice !== '0.05') ||
                          (localMaxPrice && localMaxPrice !== '1000000')
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {(localMinPrice && localMinPrice !== '0.05') ||
                        (localMaxPrice && localMaxPrice !== '1000000')
                          ? t.search.showResults
                          : t.search.close}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Zustand Filter */}
              <div className="relative">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setOpenFilter(openFilter === 'condition' ? null : 'condition')
                  }}
                  className="filter-button flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:border-primary-500"
                >
                  <span className="text-sm font-medium text-gray-700">{t.search.condition}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'condition' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFilter === 'condition' && (
                  <div
                    className="filter-dropdown absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      {[
                        { value: 'neu', label: t.search.conditionNew },
                        { value: 'wie-neu', label: t.search.conditionLikeNew },
                        { value: 'sehr-gut', label: t.search.conditionVeryGood },
                        { value: 'gut', label: t.search.conditionGood },
                        { value: 'gebraucht', label: t.search.conditionUsed },
                      ].map(cond => (
                        <label
                          key={cond.value}
                          className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="condition"
                            value={cond.value}
                            checked={condition === cond.value}
                            onChange={() => updateFilter('condition', cond.value)}
                            className="text-primary-600"
                          />
                          <span className="text-sm text-gray-700">{cond.label}</span>
                        </label>
                      ))}
                      <button
                        onClick={() => {
                          removeFilter('condition')
                          setOpenFilter(null)
                        }}
                        className="mt-2 w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        {t.search.reset}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Marke Filter */}
              <div className="relative">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setOpenFilter(openFilter === 'brand' ? null : 'brand')
                  }}
                  className={`filter-button flex w-full items-center justify-between rounded-lg border px-4 py-2 transition-colors ${
                    selectedBrands.length > 0
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{t.search.brand}</span>
                    {selectedBrands.length > 0 && (
                      <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {selectedBrands.length}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'brand' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFilter === 'brand' && (
                  <div
                    className="filter-dropdown absolute left-0 top-full z-50 mt-2 flex max-h-96 w-80 flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                      <input
                        type="text"
                        placeholder={t.search.searchBrand}
                        value={brandSearchQuery}
                        onChange={e => setBrandSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-8 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                      {brandSearchQuery && (
                        <button
                          onClick={() => setBrandSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                          aria-label="Suche löschen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {(brandSearchQuery
                        ? (() => {
                            try {
                              return searchBrands(brandSearchQuery, category)
                            } catch {
                              return availableBrands.filter(b =>
                                b.toLowerCase().includes(brandSearchQuery.toLowerCase())
                              )
                            }
                          })()
                        : availableBrands
                      )
                        .slice(0, 100)
                        .map(b => {
                          const count = brandCounts[b] || 0
                          const isSelected = selectedBrands.includes(b)
                          return (
                            <label
                              key={b}
                              className="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-gray-50"
                            >
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleBrand(b)}
                                  className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">{b}</span>
                              </div>
                              {count > 0 && (
                                <span className="ml-2 text-xs text-gray-500">{count}</span>
                              )}
                            </label>
                          )
                        })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {selectedBrands.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedBrands([])
                          }}
                          className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          Alle entfernen
                        </button>
                      )}
                      <button
                        onClick={() => {
                          applyBrandFilter()
                          setOpenFilter(null)
                        }}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                          selectedBrands.length > 0
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedBrands.length > 0
                          ? `${selectedBrands.length} ${selectedBrands.length === 1 ? 'Marke' : 'Marken'} anwenden`
                          : 'Schließen'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Angebotsart Filter */}
              <div className="relative">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setOpenFilter(openFilter === 'offerType' ? null : 'offerType')
                  }}
                  className="filter-button flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:border-primary-500"
                >
                  <span className="text-sm font-medium text-gray-700">{t.search.offerType}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'offerType' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFilter === 'offerType' && (
                  <div
                    className="filter-dropdown absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <label className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50">
                        <input
                          type="radio"
                          name="offerType"
                          value=""
                          checked={isAuction === ''}
                          onChange={() => updateFilter('isAuction', '')}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">{t.search.all}</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50">
                        <input
                          type="radio"
                          name="offerType"
                          value="true"
                          checked={isAuction === 'true'}
                          onChange={() => updateFilter('isAuction', 'true')}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">{t.search.auction}</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50">
                        <input
                          type="radio"
                          name="offerType"
                          value="false"
                          checked={isAuction === 'false'}
                          onChange={() => updateFilter('isAuction', 'false')}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">{t.search.buyNow}</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Standort Filter */}
              <div className="relative">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setOpenFilter(openFilter === 'location' ? null : 'location')
                  }}
                  className="filter-button flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:border-primary-500"
                >
                  <span className="text-sm font-medium text-gray-700">{t.search.location}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'location' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFilter === 'location' && (
                  <div
                    className="filter-dropdown absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          {t.search.postalCode}
                        </label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={e => {
                            const params = new URLSearchParams(searchParams.toString())
                            if (e.target.value) params.set('postalCode', e.target.value)
                            else params.delete('postalCode')
                            router.replace(`/search?${params.toString()}`)
                          }}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 8001"
                          maxLength={10}
                        />
                      </div>
                      <button
                        onClick={() => setOpenFilter(null)}
                        className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                      >
                        Schließen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* "Did you mean?" Suggestion - Ricardo Style */}
          {didYouMean && !loading && query && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-amber-800">
                <Search className="h-5 w-5" />
                <span>
                  Meinten Sie:{' '}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('q', didYouMean)
                      router.push(`/search?${params.toString()}`)
                    }}
                    className="font-semibold text-primary-600 underline hover:text-primary-700"
                  >
                    &quot;{didYouMean}&quot;
                  </button>
                  ?
                </span>
              </p>
            </div>
          )}

          {/* Desktop Results Header - Hidden on mobile */}
          <div className="mb-6 hidden items-center justify-between md:flex">
            <div className="flex items-center gap-4">
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 md:text-4xl">
                {loading ? (
                  t.search.loading
                ) : query ? (
                  <>
                    {totalResults} {totalResults === 1 ? 'Ergebnis' : 'Ergebnisse'} für{' '}
                    <span className="flex items-center gap-2 text-primary-600">
                      &quot;{query}&quot;
                      <button
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('q')
                          router.push(
                            `/categories${params.toString() ? `?${params.toString()}` : ''}`
                          )
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-primary-300 bg-white text-primary-600 transition-colors hover:border-primary-400 hover:bg-primary-50"
                        aria-label="Suche löschen und zu Alle Kategorien"
                        title="Suche löschen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </>
                ) : (
                  `${totalResults} ${t.search.results}`
                )}
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
                              : sortBy === 'bids'
                                ? t.search.sortBids
                                : t.search.sortRelevance}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'sort' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFilter === 'sort' && (
                  <div
                    className="filter-dropdown absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="py-1">
                      {[
                        { value: 'relevance', label: t.search.sortRelevance },
                        { value: 'ending', label: t.search.sortEnding },
                        { value: 'newest', label: t.search.sortNewest },
                        { value: 'price-low', label: t.search.sortPriceLow },
                        { value: 'price-high', label: t.search.sortPriceHigh },
                        { value: 'bids', label: t.search.sortBids },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleSortChange(option.value)
                            setOpenFilter(null)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                            sortBy === option.value
                              ? 'bg-primary-50 font-medium text-primary-600'
                              : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Results */}
          {loading ? (
            <SearchResultsSkeleton />
          ) : watches.length === 0 ? (
            // Empty state
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center md:p-12">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300 md:h-16 md:w-16" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900 md:text-xl">
                {t.search.noResults}
              </h2>
              <p className="mb-6 text-sm text-gray-600 md:text-base">
                {category && subcategory ? (
                  <>
                    {t.search.noCategoryItems}{' '}
                    <strong>
                      {t.categories[category as keyof typeof t.categories] || category}
                    </strong>{' '}
                    › <strong>{translateSubcategory(subcategory)}</strong> {t.search.noItemsFound}
                  </>
                ) : category ? (
                  <>
                    {t.search.noCategoryItems}{' '}
                    <strong className="capitalize">
                      {t.categories[category as keyof typeof t.categories] || category}
                    </strong>{' '}
                    {t.search.noItemsFound}
                  </>
                ) : query ? (
                  <>
                    {t.search.noQueryItems} <strong>"{query}"</strong> {t.search.noItemsFoundSorry}
                  </>
                ) : (
                  <>{t.search.noItemsYet}</>
                )}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/categories"
                  className="rounded-lg border-2 border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 md:text-base"
                >
                  {t.search.browseCategories}
                </Link>
                <Link
                  href="/sell"
                  className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 md:text-base"
                >
                  {t.search.sellFirstItem}
                </Link>
              </div>
            </div>
          ) : (
            // GRID VIEW - Mobile: 2 columns, tight spacing. Desktop: 4-6 columns
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {watches.map(w => (
                  <ProductCard
                    key={w.id}
                    {...w}
                    favorites={favorites}
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

              {/* Pagination - Ricardo style */}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  onPageChange={goToPage}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <AISearchAssistant />

      {/* Mobile Bottom Sheets */}
      <MobileFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        availableBrands={availableBrands}
        brandCounts={brandCounts}
        category={category}
      />
      <MobileSortSheet isOpen={isSortSheetOpen} onClose={() => setIsSortSheetOpen(false)} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-gray-50">
          <Header />
          <main className="flex-1 pb-8">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-4 md:py-8">
              <SearchResultsSkeleton />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
