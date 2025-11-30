'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Search, Eye, EyeOff, Trash2, AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Watch {
  id: string
  title: string
  description: string | null
  brand: string
  model: string
  price: number
  images: string[] | string
  condition: string
  createdAt: string
  seller: {
    id: string
    name: string | null
    email: string
    nickname: string | null
  }
  isActive: boolean
}

export default function AdminModerateWatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadWatches()
  }, [session, status, router, filter])

  const loadWatches = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/watches?filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        const allWatches = data.watches || []
        setWatches(allWatches)
      } else {
        toast.error('Fehler beim Laden der Angebote')
      }
    } catch (error) {
      console.error('Error loading watches:', error)
      toast.error('Fehler beim Laden der Angebote')
    } finally {
      setLoading(false)
    }
  }

  const toggleWatchStatus = async (watchId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/watches/${watchId}/edit-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (res.ok) {
        toast.success(`Angebot ${!currentStatus ? 'aktiviert' : 'deaktiviert'}`)
        loadWatches()
        if (selectedWatch?.id === watchId) {
          setSelectedWatch({ ...selectedWatch, isActive: !currentStatus })
        }
      } else {
        toast.error('Fehler beim Ändern des Status')
      }
    } catch (error) {
      console.error('Error toggling watch status:', error)
      toast.error('Fehler beim Ändern des Status')
    }
  }

  const deleteWatch = async (watchId: string) => {
    if (!confirm('Möchten Sie dieses Angebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    try {
      const res = await fetch(`/api/watches/${watchId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Angebot erfolgreich gelöscht')
        loadWatches()
        if (selectedWatch?.id === watchId) {
          setSelectedWatch(null)
        }
      } else {
        toast.error('Fehler beim Löschen des Angebots')
      }
    } catch (error) {
      console.error('Error deleting watch:', error)
      toast.error('Fehler beim Löschen des Angebots')
    }
  }

  const filteredWatches = watches.filter((watch) => {
    if (filter === 'active' && !watch.isActive) return false
    if (filter === 'inactive' && watch.isActive) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        watch.title.toLowerCase().includes(query) ||
        watch.brand.toLowerCase().includes(query) ||
        watch.model.toLowerCase().includes(query) ||
        watch.seller.email.toLowerCase().includes(query)
      )
    }
    return true
  })

  const stats = {
    total: watches.length,
    active: watches.filter((w) => w.isActive).length,
    inactive: watches.filter((w) => !w.isActive).length,
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
  if (!isAdminInSession) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Angebote moderieren</h1>
              <p className="mt-2 text-gray-600">Prüfen und verwalten Sie alle Angebote</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktiv</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inaktiv</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filter und Suche */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suchen nach Titel, Marke, Modell oder Verkäufer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'inactive'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption === 'all' ? 'Alle' : filterOption === 'active' ? 'Aktiv' : 'Inaktiv'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste der Angebote */}
        <div className="bg-white rounded-lg shadow">
          {filteredWatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Angebote vorhanden'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredWatches.map((watch) => {
                const images = Array.isArray(watch.images) ? watch.images : (watch.images ? JSON.parse(watch.images) : [])
                const mainImage = images[0] || '/placeholder-watch.jpg'

                return (
                  <div
                    key={watch.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src={mainImage}
                            alt={watch.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {watch.isActive ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Aktiv
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                  Inaktiv
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(watch.createdAt).toLocaleDateString('de-CH')}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {watch.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {watch.brand} {watch.model} • {watch.condition}
                            </p>
                            <p className="text-lg font-bold text-primary-600 mb-2">
                              CHF {new Intl.NumberFormat('de-CH').format(watch.price)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Verkäufer: {watch.seller.nickname || watch.seller.name || watch.seller.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleWatchStatus(watch.id, watch.isActive)}
                              className={`p-2 rounded-lg transition-colors ${
                                watch.isActive
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title={watch.isActive ? 'Deaktivieren' : 'Aktivieren'}
                            >
                              {watch.isActive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                            <Link
                              href={`/products/${watch.id}`}
                              target="_blank"
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Angebot ansehen"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => deleteWatch(watch.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Löschen"
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

