'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Grid3x3, List, Search, Package, MapPin, Clock, X, ChevronDown, Filter, Sparkles, Zap, Flame } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getBrandsForCategory, searchBrands } from '@/data/brands'
import { ProductCard } from '@/components/ui/ProductCard'

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

export default function SearchPage() {
  const router = useRouter()
  const { t, translateSubcategory } = useLanguage()
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
  const [mounted, setMounted] = useState(false)
  const sliderContainerRef = useRef<HTMLDivElement>(null)
  
  // Warte bis Component gemountet ist
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // State für URL-Parameter-String (für React Dependencies)
  const [urlSearchString, setUrlSearchString] = useState<string>('')
  
  // Lade URL-Parameter wenn Component gemountet ist
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      setUrlSearchString(window.location.search)
    }
  }, [mounted])
  
  // Aktualisiere URL-Parameter wenn sich die URL ändert
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    const handleRouteChange = () => {
      setUrlSearchString(window.location.search)
    }
    
    // Initial load
    handleRouteChange()
    
    // Polling für URL-Änderungen (da router.push() nicht immer popstate auslöst)
    const interval = setInterval(handleRouteChange, 100)
    
    // Listen to popstate (back/forward button)
    window.addEventListener('popstate', handleRouteChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [mounted])
  
  // Parse URL-Parameter
  const urlParams = mounted && typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams(urlSearchString)
  
  const query = (urlParams?.get('q') || '').trim()
  const category = (urlParams?.get('category') || '').trim()
  const subcategory = (urlParams?.get('subcategory') || '').trim()
  const minPrice = urlParams?.get('minPrice') || ''
  const maxPrice = urlParams?.get('maxPrice') || ''
  const condition = urlParams?.get('condition') || ''
  const brand = urlParams?.get('brand') || ''
  const isAuction = urlParams?.get('isAuction') || ''
  const postalCode = urlParams?.get('postalCode') || ''
  const sortBy = urlParams?.get('sortBy') || 'relevance'
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  
  // Aktualisiere selectedBrands wenn brand sich ändert
  useEffect(() => {
    if (brand) {
      setSelectedBrands([brand])
    } else {
      setSelectedBrands([])
    }
  }, [brand])
  
  // Initialisiere lokale Preis-Werte
  useEffect(() => {
    setLocalMinPrice(minPrice || '0.05')
    setLocalMaxPrice(maxPrice || '1000000')
  }, [minPrice, maxPrice])
  
  // Aktualisiere selectedBrands wenn brand sich ändert
  useEffect(() => {
    setSelectedBrands(brand ? [brand] : [])
  }, [brand])
  
  // Lade Favoriten
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch('/api/favorites')
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

  useEffect(() => {
    if (!mounted) return
    
    const run = async () => {
      setLoading(true)
      try {
        // Verwende aktuelle URL-Parameter direkt aus window.location
        const currentParams = typeof window !== 'undefined' 
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams(urlSearchString)
        
        let url = '/api/watches/search'
        const params = new URLSearchParams()
        
        const q = (currentParams.get('q') || '').trim()
        const cat = (currentParams.get('category') || '').trim()
        const subcat = (currentParams.get('subcategory') || '').trim()
        const min = currentParams.get('minPrice') || ''
        const max = currentParams.get('maxPrice') || ''
        const cond = currentParams.get('condition') || ''
        const br = currentParams.get('brand') || ''
        const auction = currentParams.get('isAuction') || ''
        const plz = currentParams.get('postalCode') || ''
        const sort = currentParams.get('sortBy') || 'relevance'
        
        if (q) params.append('q', q)
        if (cat) params.append('category', cat)
        if (subcat) params.append('subcategory', subcat)
        if (min) params.append('minPrice', min)
        if (max) params.append('maxPrice', max)
        if (cond) params.append('condition', cond)
        if (br) params.append('brand', br)
        if (auction) params.append('isAuction', auction)
        if (plz) params.append('postalCode', plz)
        if (sort) params.append('sortBy', sort)
        
        if (params.toString()) {
          url += '?' + params.toString()
        }
        
        console.log('🔍 Fetching with URL:', url)
        console.log('📊 Filter params:', { min, max, cond, br, auction, plz, sort })
        
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }
        const data = await res.json()
        const watchesData = Array.isArray(data.watches) ? data.watches : []
        console.log(`✅ Received ${watchesData.length} watches`)
        setWatches(watchesData)
        
        // Lade präzise Marken-Anzahlen aus separater API (ohne Marken-Filter)
        try {
          const brandCountsParams = new URLSearchParams()
          if (cat) brandCountsParams.append('category', cat)
          if (subcat) brandCountsParams.append('subcategory', subcat)
          if (min) brandCountsParams.append('minPrice', min)
          if (max) brandCountsParams.append('maxPrice', max)
          if (cond) brandCountsParams.append('condition', cond)
          if (auction) brandCountsParams.append('isAuction', auction)
          if (plz) brandCountsParams.append('postalCode', plz)
          if (q) brandCountsParams.append('q', q)
          
          const brandCountsUrl = `/api/watches/brand-counts?${brandCountsParams.toString()}`
          const brandCountsRes = await fetch(brandCountsUrl)
          if (brandCountsRes.ok) {
            const brandCountsData = await brandCountsRes.json()
            setBrandCounts(brandCountsData.brandCounts || {})
            console.log('📊 Brand counts loaded:', brandCountsData.brandCounts)
          }
        } catch (error) {
          console.error('Error loading brand counts:', error)
          // Fallback: Zähle aus aktuellen Ergebnissen
          const counts: Record<string, number> = {}
          watchesData.forEach((w: WatchItem) => {
            if (w.brand) {
              counts[w.brand] = (counts[w.brand] || 0) + 1
            }
          })
          setBrandCounts(counts)
        }
        
        // Extrahiere verfügbare Marken für Dropdown
        const brands = [...new Set(watchesData.map((w: WatchItem) => w.brand).filter(Boolean))].sort() as string[]
        
        // Lade Marken aus statischer Liste für die aktuelle Kategorie
        try {
          if (cat) {
            // Nur Marken aus der aktuellen Kategorie anzeigen
            const categoryBrands = getBrandsForCategory(cat)
            // Kombiniere mit Marken aus den Ergebnissen
            const allAvailableBrands = [...new Set([...brands, ...categoryBrands])].sort()
            setAvailableBrands(allAvailableBrands)
          } else {
            // Wenn keine Kategorie, zeige alle Marken aus Ergebnissen
            setAvailableBrands(brands)
          }
        } catch (error) {
          console.error('Error loading brands:', error)
          setAvailableBrands(brands)
        }
      } catch (error) {
        console.error('Error fetching watches:', error)
        setWatches([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [mounted, urlSearchString, category])
  
  const updateFilter = (key: string, value: string) => {
    if (!mounted || typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    
    // Setze neuen Filter
    if (value && value.trim() !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    const newUrl = `/search?${params.toString()}`
    router.push(newUrl)
    
    // Aktualisiere URL-Parameter sofort
    setUrlSearchString(params.toString())
  }
  
  const applyBrandFilter = () => {
    if (!mounted || typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    if (selectedBrands.length > 0) {
      params.set('brand', selectedBrands[0]) // Für jetzt nur erste Marke, später können wir mehrere unterstützen
    } else {
      params.delete('brand')
    }
    
    const newUrl = `/search?${params.toString()}`
    router.push(newUrl)
    
    // Aktualisiere URL-Parameter sofort
    setUrlSearchString(params.toString())
  }
  
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
  
  const applyPriceFilter = () => {
    if (!mounted || typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    
    // Setze minPrice nur wenn es gesetzt ist und nicht der Standardwert
    if (localMinPrice && localMinPrice !== '0.05' && localMinPrice.trim() !== '') {
      params.set('minPrice', localMinPrice)
    } else {
      params.delete('minPrice')
    }
    
    // Setze maxPrice nur wenn es gesetzt ist und nicht der Standardwert
    if (localMaxPrice && localMaxPrice !== '1000000' && localMaxPrice.trim() !== '') {
      params.set('maxPrice', localMaxPrice)
    } else {
      params.delete('maxPrice')
    }
    
    const newUrl = `/search?${params.toString()}`
    router.push(newUrl)
    
    // Aktualisiere URL-Parameter sofort
    setUrlSearchString(params.toString())
  }
  
  const handleSortChange = (newSort: string) => {
    if (!mounted || typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    params.set('sortBy', newSort)
    
    const newUrl = `/search?${params.toString()}`
    router.push(newUrl)
    
    // Aktualisiere URL-Parameter sofort
    setUrlSearchString(params.toString())
  }

  // Schließe Filter-Dropdowns beim Klick außerhalb
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

  // Zeige Loading-State bis Component gemountet ist
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pb-8">
        <div className="max-w-[1400px] mx-auto px-4 py-8 w-full">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">{t.search.homepage}</Link>
          <span className="mx-2">›</span>
          {category ? (
            <>
              <Link href="/search" className="text-primary-600 hover:text-primary-700">{t.search.title}</Link>
              <span className="mx-2">›</span>
              <span className="capitalize">{t.categories[category as keyof typeof t.categories] || category.replace(/-/g, ' ')}</span>
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

        {/* Active Filters Display */}
        <div className="mb-4 flex flex-wrap gap-2">
          {query && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">"{query}"</span>
              <Link href="/search" className="text-gray-400 hover:text-gray-600">×</Link>
            </div>
          )}
          {category && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900 capitalize">
                {t.categories[category as keyof typeof t.categories] || category.replace(/-/g, ' ')}
              </span>
              <Link 
                href={query ? `/search?q=${query}` : '/search'} 
                className="text-primary-600 hover:text-primary-700"
              >
                ×
              </Link>
            </div>
          )}
          {subcategory && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900">{translateSubcategory(subcategory)}</span>
              <Link 
                href={`/search?category=${category}${query ? `&q=${query}` : ''}`} 
                className="text-primary-600 hover:text-primary-700"
              >
                ×
              </Link>
            </div>
          )}
          {minPrice && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900">{t.search.price}: {t.search.from} CHF {minPrice}</span>
              <button onClick={() => removeFilter('minPrice')} className="text-primary-600 hover:text-primary-700">×</button>
            </div>
          )}
          {maxPrice && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900">{t.search.price}: {t.search.to} CHF {maxPrice}</span>
              <button onClick={() => removeFilter('maxPrice')} className="text-primary-600 hover:text-primary-700">×</button>
            </div>
          )}
          {condition && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900">{t.search.condition}: {
                condition === 'neu' ? t.search.conditionNew :
                condition === 'wie-neu' ? t.search.conditionLikeNew :
                condition === 'sehr-gut' ? t.search.conditionVeryGood :
                condition === 'gut' ? t.search.conditionGood :
                condition === 'gebraucht' ? t.search.conditionUsed : condition
              }</span>
              <button onClick={() => removeFilter('condition')} className="text-primary-600 hover:text-primary-700">×</button>
            </div>
          )}
          {brand && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900">{t.search.brand}: {brand}</span>
              <button onClick={() => removeFilter('brand')} className="text-primary-600 hover:text-primary-700">×</button>
            </div>
          )}
          {isAuction && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900">{t.search.offerType}: {isAuction === 'true' ? t.search.auction : t.search.buyNow}</span>
              <button onClick={() => removeFilter('isAuction')} className="text-primary-600 hover:text-primary-700">×</button>
            </div>
          )}
          {postalCode && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full">
              <span className="font-medium text-primary-900">{t.search.postalCode}: {postalCode}</span>
              <button onClick={() => removeFilter('postalCode')} className="text-primary-600 hover:text-primary-700">×</button>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{t.search.filters}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Preis Filter */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenFilter(openFilter === 'price' ? null : 'price')
                }}
                className="filter-button w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t.search.price}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'price' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'price' && (
                <div className="filter-dropdown absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-4">
                    {/* Preis-Range Slider */}
                    <div className="price-filter-container" ref={sliderContainerRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {t.search.price}: CHF {parseFloat(localMinPrice || '0.05').toLocaleString('de-CH')} - CHF {parseFloat(localMaxPrice || '1000000').toLocaleString('de-CH')}
                      </label>
                      <div className="relative h-12">
                        {/* Background Track */}
                        <div className="absolute top-5 left-0 right-0 h-2 bg-gray-200 rounded-lg"></div>
                        
                        {/* Visual Range Indicator */}
                        <div 
                          className="absolute top-5 h-2 bg-primary-600 rounded-lg pointer-events-none"
                          style={{
                            left: `${((parseFloat(localMinPrice || '0.05') / 1000000) * 100)}%`,
                            width: `${Math.max(0, ((parseFloat(localMaxPrice || '1000000') - parseFloat(localMinPrice || '0.05')) / 1000000) * 100)}%`
                          }}
                        />
                        
                        {/* Min Slider - Volle Breite, aber nur Min-Thumb ist klickbar */}
                        <input
                          type="range"
                          min="0.05"
                          max="1000000"
                          step="100"
                          value={localMinPrice || '0.05'}
                          onChange={(e) => {
                            const val = e.target.value
                            const minVal = parseFloat(val)
                            const maxVal = parseFloat(localMaxPrice || '1000000')
                            // Min muss IMMER kleiner als Max sein (mindestens 0.05 Differenz)
                            // Wenn Min >= Max, setze Min auf (Max - 0.05)
                            const newMin = minVal < maxVal ? Math.min(minVal, maxVal - 0.05) : Math.max(0.05, maxVal - 0.05)
                            setLocalMinPrice(newMin.toString())
                          }}
                          onInput={(e) => {
                            const val = (e.target as HTMLInputElement).value
                            const minVal = parseFloat(val)
                            const maxVal = parseFloat(localMaxPrice || '1000000')
                            // Min muss IMMER kleiner als Max sein (mindestens 0.05 Differenz)
                            // Wenn Min >= Max, setze Min auf (Max - 0.05)
                            const newMin = minVal < maxVal ? Math.min(minVal, maxVal - 0.05) : Math.max(0.05, maxVal - 0.05)
                            setLocalMinPrice(newMin.toString())
                          }}
                          className="absolute top-0 w-full h-12 bg-transparent appearance-none cursor-pointer z-20"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            pointerEvents: 'none'
                          }}
                        />
                        
                        {/* Max Slider - Volle Breite, aber nur Max-Thumb ist klickbar */}
                        <input
                          type="range"
                          min="0.05"
                          max="1000000"
                          step="100"
                          value={localMaxPrice || '1000000'}
                          onChange={(e) => {
                            const val = e.target.value
                            const minVal = parseFloat(localMinPrice || '0.05')
                            const maxVal = parseFloat(val)
                            // Max muss IMMER größer als Min sein (mindestens 0.05 Differenz)
                            // Wenn Max <= Min, setze Max auf (Min + 0.05)
                            const newMax = maxVal > minVal ? Math.max(maxVal, minVal + 0.05) : Math.min(1000000, minVal + 0.05)
                            setLocalMaxPrice(newMax.toString())
                          }}
                          onInput={(e) => {
                            const val = (e.target as HTMLInputElement).value
                            const minVal = parseFloat(localMinPrice || '0.05')
                            const maxVal = parseFloat(val)
                            // Max muss IMMER größer als Min sein (mindestens 0.05 Differenz)
                            // Wenn Max <= Min, setze Max auf (Min + 0.05)
                            const newMax = maxVal > minVal ? Math.max(maxVal, minVal + 0.05) : Math.min(1000000, minVal + 0.05)
                            setLocalMaxPrice(newMax.toString())
                          }}
                          className="absolute top-0 w-full h-12 bg-transparent appearance-none cursor-pointer z-30"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            pointerEvents: 'none'
                          }}
                        />
                      </div>
                      
                      {/* Slider Thumb Styles */}
                      <style dangerouslySetInnerHTML={{__html: `
                        .price-filter-container {
                          position: relative;
                        }
                        .price-filter-container input[type="range"] {
                          pointer-events: none !important;
                        }
                        .price-filter-container input[type="range"]::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 22px;
                          height: 22px;
                          border-radius: 50%;
                          background: #10b981;
                          cursor: grab;
                          border: 3px solid white;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                          margin-top: -10px;
                          position: relative;
                          z-index: 100;
                          pointer-events: auto !important;
                        }
                        .price-filter-container input[type="range"]::-webkit-slider-thumb:active {
                          cursor: grabbing;
                          transform: scale(1.15);
                          z-index: 200;
                        }
                        .price-filter-container input[type="range"]::-moz-range-thumb {
                          width: 22px;
                          height: 22px;
                          border-radius: 50%;
                          background: #10b981;
                          cursor: grab;
                          border: 3px solid white;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                          position: relative;
                          z-index: 100;
                          pointer-events: auto !important;
                        }
                        .price-filter-container input[type="range"]::-moz-range-thumb:active {
                          cursor: grabbing;
                          transform: scale(1.15);
                          z-index: 200;
                        }
                        .price-filter-container input[type="range"]::-webkit-slider-runnable-track {
                          background: transparent;
                          height: 2px;
                          pointer-events: none;
                        }
                        .price-filter-container input[type="range"]::-moz-range-track {
                          background: transparent;
                          height: 2px;
                          pointer-events: none;
                        }
                        /* Min Slider - nur linker Thumb sichtbar */
                        .price-filter-container input[type="range"]:nth-of-type(1)::-webkit-slider-thumb {
                          z-index: 20;
                        }
                        .price-filter-container input[type="range"]:nth-of-type(1)::-webkit-slider-thumb:active {
                          z-index: 200;
                        }
                        /* Max Slider - nur rechter Thumb sichtbar */
                        .price-filter-container input[type="range"]:nth-of-type(2)::-webkit-slider-thumb {
                          z-index: 30;
                        }
                        .price-filter-container input[type="range"]:nth-of-type(2)::-webkit-slider-thumb:active {
                          z-index: 200;
                        }
                      `}} />
                    </div>
                    
                    {/* Input-Felder */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Min. (CHF)</label>
                        <input
                          type="number"
                          min="0.05"
                          step="0.05"
                          value={localMinPrice}
                          onChange={(e) => {
                            const val = e.target.value
                            setLocalMinPrice(val)
                            if (val && parseFloat(val) > parseFloat(localMaxPrice || '1000000')) {
                              setLocalMaxPrice(val)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 text-sm"
                          placeholder="0.05"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Max. (CHF)</label>
                        <input
                          type="number"
                          min="0.05"
                          step="0.05"
                          value={localMaxPrice}
                          onChange={(e) => {
                            const val = e.target.value
                            setLocalMaxPrice(val)
                            if (val && parseFloat(val) < parseFloat(localMinPrice || '0.05')) {
                              setLocalMinPrice(val)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 text-sm"
                          placeholder="1'000'000"
                        />
                      </div>
                    </div>
                    
                    {/* Button - ändert sich basierend auf Werten */}
                    <button
                      onClick={() => {
                        const hasCustomPrice = (localMinPrice && localMinPrice !== '0.05') || (localMaxPrice && localMaxPrice !== '1000000')
                        if (hasCustomPrice) {
                          applyPriceFilter()
                          setOpenFilter(null)
                        } else {
                          setOpenFilter(null)
                        }
                      }}
                      className={`w-full px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                        (localMinPrice && localMinPrice !== '0.05') || (localMaxPrice && localMaxPrice !== '1000000')
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {(localMinPrice && localMinPrice !== '0.05') || (localMaxPrice && localMaxPrice !== '1000000')
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
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenFilter(openFilter === 'condition' ? null : 'condition')
                }}
                className="filter-button w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t.search.condition}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'condition' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'condition' && (
                <div className="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    {[
                      { value: 'neu', label: t.search.conditionNew },
                      { value: 'wie-neu', label: t.search.conditionLikeNew },
                      { value: 'sehr-gut', label: t.search.conditionVeryGood },
                      { value: 'gut', label: t.search.conditionGood },
                      { value: 'gebraucht', label: t.search.conditionUsed }
                    ].map((cond) => (
                      <label key={cond.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                      className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      {t.search.reset}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Marke Filter - Ricardo-Style */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenFilter(openFilter === 'brand' ? null : 'brand')
                }}
                className="filter-button w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t.search.brand}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'brand' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'brand' && (
                <div className="filter-dropdown absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 max-h-96 flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {/* Suchfeld */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.search.searchBrand}
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    {brandSearchQuery && (
                      <button
                        onClick={() => setBrandSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Marken-Liste mit Checkboxen */}
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {(brandSearchQuery 
                      ? (() => {
                          try {
                            return searchBrands(brandSearchQuery, category)
                          } catch (error) {
                            console.error('Error searching brands:', error)
                            return availableBrands.filter(b => b.toLowerCase().includes(brandSearchQuery.toLowerCase()))
                          }
                        })()
                      : availableBrands
                    ).slice(0, 100).map((b) => {
                      const count = brandCounts[b] || 0
                      const isSelected = selectedBrands.includes(b)
                      return (
                        <label 
                          key={b} 
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleBrand(b)}
                              className="text-primary-600 focus:ring-primary-500 rounded"
                            />
                            <span className="text-sm text-gray-700">{b}</span>
                          </div>
                          {count > 0 && (
                            <span className="text-xs text-gray-500 ml-2">{count}</span>
                          )}
                        </label>
                      )
                    })}
                    {availableBrands.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">{t.search.noBrandsFound}</p>
                    )}
                  </div>
                  
                  {/* Button */}
                  <button
                    onClick={() => {
                      applyBrandFilter()
                      setOpenFilter(null)
                    }}
                    className={`mt-3 w-full px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                      selectedBrands.length > 0
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedBrands.length > 0 
                      ? `${watches.length} ERGEBNISSE ANZEIGEN` 
                      : 'Schließen'}
                  </button>
                </div>
              )}
            </div>

            {/* Angebotsart Filter */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenFilter(openFilter === 'offerType' ? null : 'offerType')
                }}
                className="filter-button w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t.search.offerType}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'offerType' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'offerType' && (
                <div className="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenFilter(openFilter === 'location' ? null : 'location')
                }}
                className="filter-button w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{t.search.location}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'location' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'location' && (
                <div className="filter-dropdown absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.search.postalCode}</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => {
                          const params = new URLSearchParams(window.location.search)
                          if (e.target.value) params.set('postalCode', e.target.value)
                          else params.delete('postalCode')
                          router.push(`/search?${params.toString()}`)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 8001"
                        maxLength={10}
                      />
                    </div>
                    <button
                      onClick={() => setOpenFilter(null)}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? t.search.loading : `${watches.length} ${t.search.results}`}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sortierung */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenFilter(openFilter === 'sort' ? null : 'sort')
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors bg-white"
              >
                <span className="text-sm font-medium text-gray-700">
                  {t.search.sortBy}: {
                    sortBy === 'relevance' ? t.search.sortRelevance :
                    sortBy === 'ending' ? t.search.sortEnding :
                    sortBy === 'newest' ? t.search.sortNewest :
                    sortBy === 'price-low' ? t.search.sortPriceLow :
                    sortBy === 'price-high' ? t.search.sortPriceHigh :
                    sortBy === 'bids' ? t.search.sortBids : t.search.sortRelevance
                  }
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openFilter === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'sort' && (
                <div className="filter-dropdown absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50" onClick={(e) => e.stopPropagation()}>
                  <div className="py-1">
                    {[
                      { value: 'relevance', label: t.search.sortRelevance },
                      { value: 'ending', label: t.search.sortEnding },
                      { value: 'newest', label: t.search.sortNewest },
                      { value: 'price-low', label: t.search.sortPriceLow },
                      { value: 'price-high', label: t.search.sortPriceHigh },
                      { value: 'bids', label: t.search.sortBids }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleSortChange(option.value)
                          setOpenFilter(null)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          sortBy === option.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Ansicht */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1 bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t.search.loadingResults}</p>
            </div>
          </div>
        ) : watches.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t.search.noResults}
            </h2>
            <p className="text-gray-600 mb-6">
              {category && subcategory ? (
                <>{t.search.noCategoryItems} <strong>{t.categories[category as keyof typeof t.categories] || category}</strong> › <strong>{translateSubcategory(subcategory)}</strong> {t.search.noItemsFound}</>
              ) : category ? (
                <>{t.search.noCategoryItems} <strong className="capitalize">{t.categories[category as keyof typeof t.categories] || category}</strong> {t.search.noItemsFound}</>
              ) : query ? (
                <>{t.search.noQueryItems} <strong>"{query}"</strong> {t.search.noItemsFoundSorry}</>
              ) : (
                <>{t.search.noItemsYet}</>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/categories"
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                {t.search.browseCategories}
              </Link>
              <Link
                href="/sell"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                {t.search.sellFirstItem}
              </Link>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // GRID ANSICHT - Konsistent mit Homepage
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
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
        ) : (
          // LIST ANSICHT - Verwende ProductCard mit variant="list"
          <div className="space-y-3">
            {watches.map(w => (
              <ProductCard
                key={w.id}
                {...w}
                variant="list"
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
                showBuyNowButton={true}
              />
            ))}
          </div>
        )}
        </div>
      </main>
      <Footer />
    </div>
  )
}




