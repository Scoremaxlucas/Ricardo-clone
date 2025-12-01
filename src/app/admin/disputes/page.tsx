'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { AlertTriangle, CheckCircle, Clock, Eye, Filter, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  type?: 'dispute' | 'cancellation'
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'dispute' | 'cancellation'>('all')
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
  }, [session, status, router, filter, typeFilter, sortBy, sortOrder])

  const loadDisputes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const res = await fetch(`/api/admin/disputes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDisputes(data.disputes || [])
        setStats(data.stats || { total: 0, pending: 0, resolved: 0, closed: 0 })
      } else {
        // Nur Fehler loggen, keine Toast-Benachrichtigung
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Error loading disputes:', errorData)
        setDisputes([])
        setStats({ total: 0, pending: 0, resolved: 0, closed: 0 })
      }
    } catch (error) {
      console.error('Error loading disputes:', error)
      setDisputes([])
      setStats({ total: 0, pending: 0, resolved: 0, closed: 0 })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Offen
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Gelöst
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Geschlossen
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
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
      item_damaged_before_shipping: 'Artikel beschädigt vor Versand',
      other: 'Sonstiges',
    }
    return labels[reason] || reason
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  // Prüfe Admin-Status erneut für UI
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

  if (!isAdminInSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/admin/dashboard"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          ← Zurück zum Dashboard
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Disputes & Stornierungsanträge</h1>
            <p className="mt-2 text-gray-600">
              Übersicht und Verwaltung aller Streitfälle und Stornierungsanträge
            </p>
          </div>
          <button
            onClick={loadDisputes}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </button>
        </div>

        {/* Statistiken */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offen</p>
                <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelöst</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Geschlossen</p>
                <p className="mt-1 text-2xl font-bold text-gray-600">{stats.closed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filter und Sortierung */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Typ:</span>
            </div>
            <button
              onClick={() => setTypeFilter('all')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setTypeFilter('dispute')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                typeFilter === 'dispute'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disputes
            </button>
            <button
              onClick={() => setTypeFilter('cancellation')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                typeFilter === 'cancellation'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Stornierungsanträge
            </button>
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Offen ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gelöst ({stats.resolved})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
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
                onChange={e => {
                  const [by, order] = e.target.value.split('-')
                  setSortBy(by as 'openedAt' | 'resolvedAt')
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
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
        <div className="overflow-hidden rounded-lg bg-white shadow">
          {disputes.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Keine Disputes gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Artikel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Käufer / Verkäufer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Grund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Eröffnet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {disputes.map(dispute => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          {dispute.watch.images && dispute.watch.images.length > 0 && (
                            <img
                              src={dispute.watch.images[0]}
                              alt={dispute.watch.title}
                              className="mr-3 h-10 w-10 rounded object-cover"
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
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">Käufer: {dispute.buyer.name}</div>
                          <div className="text-gray-500">Verkäufer: {dispute.seller.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            {dispute.type === 'cancellation' && (
                              <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                                Stornierung
                              </span>
                            )}
                            <span className="font-medium">
                              {getReasonLabel(dispute.disputeReason)}
                            </span>
                          </div>
                          <div className="max-w-xs truncate text-gray-500">
                            {dispute.disputeDescription}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusBadge(dispute.disputeStatus)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {dispute.disputeOpenedAt
                          ? new Date(dispute.disputeOpenedAt).toLocaleDateString('de-CH', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <Link
                          href={`/admin/disputes/${dispute.id}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-900"
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
