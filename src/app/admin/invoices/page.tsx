'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Send,
  User,
  X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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
    images: string[]
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
  paymentMethod: string | null
  reminderCount: number
  lateFeeAdded: boolean
  lateFeeAmount: number
  collectionStopped: boolean
  collectionStoppedAt: string | null
  collectionStoppedReason: string | null
  paymentArrangement: boolean
  paymentArrangementNotes: string | null
  adminNotes: string | null
  accountBlockedAt: string | null
  seller: {
    id: string
    name: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    companyName: string | null
    isBlocked: boolean
    hasUnpaidInvoices: boolean
  }
  items: InvoiceItem[]
}

interface Stats {
  total: number
  pending: number
  overdue: number
  paid: number
  cancelled: number
  totalAmount: number
  openAmount: number
  totalLateFees: number
  withMahnstopp: number
  withPaymentArrangement: number
}

export default function AdminInvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<string>(searchParams.get('status') || 'all')
  const [search, setSearch] = useState('')
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showMahnstoppModal, setShowMahnstoppModal] = useState<Invoice | null>(null)
  const [showNotesModal, setShowNotesModal] = useState<Invoice | null>(null)
  const [showReminderModal, setShowReminderModal] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null)
  const [mahnstoppReason, setMahnstoppReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [selectedReminderType, setSelectedReminderType] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')

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

    loadInvoices()
  }, [session, status, router])

  const loadInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/invoices?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        loadInvoices()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [filter, search, loadInvoices, loading])

  const handleAction = async (invoiceId: string, action: string, data: any = {}) => {
    setActionLoading(invoiceId)
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })

      if (res.ok) {
        const result = await res.json()
        alert(result.message)
        await loadInvoices()
      } else {
        const error = await res.json()
        alert('Fehler: ' + (error.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler bei der Aktion')
    } finally {
      setActionLoading(null)
      setShowMahnstoppModal(null)
      setShowNotesModal(null)
      setShowReminderModal(null)
      setShowPaymentModal(null)
    }
  }

  const handleSendReminder = async (invoiceId: string, reminderType: string) => {
    setActionLoading(invoiceId)
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderType }),
      })

      if (res.ok) {
        const result = await res.json()
        alert(result.message)
        await loadInvoices()
      } else {
        const error = await res.json()
        alert('Fehler: ' + (error.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler beim Senden der Mahnung')
    } finally {
      setActionLoading(null)
      setShowReminderModal(null)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    params.set('format', format)

    if (format === 'csv') {
      window.open(`/api/admin/invoices/export?${params.toString()}`, '_blank')
    } else {
      const res = await fetch(`/api/admin/invoices/export?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rechnungen_${new Date().toISOString().split('T')[0]}.json`
        a.click()
      }
    }
  }

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.collectionStopped) {
      return (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
          <Ban className="mr-1 h-3 w-3" />
          Mahnstopp
        </span>
      )
    }
    if (invoice.paymentArrangement) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          <CreditCard className="mr-1 h-3 w-3" />
          Ratenzahlung
        </span>
      )
    }

    switch (invoice.status) {
      case 'paid':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Bezahlt
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Überfällig
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            <X className="mr-1 h-3 w-3" />
            Storniert
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Offen
          </span>
        )
    }
  }

  const getSellerName = (seller: Invoice['seller']) => {
    if (seller.companyName) return seller.companyName
    if (seller.firstName && seller.lastName) return `${seller.firstName} ${seller.lastName}`
    return seller.name || seller.email || 'Unbekannt'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600">Lädt Rechnungen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin/dashboard"
              className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Zurück zum Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Rechnungsverwaltung</h1>
            <p className="text-sm text-gray-600">Verwalten Sie alle Rechnungen und Mahnungen</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="mr-2 h-4 w-4" />
              CSV Export
            </button>
            <button
              onClick={() => loadInvoices()}
              className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Gesamt</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-yellow-600">Offen</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-red-600">Überfällig</p>
              <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-green-600">Bezahlt</p>
              <p className="text-xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Offene Beträge</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.openAmount)}</p>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {stats && (stats.withMahnstopp > 0 || stats.withPaymentArrangement > 0) && (
          <div className="mb-6 flex gap-4">
            {stats.withMahnstopp > 0 && (
              <div className="inline-flex items-center rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
                <Ban className="mr-2 h-4 w-4" />
                {stats.withMahnstopp} mit Mahnstopp
              </div>
            )}
            {stats.withPaymentArrangement > 0 && (
              <div className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                <CreditCard className="mr-2 h-4 w-4" />
                {stats.withPaymentArrangement} mit Ratenzahlung
              </div>
            )}
            {stats.totalLateFees > 0 && (
              <div className="inline-flex items-center rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
                <DollarSign className="mr-2 h-4 w-4" />
                {formatCurrency(stats.totalLateFees)} Mahngebühren
              </div>
            )}
          </div>
        )}

        {/* Filters & Search */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Rechnungsnr., Name, Email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Alle' },
                { value: 'pending', label: 'Offen' },
                { value: 'overdue', label: 'Überfällig' },
                { value: 'paid', label: 'Bezahlt' },
                { value: 'cancelled', label: 'Storniert' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    filter === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">Keine Rechnungen gefunden.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div
                key={invoice.id}
                className={`rounded-lg bg-white shadow-sm ${
                  invoice.accountBlockedAt ? 'border-2 border-red-300' : ''
                }`}
              >
                {/* Invoice Header */}
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() =>
                    setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                        {getStatusBadge(invoice)}
                        {invoice.reminderCount > 0 && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                            {invoice.reminderCount}x gemahnt
                          </span>
                        )}
                        {invoice.accountBlockedAt && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Konto gesperrt
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <Link
                          href={`/admin/users/${invoice.sellerId}`}
                          className="hover:text-primary-600 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {getSellerName(invoice.seller)}
                        </Link>
                        <span className="mx-2">•</span>
                        <span>Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-CH')}</span>
                        {invoice.status === 'overdue' && (
                          <span className="ml-2 text-red-600">
                            (
                            {Math.floor(
                              (Date.now() - new Date(invoice.dueDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{' '}
                            Tage überfällig)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      {invoice.lateFeeAdded && (
                        <p className="text-xs text-orange-600">
                          +{formatCurrency(invoice.lateFeeAmount)} Mahngebühren
                        </p>
                      )}
                    </div>
                    {expandedInvoice === invoice.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedInvoice === invoice.id && (
                  <div className="border-t border-gray-100 p-4">
                    {/* Actions */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {/* PDF Download */}
                      <a
                        href={`/api/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText className="mr-1.5 h-4 w-4" />
                        PDF
                      </a>

                      {/* Mark as Paid */}
                      {invoice.status !== 'paid' && !invoice.collectionStopped && (
                        <button
                          onClick={() => setShowPaymentModal(invoice)}
                          disabled={actionLoading === invoice.id}
                          className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Als bezahlt markieren
                        </button>
                      )}

                      {/* Undo Payment */}
                      {invoice.status === 'paid' && (
                        <button
                          onClick={() => handleAction(invoice.id, 'mark_unpaid')}
                          disabled={actionLoading === invoice.id}
                          className="inline-flex items-center rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          <RefreshCw className="mr-1.5 h-4 w-4" />
                          Zahlung zurücksetzen
                        </button>
                      )}

                      {/* Mahnstopp */}
                      {!invoice.collectionStopped && invoice.status !== 'paid' && (
                        <button
                          onClick={() => setShowMahnstoppModal(invoice)}
                          disabled={actionLoading === invoice.id}
                          className="inline-flex items-center rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                        >
                          <Ban className="mr-1.5 h-4 w-4" />
                          Mahnstopp
                        </button>
                      )}

                      {/* Remove Mahnstopp */}
                      {invoice.collectionStopped && (
                        <button
                          onClick={() => handleAction(invoice.id, 'remove_mahnstopp')}
                          disabled={actionLoading === invoice.id}
                          className="inline-flex items-center rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          <Play className="mr-1.5 h-4 w-4" />
                          Mahnstopp aufheben
                        </button>
                      )}

                      {/* Send Reminder */}
                      {invoice.status !== 'paid' && !invoice.collectionStopped && (
                        <button
                          onClick={() => setShowReminderModal(invoice)}
                          disabled={actionLoading === invoice.id}
                          className="inline-flex items-center rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                        >
                          <Send className="mr-1.5 h-4 w-4" />
                          Mahnung senden
                        </button>
                      )}

                      {/* Admin Notes */}
                      <button
                        onClick={() => {
                          setAdminNotes(invoice.adminNotes || '')
                          setShowNotesModal(invoice)
                        }}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="mr-1.5 h-4 w-4" />
                        Notizen
                      </button>

                      {/* Unblock Account */}
                      {invoice.accountBlockedAt && (
                        <button
                          onClick={() => handleAction(invoice.id, 'unblock_account')}
                          disabled={actionLoading === invoice.id}
                          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <AlertTriangle className="mr-1.5 h-4 w-4" />
                          Konto entsperren
                        </button>
                      )}

                      {/* View User Invoices */}
                      <Link
                        href={`/admin/invoices/user/${invoice.sellerId}`}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="mr-1.5 h-4 w-4" />
                        Alle Rechnungen des Users
                      </Link>
                    </div>

                    {/* Invoice Items */}
                    <div className="mb-4 rounded-lg bg-gray-50 p-3">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Rechnungsposten</h4>
                      {invoice.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-1 text-sm"
                        >
                          <span className="text-gray-600">{item.description}</span>
                          <span className="font-medium">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
                        <span className="text-gray-600">
                          MwSt ({(invoice.vatRate * 100).toFixed(1)}%)
                        </span>
                        <span>{formatCurrency(invoice.vatAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Erstellt</p>
                        <p>{new Date(invoice.createdAt).toLocaleString('de-CH')}</p>
                      </div>
                      {invoice.paidAt && (
                        <div>
                          <p className="text-gray-500">Bezahlt am</p>
                          <p>{new Date(invoice.paidAt).toLocaleString('de-CH')}</p>
                        </div>
                      )}
                      {invoice.paymentMethod && (
                        <div>
                          <p className="text-gray-500">Zahlungsmethode</p>
                          <p>{invoice.paymentMethod}</p>
                        </div>
                      )}
                      {invoice.collectionStoppedAt && (
                        <div>
                          <p className="text-gray-500">Mahnstopp seit</p>
                          <p>{new Date(invoice.collectionStoppedAt).toLocaleString('de-CH')}</p>
                          {invoice.collectionStoppedReason && (
                            <p className="text-xs text-purple-600">
                              {invoice.collectionStoppedReason}
                            </p>
                          )}
                        </div>
                      )}
                      {invoice.adminNotes && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Admin-Notizen</p>
                          <p className="whitespace-pre-wrap rounded bg-yellow-50 p-2 text-xs">
                            {invoice.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mahnstopp Modal */}
      {showMahnstoppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-bold">Mahnstopp aktivieren</h3>
            <p className="mb-4 text-sm text-gray-600">
              Rechnung: {showMahnstoppModal.invoiceNumber}
            </p>
            <textarea
              value={mahnstoppReason}
              onChange={e => setMahnstoppReason(e.target.value)}
              placeholder="Grund für Mahnstopp (optional)"
              className="mb-4 w-full rounded-lg border p-2"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMahnstoppModal(null)}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() =>
                  handleAction(showMahnstoppModal.id, 'set_mahnstopp', {
                    reason: mahnstoppReason,
                  })
                }
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                Mahnstopp aktivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-bold">Admin-Notizen</h3>
            <p className="mb-4 text-sm text-gray-600">Rechnung: {showNotesModal.invoiceNumber}</p>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Interne Notizen..."
              className="mb-4 w-full rounded-lg border p-2"
              rows={5}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNotesModal(null)}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() =>
                  handleAction(showNotesModal.id, 'update_notes', { notes: adminNotes })
                }
                className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-bold">Mahnung senden</h3>
            <p className="mb-4 text-sm text-gray-600">
              Rechnung: {showReminderModal.invoiceNumber}
            </p>
            <select
              value={selectedReminderType}
              onChange={e => setSelectedReminderType(e.target.value)}
              className="mb-4 w-full rounded-lg border p-2"
              aria-label="Mahnungstyp"
            >
              <option value="">Mahnungstyp wählen...</option>
              <option value="payment_request">Zahlungsaufforderung</option>
              <option value="first_reminder">1. Mahnung</option>
              <option value="second_reminder">2. Mahnung</option>
              <option value="final_reminder">Letzte Mahnung</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReminderModal(null)}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() =>
                  selectedReminderType &&
                  handleSendReminder(showReminderModal.id, selectedReminderType)
                }
                disabled={!selectedReminderType}
                className="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Mahnung senden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-bold">Als bezahlt markieren</h3>
            <p className="mb-4 text-sm text-gray-600">Rechnung: {showPaymentModal.invoiceNumber}</p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Zahlungsmethode</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border p-2"
                aria-label="Zahlungsmethode"
              >
                <option value="">Wählen...</option>
                <option value="bank_transfer">Banküberweisung</option>
                <option value="cash">Barzahlung</option>
                <option value="stripe">Kreditkarte (Stripe)</option>
                <option value="paypal">PayPal</option>
                <option value="twint">TWINT</option>
                <option value="other">Andere</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Referenz (optional)</label>
              <input
                type="text"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="z.B. Transaktions-ID"
                className="w-full rounded-lg border p-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(null)}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() =>
                  handleAction(showPaymentModal.id, 'mark_paid', {
                    paymentMethod: paymentMethod || 'admin_manual',
                    paymentReference,
                  })
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Als bezahlt markieren
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
