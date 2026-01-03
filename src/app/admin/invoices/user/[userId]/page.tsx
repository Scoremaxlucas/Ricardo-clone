'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  FileText,
  Download,
  CreditCard,
  Loader2,
  Calendar,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface UserInfo {
  id: string
  name: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  companyName: string | null
  isBlocked: boolean
  hasUnpaidInvoices: boolean
  createdAt: string
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
  collectionStopped: boolean
  paymentArrangement: boolean
  reminderCount: number
  lateFeeAmount: number
  items: Array<{
    id: string
    description: string
    total: number
    watch: { title: string } | null
  }>
}

interface Stats {
  total: number
  pending: number
  overdue: number
  paid: number
  cancelled: number
  totalAmount: number
  openAmount: number
  paidAmount: number
  lateFees: number
  withMahnstopp: number
  withPaymentArrangement: number
}

export default function UserInvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params?.userId as string

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

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

    loadUserInvoices()
  }, [session, status, router, userId])

  const loadUserInvoices = async () => {
    try {
      const res = await fetch(`/api/admin/invoices/by-user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setInvoices(data.invoices || [])
        setStats(data.stats || null)
      } else {
        alert('Benutzer nicht gefunden')
        router.push('/admin/invoices')
      }
    } catch (error) {
      console.error('Error loading user invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount)
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
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Offen
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Benutzer nicht gefunden</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Link */}
        <Link
          href="/admin/invoices"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zur Rechnungsübersicht
        </Link>

        {/* User Info Card */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user.companyName ||
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    user.name ||
                    'Unbekannt'}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {user.email && (
                    <span className="flex items-center">
                      <Mail className="mr-1 h-4 w-4" />
                      {user.email}
                    </span>
                  )}
                  {user.companyName && (
                    <span className="flex items-center">
                      <Building className="mr-1 h-4 w-4" />
                      {user.companyName}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    Mitglied seit {new Date(user.createdAt).toLocaleDateString('de-CH')}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  {user.isBlocked && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      <Ban className="mr-1 h-3 w-3" />
                      Konto gesperrt
                    </span>
                  )}
                  {user.hasUnpaidInvoices && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Offene Rechnungen
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/admin/users/${userId}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Benutzerprofil
            </Link>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Gesamt Rechnungen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Offener Betrag</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.openAmount)}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Bezahlter Betrag</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Gesamtbetrag</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        )}

        {/* Status Overview */}
        {stats && (
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="rounded-lg bg-yellow-50 px-3 py-1.5 text-sm text-yellow-700">
              {stats.pending} offen
            </span>
            <span className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700">
              {stats.overdue} überfällig
            </span>
            <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700">
              {stats.paid} bezahlt
            </span>
            {stats.withMahnstopp > 0 && (
              <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-sm text-purple-700">
                {stats.withMahnstopp} mit Mahnstopp
              </span>
            )}
            {stats.lateFees > 0 && (
              <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm text-orange-700">
                {formatCurrency(stats.lateFees)} Mahngebühren
              </span>
            )}
          </div>
        )}

        {/* Invoice List */}
        <div className="rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <h2 className="text-lg font-semibold">Alle Rechnungen</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>Keine Rechnungen vorhanden</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                      {getStatusBadge(invoice)}
                      {invoice.reminderCount > 0 && (
                        <span className="text-xs text-orange-600">
                          {invoice.reminderCount}x gemahnt
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {invoice.items.map(i => i.watch?.title || i.description).join(', ')}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Erstellt: {new Date(invoice.createdAt).toLocaleDateString('de-CH')}
                      {' • '}
                      Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-CH')}
                      {invoice.paidAt &&
                        ` • Bezahlt: ${new Date(invoice.paidAt).toLocaleDateString('de-CH')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(invoice.total)}</p>
                      {invoice.lateFeeAmount > 0 && (
                        <p className="text-xs text-orange-600">
                          +{formatCurrency(invoice.lateFeeAmount)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/api/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="PDF herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <Link
                        href={`/admin/invoices?search=${invoice.invoiceNumber}`}
                        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Details"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
