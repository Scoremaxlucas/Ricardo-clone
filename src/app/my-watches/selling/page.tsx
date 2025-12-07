'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  FileText,
  TrendingUp,
  CheckCircle,
  Wallet,
  Plus,
  Tag,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getArticleUrl } from '@/lib/article-url'
import { useLanguage } from '@/contexts/LanguageContext'

interface Item {
  id: string
  articleNumber: number | null
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  isSold: boolean
  isAuction: boolean
  auctionEnd: string | null
  highestBid: {
    amount: number
    createdAt: string
  } | null
  bidCount: number
  finalPrice: number
  isActive?: boolean // Wird von API zurückgegeben
}

type FilterType = 'all' | 'active' | 'inactive'

export default function MySellingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  // Berechne ob ein Artikel aktiv ist
  // WICHTIG: Verwende isActive von API wenn vorhanden, sonst berechne es selbst
  // Artikel ist aktiv wenn:
  // 1. Nicht verkauft (keine nicht-stornierten Purchases) - isSold = false bedeutet alle Purchases sind storniert
  // 2. UND (keine Auktion ODER Auktion noch nicht abgelaufen)
  const isItemActive = (item: Item): boolean => {
    // Wenn API bereits isActive berechnet hat, verwende das
    if (item.isActive !== undefined) {
      return item.isActive
    }

    // Fallback: Berechne selbst (sollte nicht nötig sein, aber sicherheitshalber)
    // Wenn verkauft (nicht-stornierte Purchases vorhanden), dann inaktiv
    if (item.isSold) return false

    // Wenn Auktion abgelaufen, dann inaktiv
    if (item.isAuction && item.auctionEnd) {
      const auctionEndDate = new Date(item.auctionEnd)
      const now = new Date()
      if (auctionEndDate <= now) {
        return false
      }
    }

    return true
  }

  const loadItems = async () => {
    try {
      setLoading(true)

      // OPTIMIERT: Lade Artikel SOFORT, ohne auf andere Requests zu warten
      const fetchPromise = fetch(`/api/articles/mine?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          const itemsList = Array.isArray(data.watches) ? data.watches : []
          setItems(itemsList)

          // Berechne Statistiken
          const activeCount = itemsList.filter((w: Item) => isItemActive(w)).length
          const inactiveCount = itemsList.length - activeCount

          setStats({
            total: itemsList.length,
            active: activeCount,
            inactive: inactiveCount,
          })
          setLoading(false)
        })
        .catch(error => {
          console.error('Error loading items:', error)
          setLoading(false)
        })

      // Prüfe und verarbeite abgelaufene Auktionen automatisch (NICHT-BLOCKIEREND im Hintergrund)
      // Dies sollte nicht das Laden der Artikel verzögern
      fetch('/api/auctions/check-expired', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(error => {
        console.error('Error checking expired auctions:', error)
        // Fehler ignorieren, da dies nicht kritisch ist
      })

      // Warte auf Artikel-Laden (aber nicht auf Auktionen-Prüfung)
      await fetchPromise
    } catch (error) {
      console.error('Error loading items:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated' || !session) {
      router.push('/login?callbackUrl=/my-watches/selling')
      return
    }

    loadItems()
  }, [session, status, router])

  // Filtere Artikel basierend auf Filter und Suche
  const filteredItems = items.filter(item => {
    // Filter nach Status
    const isActive = isItemActive(item)
    if (filter === 'active' && !isActive) return false
    if (filter === 'inactive' && isActive) return false

    // Filter nach Suche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()

      // Suche nach Artikelnummer
      if (item.articleNumber && item.articleNumber.toString().includes(query)) {
        return true
      }

      // Suche nach Titel, Marke, Modell
      const titleMatch = item.title.toLowerCase().includes(query)
      const brandMatch = item.brand?.toLowerCase().includes(query)
      const modelMatch = item.model?.toLowerCase().includes(query)

      return titleMatch || brandMatch || modelMatch
    }

    return true
  })

  const handleDelete = async (itemId: string) => {
    if (!confirm(t.actions.deleteConfirm)) {
      return
    }

    try {
      const res = await fetch(`/api/watches/${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadItems()
      } else {
        const data = await res.json()
        alert(`${t.actions.error}: ${data.message}`)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(t.actions.deleteError)
    }
  }

  // OPTIMIERT: Zeige Seite sofort, auch während des Ladens
  // Nur wenn Session noch lädt, zeige Loading-Screen
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-600">Weiterleitung zur Anmeldung...</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4 text-sm text-gray-600">
            <Link href="/my-watches" className="text-primary-600 hover:text-primary-700">
              Mein Verkaufen
            </Link>
            <span className="mx-2">›</span>
            <span>Mein Verkaufen</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t.header.mySelling}</h1>
                <p className="mt-1 text-gray-600">{t.myWatches.manageListings}</p>
              </div>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.myWatches.offerItem}
            </Link>
          </div>

          {/* Statistik-Karten */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600">{t.myWatches.total}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-lg bg-gray-100 p-3">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-gray-600">{t.myWatches.active}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg border-2 bg-white p-6 shadow-md ${
                filter === 'inactive' ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`mb-1 text-sm ${
                      filter === 'inactive' ? 'font-semibold text-red-600' : 'text-gray-600'
                    }`}
                  >
                    {t.myWatches.inactive}
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      filter === 'inactive' ? 'text-red-600' : 'text-red-500'
                    }`}
                  >
                    {stats.inactive}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-3 ${filter === 'inactive' ? 'bg-red-100' : 'bg-red-50'}`}
                >
                  <X
                    className={`h-6 w-6 ${filter === 'inactive' ? 'text-red-600' : 'text-red-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Suchleiste und Filter */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <div className="flex flex-col gap-4 md:flex-row">
              {/* Suchleiste */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.myWatches.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Filter-Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-md px-4 py-2 font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.myWatches.all}
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`rounded-md px-4 py-2 font-medium transition-colors ${
                    filter === 'active'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.myWatches.active}
                </button>
                <button
                  onClick={() => setFilter('inactive')}
                  className={`rounded-md px-4 py-2 font-medium transition-colors ${
                    filter === 'inactive'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.myWatches.inactive}
                </button>
              </div>
            </div>
          </div>

          {/* Artikel-Liste */}
          {loading ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-md">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Artikel werden geladen...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-md">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t.myWatches.noItems}</h3>
              <p className="mb-6 text-gray-600">
                {searchQuery ? t.search.tryDifferent : t.myWatches.noItemsDesc}
              </p>
              {!searchQuery && (
                <Link
                  href="/sell"
                  className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.myWatches.offerFirstItem}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map(item => {
                const isActive = isItemActive(item)
                const images = item.images || []
                const mainImage = images.length > 0 ? images[0] : null
                const articleUrl = getArticleUrl(item)

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Bild */}
                      <div className="h-48 flex-shrink-0 md:h-auto md:w-48">
                        {mainImage ? (
                          <Link href={articleUrl}>
                            <img
                              src={mainImage}
                              alt={item.title}
                              className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
                            />
                          </Link>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                            {t.home.noImage}
                          </div>
                        )}
                      </div>

                      {/* Inhalt */}
                      <div className="flex-1 p-6">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {isActive ? t.myWatches.active : t.myWatches.inactive}
                              </span>
                              {item.articleNumber && (
                                <span className="font-mono text-xs text-gray-500">
                                  #{item.articleNumber}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString('de-CH')}
                              </span>
                            </div>

                            <Link href={articleUrl}>
                              <h3 className="mb-1 cursor-pointer text-lg font-semibold text-gray-900 transition-colors hover:text-primary-600">
                                {item.title}
                              </h3>
                            </Link>

                            <p className="mb-2 text-sm text-gray-600">
                              {item.brand} {item.model}
                            </p>

                            <p className="text-lg font-bold text-gray-900">
                              CHF {item.finalPrice.toFixed(2)}
                            </p>

                            {item.isAuction && item.highestBid && (
                              <p className="mt-1 text-xs text-gray-500">
                                {item.bidCount}{' '}
                                {item.bidCount === 1 ? t.product.bid_singular : t.product.bids}
                              </p>
                            )}
                          </div>

                          {/* Aktionen */}
                          <div className="ml-4 flex gap-2">
                            <Link
                              href={articleUrl}
                              className="rounded-full bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200"
                              title={t.myWatches.view}
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/my-watches/edit/${item.id}`}
                              className="rounded-full bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
                              title={t.myWatches.edit}
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="rounded-full bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200"
                              title={t.myWatches.delete}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
