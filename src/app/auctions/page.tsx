'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ProductCard } from '@/components/ui/ProductCard'
import { ArticleSkeleton } from '@/components/ui/ArticleSkeleton'
import { useLanguage } from '@/contexts/LanguageContext'
import { Gavel, Grid3x3, List } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
  const [visibleCount, setVisibleCount] = useState(12) // Progressive loading

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true)
      try {
        // OPTIMIERT: Verwende fast API-Route für instant loading
        const response = await fetch('/api/articles/auctions-fast')
        if (response.ok) {
          const data = await response.json()
          let auctions = Array.isArray(data.watches)
            ? data.watches.filter((w: any) => w.isAuction)
            : []

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

          // OPTIMIERT: Progressive Loading - zeige zuerst 12 Artikel sofort
          if (auctions.length > 0) {
            setVisibleCount(12)
            // Lade restliche Artikel nach kurzer Verzögerung
            if (auctions.length > 12) {
              setTimeout(() => setVisibleCount(auctions.length), 150)
            }
          }
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


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            {t.search.homepage}
          </Link>
          <span className="mx-2">›</span>
          <span>Auktionen</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-900">
              <Gavel className="h-8 w-8 text-primary-600" />
              Auktionen
            </h1>
            <p className="text-gray-600">
              {loading
                ? 'Lädt...'
                : `${watches.length} ${watches.length === 1 ? 'Auktion' : 'Auktionen'}`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Sortierung */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sortieren:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className={`rounded p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && watches.length === 0 ? (
          <div className="py-8">
            <ArticleSkeleton count={12} variant={viewMode} />
          </div>
        ) : watches.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Gavel className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Keine Auktionen gefunden</h2>
            <p className="mb-6 text-gray-600">Aktuell gibt es keine laufenden Auktionen.</p>
            <Link
              href="/sell"
              className="inline-block rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
            >
              Erste Auktion erstellen
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          // GRID ANSICHT - Verwende ProductCard für Konsistenz
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6">
            {watches.slice(0, visibleCount).map((w, index) => (
              <div key={w.id} className={`animate-in fade-in slide-in-from-bottom-4 ${index < 12 ? '' : 'duration-300'}`}>
                <ProductCard
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
              </div>
            ))}
            {loading && watches.length > visibleCount && (
              <ArticleSkeleton count={Math.min(4, watches.length - visibleCount)} variant="grid" />
            )}
          </div>
        ) : (
          // LIST ANSICHT - Verwende ProductCard mit variant="list"
          <div className="space-y-3">
            {watches.slice(0, visibleCount).map((w, index) => (
              <div key={w.id} className={`animate-in fade-in slide-in-from-bottom-4 ${index < 12 ? '' : 'duration-300'}`}>
                <ProductCard
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
              </div>
            ))}
            {loading && watches.length > visibleCount && (
              <ArticleSkeleton count={Math.min(4, watches.length - visibleCount)} variant="list" />
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
