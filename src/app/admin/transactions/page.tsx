'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface Transaction {
  id: string
  type: 'purchase' | 'sale'
  price: number
  margin: number
  buyerName: string | null
  buyerEmail: string
  sellerName: string | null
  sellerEmail: string
  watchTitle: string
  watchId: string
  createdAt: string
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    platformMargin: 0,
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    // Prüfe Admin-Status nur aus Session
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
      const res = await fetch('/api/admin/transactions')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setStats(data.stats || stats)
      } else {
        console.error('Failed to load transactions:', res.status)
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Error data:', errorData)
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

  // Prüfe Admin-Status erneut für UI
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
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  CHF{' '}
                  {new Intl.NumberFormat('de-CH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totale Anzahl Transaktionen</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total an Margen</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  CHF{' '}
                  {new Intl.NumberFormat('de-CH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(stats.platformMargin)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Transaktionsliste */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Alle Transaktionen</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Datum
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
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Marge
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
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${transaction.watchId}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {transaction.watchTitle}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {transaction.buyerName || 'Unbekannt'}
                      </div>
                      <div className="text-sm text-gray-500">{transaction.buyerEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {transaction.sellerName || 'Unbekannt'}
                      </div>
                      <div className="text-sm text-gray-500">{transaction.sellerEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                      CHF{' '}
                      {new Intl.NumberFormat('de-CH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(transaction.price)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-primary-600">
                      CHF{' '}
                      {new Intl.NumberFormat('de-CH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(transaction.margin)}
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
