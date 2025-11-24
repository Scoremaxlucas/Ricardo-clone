'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Eye, Filter } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'

interface Dispute {
  id: string
  purchaseId: string
  watchId: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    price: number
  }
  buyer: {
    id: string
    name: string
    email: string
  }
  seller: {
    id: string
    name: string
    email: string
  }
  disputeReason: string
  disputeDescription: string
  disputeStatus: string
  disputeOpenedAt: string | null
  disputeResolvedAt: string | null
  disputeResolvedBy: string | null
  purchaseStatus: string
  purchasePrice: number | null
  createdAt: string
}

interface Stats {
  total: number
  pending: number
  resolved: number
  closed: number
}

export default function AdminDisputesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, resolved: 0, closed: 0 })
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'closed'>('all')
  const [sortBy, setSortBy] = useState<'openedAt' | 'resolvedAt'>('openedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    // Prüfe Admin-Status nur aus Session
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadDisputes()
  }, [session, status, router, filter, sortBy, sortOrder])

  const loadDisputes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const res = await fetch(`/api/admin/disputes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDisputes(data.disputes || [])
        setStats(data.stats || { total: 0, pending: 0, resolved: 0, closed: 0 })
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        toast.error('Fehler beim Laden der Disputes: ' + (errorData.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error loading disputes:', error)
      toast.error('Fehler beim Laden der Disputes')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Offen
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gelöst
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Geschlossen
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      item_not_received: 'Artikel nicht erhalten',
      item_damaged: 'Artikel beschädigt',
      item_wrong: 'Falscher Artikel',
      payment_not_confirmed: 'Zahlung nicht bestätigt',
      seller_not_responding: 'Verkäufer antwortet nicht',
      buyer_not_responding: 'Käufer antwortet nicht',
      other: 'Sonstiges'
    }
    return labels[reason] || reason
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  // Prüfe Admin-Status erneut für UI
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

  if (!isAdminInSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite.</p>
          <Link href="/" className="mt-4 text-primary-600 hover:text-primary-700">
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Zurück zum Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Disputes verwalten</h1>
            <p className="mt-2 text-gray-600">Übersicht und Verwaltung aller Streitfälle</p>
          </div>
          <button
            onClick={loadDisputes}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </button>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offen</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelöst</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Geschlossen</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.closed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filter und Sortierung */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Offen ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gelöst ({stats.resolved})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'closed'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Geschlossen ({stats.closed})
            </button>

            <div className="ml-auto flex items-center gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-')
                  setSortBy(by as 'openedAt' | 'resolvedAt')
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="openedAt-desc">Neueste zuerst</option>
                <option value="openedAt-asc">Älteste zuerst</option>
                <option value="resolvedAt-desc">Zuletzt gelöst</option>
                <option value="resolvedAt-asc">Zuerst gelöst</option>
              </select>
            </div>
          </div>
        </div>

        {/* Disputes-Liste */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {disputes.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Keine Disputes gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Artikel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Käufer / Verkäufer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eröffnet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {dispute.watch.images && dispute.watch.images.length > 0 && (
                            <img
                              src={dispute.watch.images[0]}
                              alt={dispute.watch.title}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {dispute.watch.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {dispute.watch.brand} {dispute.watch.model}
                            </div>
                            {dispute.purchasePrice && (
                              <div className="text-xs text-gray-400">
                                CHF {dispute.purchasePrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">Käufer: {dispute.buyer.name}</div>
                          <div className="text-gray-500">Verkäufer: {dispute.seller.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{getReasonLabel(dispute.disputeReason)}</div>
                          <div className="text-gray-500 truncate max-w-xs">
                            {dispute.disputeDescription}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(dispute.disputeStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dispute.disputeOpenedAt
                          ? new Date(dispute.disputeOpenedAt).toLocaleDateString('de-CH', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/disputes/${dispute.id}`}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

