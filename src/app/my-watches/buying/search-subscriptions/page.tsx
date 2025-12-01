'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, Trash2, Bell, BellOff, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import toast from 'react-hot-toast'

interface SearchSubscription {
  id: string
  searchTerm?: string | null
  brand?: string | null
  model?: string | null
  categoryId?: string | null
  subcategoryId?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  condition?: string | null
  yearFrom?: number | null
  yearTo?: number | null
  isActive: boolean
  matchesFound: number
  lastMatchAt?: string | null
  createdAt: string
}

export default function SearchSubscriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<SearchSubscription[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    searchTerm: '',
    brand: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    yearFrom: '',
    yearTo: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-watches/buying/search-subscriptions')
      return
    }

    if (status === 'authenticated' && session?.user) {
      loadSubscriptions()
    }
  }, [status, session, router])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/search-subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error)
      toast.error('Fehler beim Laden der Suchabos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.searchTerm && !formData.brand && !formData.model) {
      toast.error('Bitte geben Sie mindestens einen Suchbegriff, eine Marke oder ein Modell an')
      return
    }

    try {
      const response = await fetch('/api/search-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Suchabo erfolgreich erstellt!')
        setShowCreateForm(false)
        setFormData({
          searchTerm: '',
          brand: '',
          model: '',
          minPrice: '',
          maxPrice: '',
          condition: '',
          yearFrom: '',
          yearTo: '',
        })
        loadSubscriptions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Fehler beim Erstellen des Suchabos')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error('Fehler beim Erstellen des Suchabos')
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return

    try {
      const response = await fetch(`/api/search-subscriptions/${deleteConfirmId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Suchabo gelöscht')
        setDeleteConfirmId(null)
        loadSubscriptions()
      } else {
        toast.error('Fehler beim Löschen des Suchabos')
      }
    } catch (error) {
      console.error('Error deleting subscription:', error)
      toast.error('Fehler beim Löschen des Suchabos')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/search-subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        toast.success(`Suchabo ${!currentStatus ? 'aktiviert' : 'deaktiviert'}`)
        loadSubscriptions()
      } else {
        toast.error('Fehler beim Aktualisieren des Suchabos')
      }
    } catch (error) {
      console.error('Error toggling subscription:', error)
      toast.error('Fehler beim Aktualisieren des Suchabos')
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCriteriaText = (sub: SearchSubscription) => {
    const parts: string[] = []
    if (sub.searchTerm) parts.push(`"${sub.searchTerm}"`)
    if (sub.brand) parts.push(`Marke: ${sub.brand}`)
    if (sub.model) parts.push(`Modell: ${sub.model}`)
    if (sub.minPrice || sub.maxPrice) {
      const priceRange = []
      if (sub.minPrice) priceRange.push(`ab CHF ${sub.minPrice.toFixed(2)}`)
      if (sub.maxPrice) priceRange.push(`bis CHF ${sub.maxPrice.toFixed(2)}`)
      parts.push(`Preis: ${priceRange.join(' ')}`)
    }
    return parts.length > 0 ? parts.join(', ') : 'Keine Kriterien'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/my-watches/buying" className="text-primary-600 hover:text-primary-700">
            Mein Kaufen
          </Link>
          <span className="mx-2">›</span>
          <span>Suchaufträge</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/my-watches/buying"
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Suchaufträge</h1>
              <p className="mt-1 text-gray-600">
                Erhalten Sie Benachrichtigungen bei neuen passenden Artikeln
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Neues Suchabo
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Neues Suchabo erstellen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Suchbegriff
                  </label>
                  <input
                    type="text"
                    value={formData.searchTerm}
                    onChange={e => setFormData({ ...formData, searchTerm: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="z.B. Rolex Submariner"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Marke</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="z.B. Rolex"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Modell</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="z.B. Submariner"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Preis von (CHF)
                  </label>
                  <input
                    type="number"
                    value={formData.minPrice}
                    onChange={e => setFormData({ ...formData, minPrice: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Preis bis (CHF)
                  </label>
                  <input
                    type="number"
                    value={formData.maxPrice}
                    onChange={e => setFormData({ ...formData, maxPrice: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Noch keine Suchaufträge</h3>
            <p className="mb-6 text-gray-600">
              Erstellen Sie Ihr erstes Suchabo und erhalten Sie Benachrichtigungen bei neuen
              passenden Artikeln.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              <Plus className="h-5 w-5" />
              Erstes Suchabo erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map(sub => (
              <div
                key={sub.id}
                className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <Search className="h-5 w-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getCriteriaText(sub)}
                      </h3>
                      {sub.isActive ? (
                        <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Aktiv
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Erstellt: {formatDate(sub.createdAt)}</p>
                      <p>
                        Gefundene Artikel: <strong>{sub.matchesFound}</strong>
                      </p>
                      {sub.lastMatchAt && <p>Letzter Match: {formatDate(sub.lastMatchAt)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(sub.id, sub.isActive)}
                      className={`rounded-lg p-2 transition-colors ${
                        sub.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={sub.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {sub.isActive ? (
                        <BellOff className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(sub.id)}
                      className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200"
                      title="Löschen"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Suchabo löschen?</h3>
              <p className="mb-6 text-gray-600">
                Möchten Sie dieses Suchabo wirklich löschen? Diese Aktion kann nicht rückgängig
                gemacht werden.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-lg bg-[#ef4444] px-4 py-2 text-white transition-colors hover:bg-[#dc2626]"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
