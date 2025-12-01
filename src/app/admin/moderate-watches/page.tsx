'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  Search,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Filter,
  Download,
  FileText,
  User,
  Calendar,
  Tag,
  MessageSquare,
  History,
  CheckSquare,
  X,
  Flag,
  Shield,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'

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
  articleNumber: number | null
  seller: {
    id: string
    name: string | null
    email: string
    nickname: string | null
    verified: boolean
  }
  isActive: boolean
  viewCount?: number
  favoriteCount?: number
  pendingReports?: number
  noteCount?: number
  categories?: Array<{ name: string; slug: string }>
}

interface AdminNote {
  id: string
  note: string
  createdAt: string
  admin: {
    name: string | null
    nickname: string | null
    email: string
  }
}

interface ModerationHistoryItem {
  id: string
  action: string
  details: string | null
  createdAt: string
  admin: {
    name: string | null
    nickname: string | null
  }
}

export default function AdminModerateWatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'reported'>('all')
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null)
  const [selectedWatchNotes, setSelectedWatchNotes] = useState<AdminNote[]>([])
  const [selectedWatchHistory, setSelectedWatchHistory] = useState<ModerationHistoryItem[]>([])
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSellerVerified, setSelectedSellerVerified] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedWatches, setSelectedWatches] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

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
  }, [session, status, router, filter, selectedCategory, selectedSellerVerified, dateFrom, dateTo])

  const loadWatches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        filter,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedSellerVerified && { sellerVerified: selectedSellerVerified }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })
      const res = await fetch(`/api/admin/watches?${params}`)
      if (res.ok) {
        const data = await res.json()
        const allWatches = data.watches || []
        setWatches(allWatches)
      } else {
        toast.error(t.admin.errorLoadingOffers)
      }
    } catch (error) {
      console.error('Error loading watches:', error)
      toast.error('Fehler beim Laden der Angebote')
    } finally {
      setLoading(false)
    }
  }

  const loadWatchNotes = async (watchId: string) => {
    try {
      const res = await fetch(`/api/admin/watches/${watchId}/notes`)
      if (res.ok) {
        const data = await res.json()
        setSelectedWatchNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    }
  }

  const loadWatchHistory = async (watchId: string) => {
    try {
      const res = await fetch(`/api/admin/watches/${watchId}/history`)
      if (res.ok) {
        const data = await res.json()
        setSelectedWatchHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const toggleWatchStatus = async (watchId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/watches/${watchId}/edit-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))

      if (res.ok) {
        toast.success(data.message || (!currentStatus ? t.admin.offerActivated : t.admin.offerDeactivated))
        // Aktualisiere den Watch-State direkt mit den neuen Daten
        if (data.watch) {
          setWatches((prevWatches) =>
            prevWatches.map((w: any) =>
              w.id === watchId
                ? { ...w, isActive: data.watch.isActive, moderationStatus: data.watch.moderationStatus }
                : w
            )
          )
          // Aktualisiere auch den ausgewählten Watch
          if (selectedWatch?.id === watchId) {
            setSelectedWatch({
              ...selectedWatch,
              isActive: data.watch.isActive,
              moderationStatus: data.watch.moderationStatus,
            })
          }
        } else {
          // Fallback: Lade alle Watches neu
          await loadWatches()
        }
      } else {
        console.error('Status update error:', data)
        toast.error(data.message || t.admin.errorChangingStatus)
      }
    } catch (error: any) {
      console.error('Error toggling watch status:', error)
      toast.error(error.message || 'Fehler beim Ändern des Status')
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

      const data = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))

      if (res.ok) {
        toast.success(data.message || t.admin.offerDeleted)
        loadWatches()
        if (selectedWatch?.id === watchId) {
          setSelectedWatch(null)
        }
      } else {
        console.error('Delete error:', data)
        toast.error(data.message || t.admin.errorDeletingOffer)
      }
    } catch (error: any) {
      console.error('Error deleting watch:', error)
      toast.error(error.message || 'Fehler beim Löschen des Angebots')
    }
  }

  const addNote = async (watchId: string) => {
    if (!newNote.trim()) {
      toast.error(t.admin.noteEmpty)
      return
    }

    try {
      const res = await fetch(`/api/admin/watches/${watchId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })

      if (res.ok) {
        toast.success(t.admin.noteAdded)
        setNewNote('')
        await loadWatchNotes(watchId)
      } else {
        toast.error(t.admin.errorAddingNote)
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Fehler beim Hinzufügen der Notiz')
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedWatches.size === 0) {
      toast.error('Bitte wählen Sie mindestens ein Angebot aus')
      return
    }

    if (action === 'delete' && !confirm(`Möchten Sie wirklich ${selectedWatches.size} Angebote löschen?`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/watches/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          watchIds: Array.from(selectedWatches),
        }),
      })

      if (res.ok) {
        toast.success(`Bulk-Aktion erfolgreich ausgeführt`)
        setSelectedWatches(new Set())
        loadWatches()
      } else {
        toast.error('Fehler bei Bulk-Aktion')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Fehler bei Bulk-Aktion')
    }
  }

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams({ filter })
      const res = await fetch(`/api/admin/watches/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `helvenda-angebote-${filter}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Export erfolgreich')
      } else {
        toast.error('Fehler beim Export')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Fehler beim Export')
    }
  }

  const toggleWatchSelection = (watchId: string) => {
    const newSelection = new Set(selectedWatches)
    if (newSelection.has(watchId)) {
      newSelection.delete(watchId)
    } else {
      newSelection.add(watchId)
    }
    setSelectedWatches(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedWatches.size === filteredWatches.length) {
      setSelectedWatches(new Set())
    } else {
      setSelectedWatches(new Set(filteredWatches.map((w) => w.id)))
    }
  }

  const filteredWatches = watches.filter((watch) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        watch.title.toLowerCase().includes(query) ||
        watch.brand.toLowerCase().includes(query) ||
        watch.model.toLowerCase().includes(query) ||
        watch.seller.email.toLowerCase().includes(query) ||
        (watch.articleNumber && watch.articleNumber.toString().includes(query))
      )
    }
    return true
  })

  const stats = {
    total: watches.length,
    active: watches.filter((w) => w.isActive).length,
    inactive: watches.filter((w) => !w.isActive).length,
    reported: watches.filter((w) => (w.pendingReports || 0) > 0).length,
    pending: watches.filter((w) => !w.isActive && (w as any).moderationStatus === 'pending').length,
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
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV Export
              </button>
              <Link
                href="/admin/dashboard"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Zurück zum Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
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
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gemeldet</p>
                <p className="text-2xl font-bold text-orange-600">{stats.reported}</p>
              </div>
              <Flag className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filter und Suche */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suchen nach Titel, Marke, Modell, Verkäufer oder Artikelnummer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'active', 'inactive', 'reported'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption === 'all'
                      ? 'Alle'
                      : filterOption === 'pending'
                      ? 'Ausstehend'
                      : filterOption === 'active'
                      ? 'Aktiv'
                      : filterOption === 'inactive'
                      ? 'Inaktiv'
                      : 'Gemeldet'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            {/* Erweiterte Filter */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Alle</option>
                    <option value="auto-motorrad">Auto & Motorrad</option>
                    <option value="uhren-schmuck">Uhren & Schmuck</option>
                    <option value="kleidung-accessoires">Kleidung & Accessoires</option>
                    <option value="sport">Sport</option>
                    <option value="computer-netzwerk">Computer & Netzwerk</option>
                    <option value="handy-telefon">Handy & Telefon</option>
                    <option value="foto-optik">Foto & Optik</option>
                    <option value="haushalt-wohnen">Haushalt & Wohnen</option>
                    <option value="handwerk-garten">Handwerk & Garten</option>
                    <option value="games-konsolen">Games & Konsolen</option>
                    <option value="musik-instrumente">Musik & Instrumente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verkäufer</label>
                  <select
                    value={selectedSellerVerified}
                    onChange={(e) => setSelectedSellerVerified(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Alle</option>
                    <option value="true">Verifiziert</option>
                    <option value="false">Nicht verifiziert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Von Datum</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bis Datum</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk-Aktionen */}
        {selectedWatches.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedWatches.size} Angebot{selectedWatches.size !== 1 ? 'e' : ''} ausgewählt
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Aktivieren
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  Deaktivieren
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setSelectedWatches(new Set())}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste der Angebote */}
        <div className="bg-white rounded-lg shadow">
          {filteredWatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Angebote vorhanden'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Select All */}
              <div className="p-4 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWatches.size === filteredWatches.length && filteredWatches.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Alle auswählen</span>
                </label>
              </div>

              {filteredWatches.map((watch) => {
                const images = Array.isArray(watch.images)
                  ? watch.images
                  : watch.images
                  ? JSON.parse(watch.images)
                  : []
                const mainImage = images[0] || '/placeholder-watch.jpg'
                const isSelected = selectedWatches.has(watch.id)

                return (
                  <div
                    key={watch.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleWatchSelection(watch.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
                        />
                      </div>
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
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              {watch.isActive ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Aktiv
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                  Inaktiv
                                </span>
                              )}
                              {watch.pendingReports && watch.pendingReports > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  {watch.pendingReports} Meldung{watch.pendingReports !== 1 ? 'en' : ''}
                                </span>
                              )}
                              {watch.articleNumber && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                  #{watch.articleNumber}
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(watch.createdAt).toLocaleDateString('de-CH')}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{watch.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {watch.brand} {watch.model} • {watch.condition}
                            </p>
                            {watch.categories && watch.categories.length > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <Tag className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {watch.categories.map((c) => c.name).join(', ')}
                                </span>
                              </div>
                            )}
                            <p className="text-lg font-bold text-primary-600 mb-2">
                              CHF {new Intl.NumberFormat('de-CH').format(watch.price)}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {watch.viewCount || 0} Aufrufe
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                {watch.favoriteCount || 0} Favoriten
                              </div>
                              {watch.noteCount && watch.noteCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  {watch.noteCount} Notiz{watch.noteCount !== 1 ? 'en' : ''}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/users?search=${encodeURIComponent(watch.seller.email)}`}
                                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                              >
                                <User className="h-4 w-4" />
                                {watch.seller.nickname || watch.seller.name || watch.seller.email}
                                {watch.seller.verified && (
                                  <Shield className="h-3 w-3 text-green-600" title="Verifiziert" />
                                )}
                              </Link>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedWatch(watch)
                                loadWatchNotes(watch.id)
                                setShowNotesModal(true)
                              }}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Notizen"
                            >
                              <MessageSquare className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWatch(watch)
                                loadWatchHistory(watch.id)
                                setShowHistoryModal(true)
                              }}
                              className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                              title="Historie"
                            >
                              <History className="h-5 w-5" />
                            </button>
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
                              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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

      {/* Notizen Modal */}
      {showNotesModal && selectedWatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Notizen: {selectedWatch.title}</h2>
              <button
                onClick={() => {
                  setShowNotesModal(false)
                  setSelectedWatch(null)
                  setNewNote('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Neue Notiz hinzufügen..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => addNote(selectedWatch.id)}
                  className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Notiz hinzufügen
                </button>
              </div>
              <div className="space-y-3">
                {selectedWatchNotes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Keine Notizen vorhanden</p>
                ) : (
                  selectedWatchNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {note.admin.nickname || note.admin.name || note.admin.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleString('de-CH')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historie Modal */}
      {showHistoryModal && selectedWatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Historie: {selectedWatch.title}</h2>
              <button
                onClick={() => {
                  setShowHistoryModal(false)
                  setSelectedWatch(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {selectedWatchHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Keine Historie vorhanden</p>
                ) : (
                  selectedWatchHistory.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {item.action === 'activated'
                            ? 'Aktiviert'
                            : item.action === 'deactivated'
                            ? 'Deaktiviert'
                            : item.action === 'deleted'
                            ? 'Gelöscht'
                            : item.action === 'reported'
                            ? 'Gemeldet'
                            : item.action === 'note_added'
                            ? 'Notiz hinzugefügt'
                            : item.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString('de-CH')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        von {item.admin.nickname || item.admin.name || 'Unbekannt'}
                      </div>
                      {item.details && (
                        <div className="mt-2 text-xs text-gray-500">
                          {JSON.parse(item.details).reason && (
                            <span>Grund: {JSON.parse(item.details).reason}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
