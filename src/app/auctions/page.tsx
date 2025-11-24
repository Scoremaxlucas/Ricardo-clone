'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Grid3x3, List, Clock, Gavel, MapPin, Sparkles, Zap, Flame } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ProductCard } from '@/components/ui/ProductCard'

interface WatchItem {
  id: string
  title: string
  brand: string
  price: number
  images: string[]
  createdAt: string
  auctionEnd?: string
  city?: string
  postalCode?: string
  bids?: any[]
  buyNowPrice?: number
  isAuction: boolean
  boosters?: string[]
}

export default function AuctionsPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [watches, setWatches] = useState<WatchItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'price' | 'bids'>('ending')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true)
      try {
        // Hole nur Auktionsartikel
        const response = await fetch('/api/watches/search?isAuction=true')
        if (response.ok) {
          const data = await response.json()
          let auctions = Array.isArray(data.watches) ? data.watches.filter((w: any) => w.isAuction) : []
          
          // Parse boosters für jedes Item
          auctions = auctions.map((w: any) => {
            let boosters: string[] = []
            try {
              if (w.boosters) {
                if (Array.isArray(w.boosters)) {
                  boosters = w.boosters
                } else if (typeof w.boosters === 'string') {
                  boosters = JSON.parse(w.boosters)
                }
              }
            } catch (e) {
              boosters = []
            }
            return { ...w, boosters }
          })
          
          // Sortiere zuerst nach Booster-Priorität (geboostete zuerst)
          const getBoostPriority = (boosters: string[] = []): number => {
            if (boosters.includes('super-boost')) return 4
            if (boosters.includes('turbo-boost')) return 3
            if (boosters.includes('boost')) return 2
            return 1
          }
          
          auctions = auctions.sort((a: any, b: any) => {
            const priorityA = getBoostPriority(a.boosters || [])
            const priorityB = getBoostPriority(b.boosters || [])
            
            // Wenn Priorität unterschiedlich, sortiere nach Priorität
            if (priorityA !== priorityB) {
              return priorityB - priorityA // Höhere Priorität zuerst
            }
            
            // Bei gleicher Priorität: nach gewähltem Kriterium sortieren
            if (sortBy === 'ending') {
              if (!a.auctionEnd) return 1
              if (!b.auctionEnd) return -1
              return new Date(a.auctionEnd).getTime() - new Date(b.auctionEnd).getTime()
            } else if (sortBy === 'newest') {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            } else if (sortBy === 'price') {
              return a.price - b.price
            } else if (sortBy === 'bids') {
              const bidsA = a.bids?.length || 0
              const bidsB = b.bids?.length || 0
              return bidsB - bidsA
            }
            return 0
          })
          
          setWatches(auctions)
        }
      } catch (error) {
        console.error('Error fetching auctions:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAuctions()
  }, [sortBy])

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) return
      
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
  }, [session?.user])

  const toggleFavorite = async (watchId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session?.user) {
      alert('Bitte melden Sie sich an, um Favoriten hinzuzufügen')
      return
    }

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

  const getTimeLeft = (auctionEnd?: string) => {
    if (!auctionEnd) return null
    const end = new Date(auctionEnd)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Beendet'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">{t.search.homepage}</Link>
          <span className="mx-2">›</span>
          <span>Auktionen</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Gavel className="h-8 w-8 text-primary-600" />
              Auktionen
            </h1>
            <p className="text-gray-600">
              {loading ? 'Lädt...' : `${watches.length} ${watches.length === 1 ? 'Auktion' : 'Auktionen'}`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sortierung */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sortieren:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="ending">Endet bald</option>
                <option value="newest">Neueste</option>
                <option value="price">Preis (niedrig → hoch)</option>
                <option value="bids">Meiste Gebote</option>
              </select>
            </div>
            
            {/* Ansicht */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t.search.viewMode}:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
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
            <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Keine Auktionen gefunden
            </h2>
            <p className="text-gray-600 mb-6">
              Aktuell gibt es keine laufenden Auktionen.
            </p>
            <Link
              href="/sell"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Erste Auktion erstellen
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          // GRID ANSICHT
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {watches.map(w => (
              <Link
                key={w.id}
                href={`/products/${w.id}`}
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {w.images && w.images.length > 0 ? (
                    <img 
                      src={w.images[0]} 
                      alt={w.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Kein Bild
                    </div>
                  )}
                  <button
                    onClick={(e) => toggleFavorite(w.id, e)}
                    className={`absolute top-1.5 right-1.5 rounded-full p-1 shadow-md transition-all z-10 ${
                      favorites.has(w.id)
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-3 w-3 ${favorites.has(w.id) ? 'fill-current' : ''}`} />
                  </button>
                  {/* Booster Badges */}
                  {w.boosters && w.boosters.includes('super-boost') && (
                    <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                  {w.boosters && w.boosters.includes('turbo-boost') && !w.boosters.includes('super-boost') && (
                    <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
                      <Zap className="h-3 w-3" />
                    </div>
                  )}
                  {w.boosters && w.boosters.includes('boost') && !w.boosters.includes('super-boost') && !w.boosters.includes('turbo-boost') && (
                    <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
                      <Flame className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className="p-1">
                  {w.brand && (
                    <div className="text-[10px] font-medium text-primary-600 mb-0.5 truncate">{w.brand}</div>
                  )}
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="text-xs font-bold text-gray-900">
                      CHF {new Intl.NumberFormat('de-CH').format(w.price)}
                    </div>
                    {w.buyNowPrice && (
                      <div className="text-[10px] text-gray-500">
                        Sofort: {new Intl.NumberFormat('de-CH').format(w.buyNowPrice)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <Gavel className="h-2.5 w-2.5 text-orange-600" />
                    <span className="text-[10px] text-orange-600 font-medium">Auktion</span>
                  </div>
                  <div className="font-medium text-gray-900 text-xs line-clamp-2 mb-0.5 min-h-[20px] leading-tight">
                    {w.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 flex-wrap">
                    {(w.city || w.postalCode) && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {w.city && w.postalCode 
                          ? `${w.city} ${w.postalCode}`
                          : w.city || w.postalCode}
                      </span>
                    )}
                    {w.auctionEnd && (
                      <span className="flex items-center gap-0.5 text-orange-600 font-semibold">
                        <Clock className="h-2.5 w-2.5" />
                        {getTimeLeft(w.auctionEnd)}
                      </span>
                    )}
                    {w.bids && w.bids.length > 0 && (
                      <span className="text-gray-600">
                        ({w.bids.length} {w.bids.length === 1 ? 'Gebot' : 'Gebote'})
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // LIST ANSICHT - Verwende ProductCard mit variant="list"
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
      <Footer />
    </div>
  )
}

