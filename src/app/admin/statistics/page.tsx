'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart3,
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  FileText,
  ArrowLeft,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'

interface Statistics {
  users: {
    total: number
    active: number
    blocked: number
    verified: number
    pendingVerifications: number
    newLast30Days: number
    newLast7Days: number
  }
  watches: {
    total: number
    active: number
    sold: number
    expired: number
    auctions: number
    buyNow: number
    newLast30Days: number
    newLast7Days: number
    successRate: number
    averageSaleDuration: number
  }
  transactions: {
    total: number
    completed: number
    pending: number
    cancelled: number
    totalRevenue: number
    completedRevenue: number
    averagePrice: number
  }
  disputes: {
    pending: number
    resolved: number
    closed: number
    total: number
  }
  categories: Array<{
    category: string
    count: number
  }>
  invoices: {
    total: number
    paid: number
    pending: number
    overdue: number
  }
  dailyStats: Array<{
    date: string
    users: number
    watches: number
    purchases: number
  }>
}

export default function AdminStatisticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      if (status === 'unauthenticated') {
        setLoading(false)
        router.push('/login')
      }
      return
    }

    const isAdminInSession = session?.user?.isAdmin === true

    if (isAdminInSession) {
      loadStatistics()
      return
    }

    fetch('/api/user/admin-status')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          loadStatistics()
        } else {
          setLoading(false)
          router.push('/')
        }
      })
      .catch(error => {
        console.error('Error checking admin status:', error)
        setLoading(false)
        router.push('/')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/statistics')

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        toast.error(
          'Fehler beim Laden der Statistiken: ' + (errorData.message || 'Unbekannter Fehler')
        )
        setLoading(false)
        return
      }

      const data = await res.json()
      setStats(data)
    } catch (error: any) {
      console.error('Error loading statistics:', error)
      toast.error('Fehler beim Laden der Statistiken')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Lädt Statistiken...</p>
        </div>
      </div>
    )
  }

  const isAdminInSession = session?.user?.isAdmin === true

  if (!session || !isAdminInSession) {
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

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Keine Statistiken verfügbar</p>
          <button
            onClick={loadStatistics}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Erneut laden
          </button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-CH').format(num)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistiken</h1>
              <p className="mt-2 text-gray-600">
                Umfassende Übersicht über die Plattform-Aktivitäten
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center font-medium text-gray-600 hover:text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Benutzer-Statistiken */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Users className="h-5 w-5" />
            Benutzer
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamt</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatNumber(stats.users.total)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktiv</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {formatNumber(stats.users.active)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verifiziert</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {formatNumber(stats.users.verified)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Neu (7 Tage)</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600">
                    {formatNumber(stats.users.newLast7Days)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Angebots-Statistiken */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <ShoppingBag className="h-5 w-5" />
            Angebote
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamt</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatNumber(stats.watches.total)}
                  </p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktiv</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {formatNumber(stats.watches.active)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verkauft</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {formatNumber(stats.watches.sold)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Erfolgsrate</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600">
                    {stats.watches.successRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-sm font-medium text-gray-600">Auktionen</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.watches.auctions)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-sm font-medium text-gray-600">Sofortkauf</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.watches.buyNow)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-sm font-medium text-gray-600">Ø Verkaufsdauer</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stats.watches.averageSaleDuration.toFixed(1)} Tage
              </p>
            </div>
          </div>
        </div>

        {/* Transaktions-Statistiken */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <TrendingUp className="h-5 w-5" />
            Transaktionen
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamt</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatNumber(stats.transactions.total)}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {formatNumber(stats.transactions.completed)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {formatCurrency(stats.transactions.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ø Verkaufspreis</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600">
                    {formatCurrency(stats.transactions.averagePrice)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Disputes & Rechnungen */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5" />
              Disputes
            </h2>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Offen</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {formatNumber(stats.disputes.pending)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Gelöst</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatNumber(stats.disputes.resolved)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Geschlossen</span>
                  <span className="text-2xl font-bold text-gray-600">
                    {formatNumber(stats.disputes.closed)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <FileText className="h-5 w-5" />
              Rechnungen
            </h2>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Gesamt</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.invoices.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bezahlt</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatNumber(stats.invoices.paid)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Überfällig</span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatNumber(stats.invoices.overdue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Kategorien */}
        {stats.categories.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <BarChart3 className="h-5 w-5" />
              Beliebbteste Kategorien
            </h2>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="space-y-3">
                {stats.categories.map((cat, index) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 font-medium text-gray-500">{index + 1}.</span>
                      <span className="text-gray-900">{cat.category}</span>
                    </div>
                    <span className="font-semibold text-gray-600">{formatNumber(cat.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Zeitliche Entwicklung */}
        {stats.dailyStats.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Activity className="h-5 w-5" />
              Entwicklung (letzte 7 Tage)
            </h2>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Neue Benutzer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Neue Angebote
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Neue Käufe
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stats.dailyStats.map(day => (
                      <tr key={day.date}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString('de-CH')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatNumber(day.users)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatNumber(day.watches)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatNumber(day.purchases)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}








