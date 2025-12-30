'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Download,
  Eye,
  EyeOff,
  Filter,
  Flag,
  History,
  Loader2,
  MessageSquare,
  Package,
  Search,
  Shield,
  Tag,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

// RICARDO-STYLE: Status-Typen
type DisplayStatus = 'pending' | 'approved' | 'blocked' | 'removed' | 'ended' | 'sold'

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
  isActive: boolean // Legacy
  displayStatus?: DisplayStatus // RICARDO-STYLE
  moderationStatus?: string | null
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
    id: string
    name: string | null
    nickname: string | null
    email: string | null
  }
}

export default function AdminModerateWatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  // RICARDO-STYLE: Neue Filter-Optionen
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'blocked' | 'removed' | 'ended'
  >('all')
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

  // Ricardo-Style: Remove/Block modal state (Soft Delete)
  // RICARDO: Kein 'delete' mehr - nur 'remove' (entfernen) und 'block' (sperren)
  const [removeModal, setRemoveModal] = useState<{
    open: boolean
    watchId: string | null
    watchTitle: string | null
    action: 'remove' | 'block' // remove=entfernen, block=sperren
    reason: string
    hasTransactions: boolean // Artikel hat Gebote/Käufe = nur Soft Delete möglich
    stats?: {
      bids: number
      purchases: number
      activeOrders: number
    }
    isProcessing: boolean
  }>({
    open: false,
    watchId: null,
    watchTitle: null,
    action: 'remove',
    reason: '',
    hasTransactions: false,
    isProcessing: false,
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true
    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadWatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.error('Fehler beim Laden der Angebote. Bitte Seite neu laden.', {
          duration: 4000,
          icon: '❌',
        })
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

  // ===========================================
  // RICARDO-STYLE: Kein Toggle mehr!
  // Artikel werden nur genehmigt, entfernt oder gesperrt
  // ===========================================

  // Genehmigen (für ausstehende Artikel)
  const approveWatch = async (watchId: string) => {
    const watch = watches.find(w => w.id === watchId)
    const watchTitle = watch?.title || 'Angebot'

    try {
      const res = await fetch('/api/admin/watches/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          watchIds: [watchId],
        }),
      })

      if (res.ok) {
        toast.success(`✓ "${watchTitle}" wurde genehmigt`, {
          duration: 3000,
          icon: '✅',
        })
        await loadWatches()
      } else {
        const data = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        toast.error(data.message || 'Fehler beim Genehmigen', { icon: '❌' })
      }
    } catch (error: any) {
      toast.error(`Fehler: ${error.message || 'Netzwerkfehler'}`, { icon: '❌' })
    }
  }

  // RICARDO-STYLE: Entfernen oder Sperren (Soft Delete)
  const removeOrBlockWatch = async (
    watchId: string,
    action: 'remove' | 'block',
    reason: string
  ) => {
    try {
      const url = `/api/watches/${watchId}?action=${action}&reason=${encodeURIComponent(reason)}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))

      if (res.ok) {
        const actionText = action === 'block' ? 'gesperrt' : 'entfernt'
        toast.success(data.message || `Angebot ${actionText}`)
        loadWatches()
        if (selectedWatch?.id === watchId) {
          setSelectedWatch(null)
        }
        setRemoveModal(prev => ({ ...prev, open: false, isProcessing: false }))
      } else {
        console.error('Remove/block error:', data)
        toast.error(data.message || 'Fehler bei der Aktion')
      }
    } catch (error: any) {
      console.error('Error removing/blocking watch:', error)
      toast.error(error.message || 'Fehler bei der Aktion')
    }
  }

  // Öffne Modal zum Entfernen/Sperren
  const initiateRemove = (watchId: string, action: 'remove' | 'block' = 'remove') => {
    const watch = watches.find(w => w.id === watchId)

    setRemoveModal({
      open: true,
      watchId,
      watchTitle: watch?.title || 'Unbekannter Artikel',
      action,
      reason: '',
      hasTransactions: false, // Wird vom Backend bestimmt
      isProcessing: false,
    })
  }

  // Bestätige Entfernen/Sperren
  const confirmRemoveOrBlock = async () => {
    if (!removeModal.watchId) return

    if (!removeModal.reason.trim()) {
      toast.error('Bitte geben Sie einen Grund an')
      return
    }

    setRemoveModal(prev => ({ ...prev, isProcessing: true }))

    try {
      await removeOrBlockWatch(removeModal.watchId, removeModal.action, removeModal.reason)
    } finally {
      setRemoveModal(prev => ({ ...prev, isProcessing: false }))
    }
  }

  // Legacy alias für bestehenden Code
  const initiateDelete = initiateRemove

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

  // RICARDO-STYLE: Bulk-Aktionen (approve, block, remove - kein delete)
  const handleBulkAction = async (action: 'approve' | 'block' | 'remove') => {
    if (selectedWatches.size === 0) {
      toast.error('Bitte wählen Sie mindestens ein Angebot aus')
      return
    }

    const actionLabels: Record<string, string> = {
      approve: 'genehmigen',
      block: 'sperren',
      remove: 'entfernen',
    }

    if (
      (action === 'block' || action === 'remove') &&
      !confirm(`Möchten Sie wirklich ${selectedWatches.size} Angebote ${actionLabels[action]}?`)
    ) {
      return
    }

    try {
      const res = await fetch('/api/admin/watches/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          watchIds: Array.from(selectedWatches),
          reason: `Bulk-${action} durch Admin`,
        }),
      })

      if (res.ok) {
        const pastTense: Record<string, string> = {
          approve: 'genehmigt',
          block: 'gesperrt',
          remove: 'entfernt',
        }
        toast.success(
          `✓ ${selectedWatches.size} Angebot${selectedWatches.size !== 1 ? 'e' : ''} erfolgreich ${pastTense[action]}`,
          {
            duration: 3000,
            icon: '✅',
          }
        )
        setSelectedWatches(new Set())
        loadWatches()
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        toast.error(errorData.message || `Fehler bei Bulk-Aktion: ${action}`, {
          duration: 4000,
          icon: '❌',
        })
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
        toast.success(`✓ CSV-Export erfolgreich erstellt (${filter})`, {
          duration: 3000,
          icon: '📥',
        })
      } else {
        toast.error('Fehler beim CSV-Export. Bitte versuchen Sie es erneut.', {
          duration: 4000,
          icon: '❌',
        })
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
      setSelectedWatches(new Set(filteredWatches.map(w => w.id)))
    }
  }

  const filteredWatches = watches.filter(watch => {
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

  // RICARDO-STYLE: Stats basierend auf displayStatus
  const stats = {
    total: watches.length,
    pending: watches.filter(
      w => w.displayStatus === 'pending' || (!w.displayStatus && w.moderationStatus === 'pending')
    ).length,
    approved: watches.filter(
      w => w.displayStatus === 'approved' || (w.isActive && w.moderationStatus === 'approved')
    ).length,
    blocked: watches.filter(w => w.displayStatus === 'blocked' || w.moderationStatus === 'blocked')
      .length,
    removed: watches.filter(w => w.displayStatus === 'removed' || w.moderationStatus === 'removed')
      .length,
    ended: watches.filter(w => w.displayStatus === 'ended' || w.displayStatus === 'sold').length,
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true
  if (!isAdminInSession) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Angebote moderieren</h1>
              <p className="mt-2 text-gray-600">Prüfen und verwalten Sie alle Angebote</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                CSV Export
              </button>
              <Link
                href="/admin/dashboard"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                ← Zurück zum Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* RICARDO-STYLE Statistiken */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Genehmigt</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesperrt</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entfernt</p>
                <p className="text-2xl font-bold text-amber-600">{stats.removed}</p>
              </div>
              <EyeOff className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Beendet</p>
                <p className="text-2xl font-bold text-gray-600">{stats.ended}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filter und Suche */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suchen nach Titel, Marke, Modell, Verkäufer oder Artikelnummer..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              {/* RICARDO-STYLE Filter */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Alle' },
                  { key: 'pending', label: 'Ausstehend' },
                  { key: 'approved', label: 'Genehmigt' },
                  { key: 'blocked', label: 'Gesperrt' },
                  { key: 'removed', label: 'Entfernt' },
                  { key: 'ended', label: 'Beendet' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      filter === key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            {/* Erweiterte Filter */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kategorie</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Verkäufer</label>
                  <select
                    value={selectedSellerVerified}
                    onChange={e => setSelectedSellerVerified(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Alle</option>
                    <option value="true">Verifiziert</option>
                    <option value="false">Nicht verifiziert</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Von Datum</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bis Datum</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RICARDO-STYLE Bulk-Aktionen */}
        {selectedWatches.size > 0 && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedWatches.size} Angebot{selectedWatches.size !== 1 ? 'e' : ''} ausgewählt
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
                  title="Genehmigen (approved)"
                >
                  <CheckCircle className="h-4 w-4" />
                  Genehmigen
                </button>
                <button
                  onClick={() => handleBulkAction('remove')}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-700"
                  title="Entfernen (Soft Delete)"
                >
                  <EyeOff className="h-4 w-4" />
                  Entfernen
                </button>
                <button
                  onClick={() => handleBulkAction('block')}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                  title="Sperren (Soft Delete)"
                >
                  <Shield className="h-4 w-4" />
                  Sperren
                </button>
                <button
                  onClick={() => setSelectedWatches(new Set())}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste der Angebote */}
        <div className="rounded-lg bg-white shadow">
          {filteredWatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Angebote vorhanden'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Select All */}
              <div className="border-b border-gray-200 p-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedWatches.size === filteredWatches.length && filteredWatches.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Alle auswählen</span>
                </label>
              </div>

              {filteredWatches.map(watch => {
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
                    className={`p-6 transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex gap-6">
                      <div className="flex flex-shrink-0 items-start pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleWatchSelection(watch.id)}
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-200">
                          {mainImage.startsWith('data:') ||
                          mainImage.startsWith('blob:') ||
                          mainImage.includes('blob.vercel-storage.com') ? (
                            <img
                              src={mainImage}
                              alt={watch.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Image
                              src={mainImage}
                              alt={watch.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* RICARDO-STYLE Status-Badge */}
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                              {(() => {
                                const status =
                                  watch.displayStatus || watch.moderationStatus || 'pending'
                                switch (status) {
                                  case 'approved':
                                    return (
                                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Genehmigt
                                      </span>
                                    )
                                  case 'pending':
                                    return (
                                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                        Ausstehend
                                      </span>
                                    )
                                  case 'blocked':
                                    return (
                                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                        <Shield className="mr-1 h-3 w-3" />
                                        Gesperrt
                                      </span>
                                    )
                                  case 'removed':
                                    return (
                                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                        <EyeOff className="mr-1 h-3 w-3" />
                                        Entfernt
                                      </span>
                                    )
                                  case 'ended':
                                  case 'sold':
                                    return (
                                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                        <XCircle className="mr-1 h-3 w-3" />
                                        {status === 'sold' ? 'Verkauft' : 'Beendet'}
                                      </span>
                                    )
                                  default:
                                    return (
                                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                        <XCircle className="mr-1 h-3 w-3" />
                                        {status}
                                      </span>
                                    )
                                }
                              })()}
                              {watch.pendingReports && watch.pendingReports > 0 && (
                                <span className="flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                                  <Flag className="h-3 w-3" />
                                  {watch.pendingReports} Meldung
                                  {watch.pendingReports !== 1 ? 'en' : ''}
                                </span>
                              )}
                              {watch.articleNumber && (
                                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                                  #{watch.articleNumber}
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(watch.createdAt).toLocaleDateString('de-CH')}
                              </span>
                            </div>
                            <h3 className="mb-1 text-lg font-semibold text-gray-900">
                              {watch.title}
                            </h3>
                            <p className="mb-2 text-sm text-gray-600">
                              {watch.brand} {watch.model} • {watch.condition}
                            </p>
                            {watch.categories && watch.categories.length > 0 && (
                              <div className="mb-2 flex items-center gap-2">
                                <Tag className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {watch.categories.map(c => c.name).join(', ')}
                                </span>
                              </div>
                            )}
                            <p className="mb-2 text-lg font-bold text-primary-600">
                              CHF {new Intl.NumberFormat('de-CH').format(watch.price)}
                            </p>
                            <div className="mb-2 flex items-center gap-4 text-sm text-gray-500">
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
                                  <Shield className="h-3 w-3 text-green-600" />
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
                              className="rounded-lg bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
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
                              className="rounded-lg bg-purple-100 p-2 text-purple-700 transition-colors hover:bg-purple-200"
                              title="Historie"
                            >
                              <History className="h-5 w-5" />
                            </button>
                            {/* RICARDO-STYLE: Nur Genehmigen für ausstehende Artikel */}
                            {(watch.displayStatus === 'pending' ||
                              watch.moderationStatus === 'pending' ||
                              !watch.moderationStatus) && (
                              <button
                                onClick={() => approveWatch(watch.id)}
                                className="rounded-lg bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200"
                                title="Genehmigen"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            <Link
                              href={`/products/${watch.id}`}
                              target="_blank"
                              className="rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
                              title="Angebot ansehen"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            {/* RICARDO-STYLE: Entfernen */}
                            <button
                              onClick={() => initiateRemove(watch.id, 'remove')}
                              className="rounded-lg bg-amber-100 p-2 text-amber-700 transition-colors hover:bg-amber-200"
                              title="Entfernen"
                            >
                              <EyeOff className="h-5 w-5" />
                            </button>
                            {/* RICARDO-STYLE: Sperren */}
                            <button
                              onClick={() => initiateRemove(watch.id, 'block')}
                              className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200"
                              title="Sperren"
                            >
                              <Shield className="h-5 w-5" />
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
          <div className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-6">
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
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Neue Notiz hinzufügen..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => addNote(selectedWatch.id)}
                  className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
                >
                  Notiz hinzufügen
                </button>
              </div>
              <div className="space-y-3">
                {selectedWatchNotes.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">Keine Notizen vorhanden</p>
                ) : (
                  selectedWatchNotes.map(note => (
                    <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                      <div className="mb-1 flex items-center justify-between">
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
          <div className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-6">
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
                  <p className="py-8 text-center text-gray-500">Keine Historie vorhanden</p>
                ) : (
                  selectedWatchHistory.map(item => {
                    let detailsObj: any = null
                    try {
                      detailsObj = item.details ? JSON.parse(item.details) : null
                    } catch (e) {
                      // Ignoriere Parse-Fehler
                    }

                    const getActionLabel = () => {
                      switch (item.action) {
                        // RICARDO-STYLE Aktionen
                        case 'approved':
                          return 'Genehmigt'
                        case 'blocked':
                          return 'Gesperrt'
                        case 'removed':
                          return 'Entfernt'
                        case 'ended':
                          return 'Beendet'
                        // Legacy Aktionen
                        case 'activated':
                          return 'Aktiviert (Legacy)'
                        case 'deactivated':
                          return 'Deaktiviert (Legacy)'
                        case 'deleted':
                          return 'Gelöscht'
                        case 'reported':
                          return 'Gemeldet'
                        case 'note_added':
                          return 'Notiz hinzugefügt'
                        case 'edited':
                          return 'Bearbeitet'
                        case 'created':
                          return 'Erstellt'
                        case 'updated':
                          return 'Aktualisiert'
                        default:
                          return item.action
                      }
                    }

                    const getActorLabel = () => {
                      if (
                        detailsObj?.editedBy === 'seller' ||
                        detailsObj?.createdBy === 'seller' ||
                        detailsObj?.updatedBy === 'seller'
                      ) {
                        return 'Verkäufer'
                      }
                      const adminName = item.admin?.nickname || item.admin?.name || 'Unbekannt'
                      const adminEmail = item.admin?.email
                      return adminEmail ? `${adminName} (${adminEmail})` : adminName
                    }

                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">
                            {getActionLabel()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString('de-CH', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="mb-2 text-xs text-gray-600">
                          von <span className="font-medium">{getActorLabel()}</span>
                          {detailsObj?.sellerName && detailsObj?.sellerName !== getActorLabel() && (
                            <span> ({detailsObj.sellerName})</span>
                          )}
                        </div>

                        {/* Zeige Änderungsdetails bei Bearbeitungen */}
                        {(item.action === 'edited' || item.action === 'updated') &&
                          detailsObj?.changes &&
                          Object.keys(detailsObj.changes).length > 0 && (
                            <div className="mt-3 space-y-2 rounded-md bg-blue-50 p-3">
                              <div className="text-xs font-semibold text-blue-900">
                                Geänderte Felder ({Object.keys(detailsObj.changes).length}):
                              </div>
                              {Object.entries(detailsObj.changes).map(
                                ([field, change]: [string, any]) => {
                                  const fieldLabels: Record<string, string> = {
                                    title: 'Titel',
                                    description: 'Beschreibung',
                                    price: 'Preis',
                                    buyNowPrice: 'Sofortkaufpreis',
                                    brand: 'Marke',
                                    model: 'Modell',
                                    condition: 'Zustand',
                                    isAuction: 'Auktionsart',
                                    auctionDuration: 'Auktionsdauer',
                                    auctionEnd: 'Auktionsende',
                                    images: 'Bilder',
                                    video: 'Video',
                                    shippingMethods: 'Versandmethoden',
                                    shippingMethod: 'Versandmethode',
                                    category: 'Kategorie',
                                    subcategory: 'Unterkategorie',
                                    material: 'Material',
                                    movement: 'Werk',
                                    caseDiameter: 'Gehäusedurchmesser',
                                    year: 'Jahr',
                                    referenceNumber: 'Referenznummer',
                                    autoRenew: 'Automatische Verlängerung',
                                    lastRevision: 'Letzte Revision',
                                    accuracy: 'Genauigkeit',
                                    fullset: 'Vollständiges Set',
                                    box: 'Box',
                                    papers: 'Papiere',
                                    warranty: 'Garantie',
                                    warrantyMonths: 'Garantie (Monate)',
                                    warrantyYears: 'Garantie (Jahre)',
                                    warrantyNote: 'Garantie-Notiz',
                                    warrantyDescription: 'Garantie-Beschreibung',
                                    boosters: 'Booster',
                                  }

                                  const formatValue = (value: any) => {
                                    if (value === null || value === undefined)
                                      return 'Nicht gesetzt'
                                    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein'
                                    if (typeof value === 'object') {
                                      try {
                                        return JSON.stringify(value)
                                      } catch {
                                        return String(value)
                                      }
                                    }
                                    if (field === 'price' || field === 'buyNowPrice') {
                                      const numValue = parseFloat(value)
                                      if (isNaN(numValue)) return String(value)
                                      return `CHF ${numValue.toFixed(2)}`
                                    }
                                    if (field === 'images') {
                                      try {
                                        const images =
                                          typeof value === 'string' ? JSON.parse(value) : value
                                        if (Array.isArray(images)) {
                                          return `${images.length} Bild(er)`
                                        }
                                        return String(value)
                                      } catch {
                                        return String(value)
                                      }
                                    }
                                    if (
                                      field === 'auctionEnd' ||
                                      field === 'auctionStart' ||
                                      field === 'lastRevision'
                                    ) {
                                      try {
                                        const date = new Date(value)
                                        return date.toLocaleString('de-CH', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      } catch {
                                        return String(value)
                                      }
                                    }
                                    return String(value)
                                  }

                                  const oldValue = formatValue(change.old)
                                  const newValue = formatValue(change.new)

                                  return (
                                    <div
                                      key={field}
                                      className="flex flex-col gap-1 rounded-md bg-white/60 p-2 text-xs"
                                    >
                                      <div className="font-semibold text-blue-900">
                                        {fieldLabels[field] || field}
                                      </div>
                                      <div className="flex items-center gap-2 text-blue-800">
                                        <span className="text-red-600 line-through">
                                          {oldValue}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-semibold text-green-700">
                                          {newValue}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                }
                              )}
                              {detailsObj.hasBids && (
                                <div className="mt-2 rounded-md bg-yellow-100 p-2 text-xs text-yellow-800">
                                  ⚠️ Bearbeitung mit vorhandenen Geboten (nur
                                  Beschreibung/Bilder/Video)
                                </div>
                              )}
                            </div>
                          )}

                        {/* Zeige Hinweis wenn "updated" ohne Details */}
                        {item.action === 'updated' &&
                          (!detailsObj?.changes ||
                            Object.keys(detailsObj.changes || {}).length === 0) && (
                            <div className="mt-3 rounded-md bg-gray-50 p-3">
                              <div className="text-xs text-gray-600">
                                {detailsObj?.note ||
                                  'Automatische Aktualisierung (keine Details verfügbar)'}
                              </div>
                            </div>
                          )}

                        {/* Zeige andere Details */}
                        {detailsObj?.reason && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Grund:</span> {detailsObj.reason}
                          </div>
                        )}
                        {detailsObj?.note && (
                          <div className="mt-2 rounded-md bg-gray-100 p-2 text-xs text-gray-700">
                            {detailsObj.note}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RICARDO-STYLE: Remove/Block Modal (Soft Delete) */}
      {removeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              !removeModal.isProcessing && setRemoveModal(prev => ({ ...prev, open: false }))
            }
          />
          <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div
              className={`px-6 py-4 ${
                removeModal.action === 'block'
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  {removeModal.action === 'block' ? (
                    <Shield className="h-6 w-6 text-white" />
                  ) : (
                    <EyeOff className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {removeModal.action === 'block' ? 'Angebot sperren' : 'Angebot entfernen'}
                  </h3>
                  <p className="text-sm text-white/80">Ricardo-Prinzip: Daten bleiben erhalten</p>
                </div>
                {!removeModal.isProcessing && (
                  <button
                    onClick={() => setRemoveModal(prev => ({ ...prev, open: false }))}
                    className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
                    aria-label="Schließen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Article info */}
              <div className="mb-4 rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Artikel</p>
                <p className="font-semibold text-gray-900">{removeModal.watchTitle}</p>
              </div>

              {/* Action Selection */}
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Aktion wählen:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRemoveModal(prev => ({ ...prev, action: 'remove' }))}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      removeModal.action === 'remove'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <EyeOff className="mx-auto mb-1 h-5 w-5" />
                    Entfernen
                  </button>
                  <button
                    onClick={() => setRemoveModal(prev => ({ ...prev, action: 'block' }))}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      removeModal.action === 'block'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="mx-auto mb-1 h-5 w-5" />
                    Sperren
                  </button>
                </div>
              </div>

              {/* Reason Input */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Grund (erforderlich) *
                </label>
                <textarea
                  value={removeModal.reason}
                  onChange={e => setRemoveModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={
                    removeModal.action === 'block'
                      ? 'z.B. Verstoss gegen AGB, Betrugsverdacht...'
                      : 'z.B. Auf Wunsch des Verkäufers, Doppeltes Inserat...'
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  rows={3}
                />
              </div>

              {/* Info Box */}
              <div className="mb-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">Ricardo-Prinzip</h4>
                    <p className="mt-1 text-sm text-blue-800">
                      {removeModal.action === 'block' ? (
                        <>
                          Gesperrte Artikel werden aus der Suche entfernt und sind nicht mehr
                          kaufbar. Alle Daten (Gebote, Käufe, Zahlungen) bleiben für rechtliche
                          Zwecke erhalten.
                        </>
                      ) : (
                        <>
                          Entfernte Artikel werden aus der öffentlichen Ansicht ausgeblendet. Alle
                          Transaktionsdaten bleiben für Buchhaltung und Rechtliches erhalten.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* What will happen */}
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-medium">Bei dieser Aktion wird:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Artikel aus öffentlicher Suche entfernt
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Verkäufer per E-Mail informiert
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Aktion in Historie dokumentiert
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Alle Daten bleiben erhalten
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setRemoveModal(prev => ({ ...prev, open: false }))}
                disabled={removeModal.isProcessing}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmRemoveOrBlock}
                disabled={removeModal.isProcessing || !removeModal.reason.trim()}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${
                  removeModal.action === 'block'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {removeModal.isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : removeModal.action === 'block' ? (
                  <>
                    <Shield className="h-5 w-5" />
                    Sperren
                  </>
                ) : (
                  <>
                    <EyeOff className="h-5 w-5" />
                    Entfernen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
