'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Shield,
  Loader2,
  Wallet,
  Ban,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Order {
  id: string
  orderNumber: string
  itemPrice: number
  shippingCost: number
  platformFee: number
  protectionFee: number | null
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  stripeTransferId: string | null
  buyerConfirmedReceipt: boolean
  buyerConfirmedAt: string | null
  disputeStatus: string
  disputeReason: string | null
  autoReleaseAt: string | null
  paidAt: string | null
  releasedAt: string | null
  refundedAt: string | null
  createdAt: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    paymentProtectionEnabled: boolean
  }
  buyer: {
    id: string
    name: string | null
    email: string
    firstName: string | null
    lastName: string | null
  }
  seller: {
    id: string
    name: string | null
    email: string
    firstName: string | null
    lastName: string | null
    stripeConnectedAccountId: string | null
    stripeOnboardingComplete: boolean
    connectOnboardingStatus: string
    payoutsEnabled: boolean
    onboardingDebug?: {
      hasAccount: boolean
      stripeOnboardingComplete: boolean
      connectOnboardingStatus: string | null
      payoutsEnabled: boolean
      allComplete: boolean
    }
  }
  paymentRecord: {
    stripeChargeId: string | null
    stripeTransferId: string | null
    transferStatus: string | null
    sellerAmount: number
    platformFee: number
  } | null
  diagnosis: string[]
}

interface Summary {
  total: number
  paid: number
  released: number
  pendingOnboarding: number
  refunded: number
  awaitingPayment: number
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [releasing, setReleasing] = useState<string | null>(null)
  const [holding, setHolding] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/orders')
    }
  }, [status, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/orders?status=${statusFilter}&limit=100`)
      const data = await res.json()

      if (res.ok) {
        setOrders(data.orders || [])
        setSummary(data.summary || null)
      } else {
        toast.error(data.message || 'Fehler beim Laden')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Fehler beim Laden der Bestellungen')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      loadOrders()
    }
  }, [status, statusFilter])

  const handleRelease = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Möchten Sie die Zahlung für Bestellung ${orderNumber} wirklich freigeben?`)) {
      return
    }

    setReleasing(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manuelle Freigabe durch Admin' }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Zahlung freigegeben')
        loadOrders()
      } else {
        toast.error(data.message || 'Fehler bei der Freigabe')
      }
    } catch (error) {
      console.error('Error releasing:', error)
      toast.error('Fehler bei der Freigabe')
    } finally {
      setReleasing(null)
    }
  }

  const handleHold = async (orderId: string, orderNumber: string) => {
    const reason = prompt(`Grund für das Zurückhalten von Bestellung ${orderNumber}:`)
    if (!reason) return

    setHolding(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Zahlung zurückgehalten')
        loadOrders()
      } else {
        toast.error(data.message || 'Fehler beim Zurückhalten')
      }
    } catch (error) {
      console.error('Error holding:', error)
      toast.error('Fehler beim Zurückhalten')
    } finally {
      setHolding(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'released':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            <CheckCircle className="h-3 w-3" />
            Freigegeben
          </span>
        )
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            <DollarSign className="h-3 w-3" />
            Bezahlt
          </span>
        )
      case 'release_pending_onboarding':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
            <Wallet className="h-3 w-3" />
            Wartet auf Onboarding
          </span>
        )
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
            <AlertTriangle className="h-3 w-3" />
            Zurückgehalten
          </span>
        )
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" />
            Erstattet
          </span>
        )
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            <Clock className="h-3 w-3" />
            Warten auf Zahlung
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            {status}
          </span>
        )
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.watch.title.toLowerCase().includes(query) ||
      order.buyer.email.toLowerCase().includes(query) ||
      order.seller.email.toLowerCase().includes(query)
    )
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bestellungen & Zahlungen</h1>
              <p className="mt-1 text-gray-600">
                Verwalten Sie Zahlungen, Freigaben und Dispute
              </p>
            </div>
            <button
              onClick={loadOrders}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-sm text-gray-600">Gesamt</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 shadow">
              <div className="text-2xl font-bold text-blue-700">{summary.paid}</div>
              <div className="text-sm text-blue-600">Bezahlt</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 shadow">
              <div className="text-2xl font-bold text-green-700">{summary.released}</div>
              <div className="text-sm text-green-600">Freigegeben</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 shadow">
              <div className="text-2xl font-bold text-yellow-700">{summary.pendingOnboarding}</div>
              <div className="text-sm text-yellow-600">Warten auf Onboarding</div>
            </div>
            <div className="rounded-lg bg-red-50 p-4 shadow">
              <div className="text-2xl font-bold text-red-700">{summary.refunded}</div>
              <div className="text-sm text-red-600">Erstattet</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 shadow">
              <div className="text-2xl font-bold text-gray-700">{summary.awaitingPayment}</div>
              <div className="text-sm text-gray-600">Warten auf Zahlung</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-white p-4 shadow sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Bestellnummer, Artikel, Käufer oder Verkäufer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Status-Filter"
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">Alle Status</option>
              <option value="paid">Bezahlt</option>
              <option value="released">Freigegeben</option>
              <option value="release_pending_onboarding">Warten auf Onboarding</option>
              <option value="on_hold">Zurückgehalten</option>
              <option value="refunded">Erstattet</option>
              <option value="created">Warten auf Zahlung</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Bestellung
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Artikel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Käufer / Verkäufer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Betrag
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Diagnose
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('de-CH')}
                      </div>
                      {order.watch.paymentProtectionEnabled && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-green-600">
                          <Shield className="h-3 w-3" />
                          Geschützt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {order.watch.images[0] && (
                          <img
                            src={order.watch.images[0]}
                            alt={order.watch.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="max-w-[200px] truncate text-sm font-medium text-gray-900">
                            {order.watch.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.watch.brand} {order.watch.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs">
                        <div className="text-gray-900">
                          <span className="font-medium">K:</span> {order.buyer.email}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">V:</span> {order.seller.email}
                        </div>
                        {order.seller.stripeConnectedAccountId ? (
                          <div className="mt-1 space-y-0.5">
                            <span className="text-green-600">✓ Stripe verbunden</span>
                            {order.seller.onboardingDebug && (
                              <div className="text-[10px] text-gray-500">
                                <div>
                                  Onboarding:{' '}
                                  {order.seller.onboardingDebug.allComplete ? (
                                    <span className="text-green-600">✓ Komplett</span>
                                  ) : (
                                    <span className="text-orange-600">✗ Unvollständig</span>
                                  )}
                                </div>
                                <div className="pl-2">
                                  • stripeOnboardingComplete:{' '}
                                  {order.seller.onboardingDebug.stripeOnboardingComplete
                                    ? '✓'
                                    : '✗'}
                                </div>
                                <div className="pl-2">
                                  • connectOnboardingStatus:{' '}
                                  {order.seller.onboardingDebug.connectOnboardingStatus || 'null'}
                                </div>
                                <div className="pl-2">
                                  • payoutsEnabled:{' '}
                                  {order.seller.onboardingDebug.payoutsEnabled ? '✓' : '✗'}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-600">✗ Kein Stripe</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        CHF {order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Gebühr: CHF {order.platformFee.toFixed(2)}
                      </div>
                      {order.paymentRecord?.sellerAmount && (
                        <div className="text-xs text-green-600">
                          Verkäufer: CHF {order.paymentRecord.sellerAmount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {getStatusBadge(order.paymentStatus)}
                      {order.buyerConfirmedReceipt && (
                        <div className="mt-1 text-xs text-green-600">✓ Erhalt bestätigt</div>
                      )}
                      {order.autoReleaseAt && order.paymentStatus === 'paid' && (
                        <div className="mt-1 text-xs text-gray-500">
                          Auto: {new Date(order.autoReleaseAt).toLocaleDateString('de-CH')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {order.diagnosis.length > 0 ? (
                        <ul className="list-inside list-disc text-xs text-orange-600">
                          {order.diagnosis.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      ) : order.paymentStatus === 'released' ? (
                        <span className="text-xs text-green-600">✓ Alles OK</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Freigeben Button - nur wenn paid */}
                        {order.paymentStatus === 'paid' && (
                          <button
                            onClick={() => handleRelease(order.id, order.orderNumber)}
                            disabled={releasing === order.id}
                            className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {releasing === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <DollarSign className="h-3 w-3" />
                            )}
                            Freigeben
                          </button>
                        )}
                        {/* Zurückhalten Button - nur wenn paid */}
                        {order.paymentStatus === 'paid' && (
                          <button
                            onClick={() => handleHold(order.id, order.orderNumber)}
                            disabled={holding === order.id}
                            className="inline-flex items-center gap-1 rounded bg-orange-600 px-2 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                          >
                            {holding === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Ban className="h-3 w-3" />
                            )}
                            Halten
                          </button>
                        )}
                        {/* Details Link */}
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">Keine Bestellungen gefunden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
