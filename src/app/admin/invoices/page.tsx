'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  total: number
  watchId: string | null
  watch: {
    id: string
    title: string
    brand: string
    model: string
  } | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  status: string
  paidAt: string | null
  dueDate: string
  createdAt: string
  sellerId: string
  seller: {
    id: string
    name: string | null
    email: string | null
  }
  items: InvoiceItem[]
}

export default function AdminInvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
  const [processingOverdue, setProcessingOverdue] = useState(false)

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

    loadInvoices()
  }, [session, status, router])

  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/admin/invoices')
      if (res.ok) {
        const data = await res.json()
        console.log('Invoices loaded:', data)
        setInvoices(data.invoices || [])
      } else {
        console.error('Failed to load invoices:', res.status)
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Error data:', errorData)
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      alert(
        'Fehler beim Laden der Rechnungen: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOverdue = async () => {
    setProcessingOverdue(true)
    try {
      const res = await fetch('/api/invoices/check-overdue', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        alert(`Status-Update erfolgreich: ${data.updated} Rechnungen als überfällig markiert`)
        await loadInvoices() // Neu laden
      } else {
        const errorData = await res.json()
        alert('Fehler: ' + (errorData.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error checking overdue:', error)
      alert('Fehler beim Prüfen der fälligen Rechnungen')
    } finally {
      setProcessingOverdue(false)
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true
    return inv.status === filter
  })

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalAmount: invoices
      .filter(i => i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
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
            <h1 className="text-3xl font-bold text-gray-900">Rechnungsverwaltung & Mahnwesen</h1>
            <p className="mt-1 text-gray-600">
              Übersicht aller Rechnungen und überfälliger Zahlungen
            </p>
          </div>
          <button
            onClick={handleCheckOverdue}
            disabled={processingOverdue}
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${processingOverdue ? 'animate-spin' : ''}`} />
            {processingOverdue ? 'Wird geprüft...' : 'Fällige Rechnungen prüfen'}
          </button>
        </div>

        {/* Statistiken */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt Rechnungen</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="rounded-full bg-gray-100 p-3">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offen</p>
                <p className="mt-2 text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Überfällig</p>
                <p className="mt-2 text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offene Beträge</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  CHF{' '}
                  {new Intl.NumberFormat('de-CH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(stats.totalAmount)}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-4 py-2 ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`rounded-lg px-4 py-2 ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Offen ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`rounded-lg px-4 py-2 ${filter === 'overdue' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Überfällig ({stats.overdue})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`rounded-lg px-4 py-2 ${filter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bezahlt ({stats.paid})
            </button>
          </div>
        </div>

        {/* Rechnungsliste */}
        {filteredInvoices.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <p className="text-gray-600">Keine Rechnungen gefunden.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map(invoice => (
              <div key={invoice.id} className="rounded-lg bg-white p-6 shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status === 'paid'
                          ? 'Bezahlt'
                          : invoice.status === 'overdue'
                            ? 'Überfällig'
                            : 'Offen'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Verkäufer: {invoice.seller.name || invoice.seller.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fälligkeitsdatum: {new Date(invoice.dueDate).toLocaleDateString('de-CH')}
                      {invoice.status === 'overdue' && (
                        <span className="ml-2 font-semibold text-red-600">
                          (
                          {Math.floor(
                            (Date.now() - new Date(invoice.dueDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          Tage überfällig)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      CHF{' '}
                      {new Intl.NumberFormat('de-CH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(invoice.total)}
                    </p>
                  </div>
                </div>

                {/* Rechnungsposten */}
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    {invoice.items.map(item => {
                      const itemVat = item.price * invoice.vatRate
                      const itemTotal = item.price + itemVat
                      return (
                        <div
                          key={item.id}
                          className="border-b border-gray-100 pb-3 last:border-b-0"
                        >
                          <div className="mb-1 flex justify-between text-sm">
                            <div>
                              <span className="font-medium text-gray-700">{item.description}</span>
                            </div>
                          </div>
                          <div className="ml-2 flex justify-between text-xs text-gray-600">
                            <div className="flex gap-4">
                              <span>
                                Netto: CHF{' '}
                                {new Intl.NumberFormat('de-CH', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(item.price)}
                              </span>
                              <span>
                                MwSt: CHF{' '}
                                {new Intl.NumberFormat('de-CH', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(itemVat)}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              CHF{' '}
                              {new Intl.NumberFormat('de-CH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(itemTotal)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
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
