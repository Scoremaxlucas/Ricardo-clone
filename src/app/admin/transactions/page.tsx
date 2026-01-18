'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Filter,
  History,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Transaction {
  id: string
  orderNumber: string | null
  type: 'order' | 'legacy_purchase'
  source: 'order' | 'purchase'
  price: number
  shippingCost: number
  platformFee: number
  protectionFee: number | null
  totalAmount: number
  status: string
  paymentStatus: string
  paymentMethod: string | null
  buyerId: string
  buyerName: string
  buyerEmail: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  watchId: string
  watchTitle: string
  watchBrand: string | null
  watchModel: string | null
  paidAt: string | null
  createdAt: string
}

interface Stats {
  totalOrders: number
  paidOrders: number
  orderRevenue: number
  platformFees: number
  legacyPurchases: number
  completedLegacyPurchases: number
  legacyRevenue: number
  totalTransactions: number
  totalRevenue: number
  platformMargin: number
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'orders' | 'legacy'>('all')
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    paidOrders: 0,
    orderRevenue: 0,
    platformFees: 0,
    legacyPurchases: 0,
    completedLegacyPurchases: 0,
    legacyRevenue: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    platformMargin: 0,
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

    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  const loadTransactions = async () => {
    try {
      const res = await fetch(`/api/admin/transactions?source=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setStats(data.stats || stats)
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        alert('Fehler beim Laden der Transaktionen: ' + (errorData.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      alert(
        'Fehler beim Laden der Transaktionen: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && (session.user as { isAdmin?: boolean })?.isAdmin) {
      loadTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

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
  if (!isAdminInSession) return null

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'released') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <ArrowUpRight className="mr-1 h-3 w-3" />
          Ausgezahlt
        </span>
      )
    }
    if (paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          <CreditCard className="mr-1 h-3 w-3" />
          Bezahlt
        </span>
      )
    }
    if (paymentStatus === 'refunded') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          <ArrowDownRight className="mr-1 h-3 w-3" />
          Erstattet
        </span>
      )
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Abgeschlossen
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        {status}
      </span>
    )
  }

  const getSourceBadge = (source: string) => {
    if (source === 'order') {
      return (
        <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
          <Package className="mr-1 h-3 w-3" />
          Order
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        <History className="mr-1 h-3 w-3" />
        Legacy
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaktionen</h1>
              <p className="mt-2 text-gray-600">Übersicht aller Käufe und Verkäufe</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>

        {/* Statistiken */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  CHF {stats.totalRevenue.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Orders: CHF {stats.orderRevenue.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Plattform-Gebühren</p>
                <p className="mt-2 text-2xl font-bold text-primary-600">
                  CHF {stats.platformFees.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="mt-1 text-xs text-gray-500">{stats.paidOrders} bezahlt</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Legacy-Käufe</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.legacyPurchases}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.completedLegacyPurchases} abgeschlossen
                </p>
              </div>
              <History className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex gap-2">
            {(['all', 'orders', 'legacy'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'Alle' : f === 'orders' ? 'Orders' : 'Legacy'}
              </button>
            ))}
          </div>
        </div>

        {/* Transaktionsliste */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Alle Transaktionen ({transactions.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Artikel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Käufer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Verkäufer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Gebühr
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                      <br />
                      <span className="text-xs">
                        {new Date(transaction.createdAt).toLocaleTimeString('de-CH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getSourceBadge(transaction.source)}
                      {transaction.orderNumber && (
                        <div className="mt-1 text-xs text-gray-500">#{transaction.orderNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${transaction.watchId}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {transaction.watchTitle}
                      </Link>
                      {transaction.watchBrand && (
                        <div className="text-xs text-gray-500">
                          {transaction.watchBrand} {transaction.watchModel}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{transaction.buyerName}</div>
                      <div className="text-xs text-gray-500">{transaction.buyerEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{transaction.sellerName}</div>
                      <div className="text-xs text-gray-500">{transaction.sellerEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(transaction.status, transaction.paymentStatus)}
                      {transaction.paymentMethod && (
                        <div className="mt-1 text-xs text-gray-500">
                          {transaction.paymentMethod === 'stripe'
                            ? 'Karte'
                            : transaction.paymentMethod === 'bank_transfer'
                              ? 'Überweisung'
                              : transaction.paymentMethod === 'cash_on_pickup'
                                ? 'Bar'
                                : transaction.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                      CHF {transaction.price.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-primary-600">
                      CHF{' '}
                      {transaction.platformFee.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && (
            <div className="py-12 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Transaktionen</h3>
              <p className="mt-1 text-sm text-gray-500">
                Es wurden noch keine Transaktionen getätigt.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
