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

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie dieses Suchabo wirklich löschen?')) return

    try {
      const response = await fetch(`/api/search-subscriptions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Suchabo gelöscht')
        loadSubscriptions()
      } else {
        toast.error('Fehler beim Löschen des Suchabos')
      }
    } catch (error) {
      console.error('Error deleting subscription:', error)
      toast.error('Fehler beim Löschen des Suchabos')
    }
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <Link href="/my-watches/buying" className="text-primary-600 hover:text-primary-700">
            Mein Kaufen
          </Link>
          <span className="mx-2">›</span>
          <span>Suchaufträge</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/my-watches/buying"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Suchaufträge</h1>
              <p className="text-gray-600 mt-1">Erhalten Sie Benachrichtigungen bei neuen passenden Artikeln</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Neues Suchabo
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Neues Suchabo erstellen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suchbegriff
                  </label>
                  <input
                    type="text"
                    value={formData.searchTerm}
                    onChange={(e) => setFormData({ ...formData, searchTerm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="z.B. Rolex Submariner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marke
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="z.B. Rolex"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modell
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="z.B. Submariner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preis von (CHF)
                  </label>
                  <input
                    type="number"
                    value={formData.minPrice}
                    onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preis bis (CHF)
                  </label>
                  <input
                    type="number"
                    value={formData.maxPrice}
                    onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Noch keine Suchaufträge</h3>
            <p className="text-gray-600 mb-6">
              Erstellen Sie Ihr erstes Suchabo und erhalten Sie Benachrichtigungen bei neuen passenden Artikeln.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5" />
              Erstes Suchabo erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Search className="h-5 w-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getCriteriaText(sub)}
                      </h3>
                      {sub.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Aktiv
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Erstellt: {formatDate(sub.createdAt)}</p>
                      <p>Gefundene Artikel: <strong>{sub.matchesFound}</strong></p>
                      {sub.lastMatchAt && (
                        <p>Letzter Match: {formatDate(sub.lastMatchAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(sub.id, sub.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
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
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
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
      </div>
      <Footer />
    </div>
  )
}





