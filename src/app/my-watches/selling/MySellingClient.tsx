'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  CheckCircle,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { getArticleUrl } from '@/lib/article-url'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'react-hot-toast'

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
  isActive?: boolean
}

type FilterType = 'all' | 'active' | 'inactive'

interface MySellingClientProps {
  initialItems: Item[]
  initialStats: {
    total: number
    active: number
    inactive: number
  }
}

export function MySellingClient({ initialItems, initialStats }: MySellingClientProps) {
  const { t } = useLanguage()
  const [items, setItems] = useState<Item[]>(initialItems)
  const [stats, setStats] = useState(initialStats)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // OPTIMIERT: Lade Details (bids, purchases) non-blocking im Hintergrund
  // WICHTIG: Wenn initialItems leer ist, versuche sofort API-Route zu laden
  useEffect(() => {
    // WICHTIG: Wenn initialItems leer ist, versuche sofort API-Route zu laden
    // Dies stellt sicher, dass Artikel nicht verschwinden
    const loadDetails = async () => {
      try {
        const response = await fetch('/api/articles/mine-fast')
        if (response.ok) {
          const data = await response.json()
          // WICHTIG: Nur updaten wenn Daten vorhanden sind UND nicht leer
          // Verhindert dass Artikel verschwinden wenn Update fehlschlägt
          if (data.watches && Array.isArray(data.watches) && data.watches.length > 0) {
            // Update items with detailed data
            setItems(data.watches)
            // Update stats
            const active = data.watches.filter((item: Item) => item.isActive).length
            const inactive = data.watches.filter((item: Item) => !item.isActive).length
            setStats({
              total: data.watches.length,
              active,
              inactive,
            })
          } else if (initialItems.length === 0 && (!data.watches || data.watches.length === 0)) {
            // Wenn initialItems leer ist UND API auch leer ist, behalte leeren State
            // Aber versuche es nochmal nach kurzer Verzögerung (könnte temporärer Fehler sein)
            setTimeout(loadDetails, 2000)
          }
          // Wenn data.watches leer ist aber initialItems vorhanden sind, behalte initiale Daten
        }
      } catch (error) {
        // Silently fail - initial items are already displayed
        // WICHTIG: Initiale Artikel bleiben erhalten, werden NICHT überschrieben
        console.error('Error loading details:', error)
        // Wenn initialItems leer ist, versuche es nochmal nach kurzer Verzögerung
        if (initialItems.length === 0) {
          setTimeout(loadDetails, 2000)
        }
      }
    }

    // Wenn initialItems leer ist, lade sofort (könnte Server-Side-Fehler sein)
    // Sonst lade Details nach kurzer Verzögerung (non-blocking)
    const timeoutId = setTimeout(loadDetails, initialItems.length === 0 ? 0 : 100)
    return () => clearTimeout(timeoutId)
  }, [initialItems.length])

  const isItemActive = (item: Item): boolean => {
    if (item.isActive !== undefined) {
      return item.isActive
    }
    if (item.isSold) return false
    if (item.isAuction && item.auctionEnd) {
      const auctionEndDate = new Date(item.auctionEnd)
      const now = new Date()
      if (auctionEndDate <= now) {
        return false
      }
    }
    return true
  }

  // Öffne Lösch-Modal
  const openDeleteModal = (item: Item) => {
    setItemToDelete(item)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  // Schließe Lösch-Modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setItemToDelete(null)
    setDeleteError(null)
  }

  // Lösche Artikel
  const handleDelete = async () => {
    if (!itemToDelete) return

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/watches/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Artikel erfolgreich gelöscht')
        closeDeleteModal()
        // Aktualisiere Liste ohne Reload
        setItems(prev => prev.filter(item => item.id !== itemToDelete.id))
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          active: itemToDelete.isActive ? prev.active - 1 : prev.active,
          inactive: !itemToDelete.isActive ? prev.inactive - 1 : prev.inactive,
        }))
      } else {
        // Spezielle Fehlermeldungen
        if (data.code === 'HAS_BIDS') {
          setDeleteError(`Dieser Artikel kann nicht gelöscht werden, da bereits ${data.bidCount} ${data.bidCount === 1 ? 'Gebot' : 'Gebote'} vorhanden ${data.bidCount === 1 ? 'ist' : 'sind'}.`)
        } else if (data.code === 'ALREADY_SOLD') {
          setDeleteError('Dieser Artikel kann nicht gelöscht werden, da er bereits verkauft wurde.')
        } else {
          setDeleteError(data.message || 'Fehler beim Löschen des Artikels')
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      setDeleteError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    const isActive = isItemActive(item)
    if (filter === 'active' && !isActive) return false
    if (filter === 'inactive' && isActive) return false

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      if (item.articleNumber && item.articleNumber.toString().includes(query)) {
        return true
      }
      const titleMatch = item.title.toLowerCase().includes(query)
      const brandMatch = item.brand?.toLowerCase().includes(query)
      const modelMatch = item.model?.toLowerCase().includes(query)
      return titleMatch || brandMatch || modelMatch
    }

    return true
  })

  return (
    <>
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
      {filteredItems.length === 0 ? (
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
                          onClick={() => openDeleteModal(item)}
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

      {/* Helvenda Lösch-Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />
          
          {/* Modal */}
          <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header mit Warnung */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Artikel löschen
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Artikel-Vorschau */}
              <div className="mb-4 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                {itemToDelete.images.length > 0 ? (
                  <img
                    src={itemToDelete.images[0]}
                    alt={itemToDelete.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium text-gray-900">{itemToDelete.title}</p>
                  <p className="text-sm text-gray-500">
                    {itemToDelete.brand} {itemToDelete.model}
                  </p>
                  {itemToDelete.articleNumber && (
                    <p className="text-xs text-gray-400">#{itemToDelete.articleNumber}</p>
                  )}
                </div>
              </div>

              {/* Fehlermeldung */}
              {deleteError ? (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">Löschen nicht möglich</p>
                    <p className="mt-1 text-sm text-red-600">{deleteError}</p>
                  </div>
                </div>
              ) : (
                <p className="mb-4 text-gray-600">
                  Möchten Sie diesen Artikel wirklich unwiderruflich löschen? 
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              )}

              {/* Info-Box für Auktionen */}
              {itemToDelete.isAuction && !deleteError && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  <p className="text-sm text-amber-700">
                    <strong>Hinweis:</strong> Sobald auf eine Auktion geboten wurde, 
                    kann diese nicht mehr gelöscht werden.
                  </p>
                </div>
              )}
            </div>

            {/* Footer mit Buttons */}
            <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Abbrechen
              </button>
              {!deleteError && (
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Löschen...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      Ja, löschen
                    </>
                  )}
                </button>
              )}
              {deleteError && (
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 rounded-xl bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Verstanden
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

