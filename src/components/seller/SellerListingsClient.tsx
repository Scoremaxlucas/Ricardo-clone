'use client'

import { AlertTriangle, Loader2, Search, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { ListingCardProps } from './ListingCard'
import { ListingsGrid } from './ListingsGrid'
import { ListingsTabs, TabType } from './ListingsTabs'

interface Draft {
  id: string
  formData: any
  images: string[]
  selectedCategory: string | null
  currentStep: number
  titleImageIndex: number
  createdAt: string
  updatedAt: string
}

interface SellerListingsClientProps {
  initialTab?: TabType
}

export function SellerListingsClient({ initialTab = 'active' }: SellerListingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Read tab from URL params, fallback to initialTab
  const urlTab = searchParams.get('tab') as TabType | null
  const validTabs: TabType[] = ['active', 'drafts', 'archive', 'sold']
  const startTab = urlTab && validTabs.includes(urlTab) ? urlTab : initialTab
  
  const [activeTab, setActiveTab] = useState<TabType>(startTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Omit<ListingCardProps, 'onDelete' | 'onDuplicate'>[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [counts, setCounts] = useState({
    active: 0,
    drafts: 0,
    ended: 0,
    sold: 0,
  })

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    title: string
    type: 'listing' | 'draft'
  } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'drafts') {
        // Fetch drafts
        const response = await fetch('/api/drafts')
        if (response.ok) {
          const data = await response.json()
          setDrafts(data.drafts || [])
        }
        // Also fetch counts
        const countsResponse = await fetch('/api/seller/listings?status=all')
        if (countsResponse.ok) {
          const countsData = await countsResponse.json()
          setCounts(countsData.counts)
        }
      } else {
        // Fetch listings
        const status = activeTab === 'archive' ? 'ended' : activeTab
        const url = new URL('/api/seller/listings', window.location.origin)
        url.searchParams.set('status', status)
        if (debouncedSearch) {
          url.searchParams.set('search', debouncedSearch)
        }

        const response = await fetch(url.toString())
        if (response.ok) {
          const data = await response.json()
          setListings(data.listings || [])
          setCounts(data.counts)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }, [activeTab, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle tab change - update URL for bookmarkable tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchQuery('')
    // Update URL without full page reload
    const url = new URL(window.location.href)
    if (tab === 'active') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    router.replace(url.pathname + url.search, { scroll: false })
  }

  // Open delete modal
  const openDeleteModal = (id: string, title: string, type: 'listing' | 'draft') => {
    setItemToDelete({ id, title, type })
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setItemToDelete(null)
    setDeleteError(null)
  }

  // Handle delete
  const handleDelete = async () => {
    if (!itemToDelete) return

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const url =
        itemToDelete.type === 'draft'
          ? `/api/drafts?id=${itemToDelete.id}`
          : `/api/watches/${itemToDelete.id}`

      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        toast.success(
          itemToDelete.type === 'draft' ? 'Entwurf gelöscht' : 'Artikel erfolgreich gelöscht'
        )
        closeDeleteModal()
        fetchData() // Refresh data
      } else {
        if (data.code === 'HAS_BIDS') {
          setDeleteError(
            `Dieser Artikel kann nicht gelöscht werden, da bereits ${data.bidCount} ${data.bidCount === 1 ? 'Gebot' : 'Gebote'} vorhanden ${data.bidCount === 1 ? 'ist' : 'sind'}.`
          )
        } else if (data.code === 'ALREADY_SOLD') {
          setDeleteError('Dieser Artikel kann nicht gelöscht werden, da er bereits verkauft wurde.')
        } else {
          setDeleteError(data.message || 'Fehler beim Löschen')
        }
      }
    } catch (error) {
      console.error('Error deleting:', error)
      setDeleteError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle duplicate (Erneut anbieten)
  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/watches/${id}/duplicate`, { method: 'POST' })
      const data = await response.json()

      if (response.ok && data.draftId) {
        toast.success('Entwurf erstellt')
        // Save draft ID for restoration and redirect
        localStorage.setItem('helvenda_restore_draft_id', data.draftId)
        router.push('/sell?step=1')
      } else {
        toast.error(data.error || 'Fehler beim Erstellen des Entwurfs')
      }
    } catch (error) {
      console.error('Error duplicating:', error)
      toast.error('Fehler beim Erstellen des Entwurfs')
    }
  }

  // Convert drafts to listing-like format for grid
  const draftsAsListings: Omit<ListingCardProps, 'onDelete' | 'onDuplicate'>[] = drafts.map(
    draft => {
      let formData: any = {}
      try {
        formData = typeof draft.formData === 'string' ? JSON.parse(draft.formData) : draft.formData
      } catch {
        formData = {}
      }

      let images: string[] = []
      try {
        images = typeof draft.images === 'string' ? JSON.parse(draft.images) : draft.images || []
      } catch {
        images = []
      }

      return {
        id: draft.id,
        articleNumber: null,
        title: formData.title || 'Ohne Titel',
        brand: formData.brand || '',
        model: formData.model || '',
        price: parseFloat(formData.price) || 0,
        images,
        createdAt: draft.createdAt,
        auctionEnd: null,
        isAuction: formData.isAuction || false,
        status: 'draft' as const, // Drafts show as "Entwurf" status
        bidCount: 0,
        highestBid: null,
        purchaseId: null,
      }
    }
  )

  // Get current listings based on tab
  const currentListings = activeTab === 'drafts' ? draftsAsListings : listings

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 rounded-xl bg-white shadow-sm">
        <ListingsTabs activeTab={activeTab} onTabChange={handleTabChange} counts={counts} />
      </div>

      {/* Search Bar */}
      {activeTab !== 'drafts' && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Titel, Marke, Modell oder Artikelnummer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm transition-shadow focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      )}

      {/* Grid */}
      <ListingsGrid
        listings={currentListings}
        loading={loading}
        activeTab={activeTab}
        onDelete={id => {
          const item = currentListings.find(l => l.id === id)
          if (item) {
            openDeleteModal(id, item.title, activeTab === 'drafts' ? 'draft' : 'listing')
          }
        }}
        onDuplicate={handleDuplicate}
      />

      {/* Delete Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {itemToDelete.type === 'draft' ? 'Entwurf löschen' : 'Artikel löschen'}
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-xl bg-gray-50 p-4">
                <p className="font-medium text-gray-900">{itemToDelete.title}</p>
              </div>

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
                  Möchten Sie {itemToDelete.type === 'draft' ? 'diesen Entwurf' : 'diesen Artikel'}{' '}
                  wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Abbrechen
              </button>
              {!deleteError ? (
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
              ) : (
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
