'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SyncResult {
  success: boolean
  matched?: number
  unmatched?: number
  errors?: string[]
  bexioContactId?: number
  bexioInvoiceId?: number
  qrReference?: string
}

interface Invoice {
  id: number
  invoiceNumber: string
  qrReference: string | null
  bexioInvoiceId: number | null
  status: string
  total: number
  seller: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  createdAt: string
}

export default function BexioAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [userId, setUserId] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [lastPaymentSync, setLastPaymentSync] = useState<string | null>(null)

  const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated' && !isAdminInSession) {
      router.push('/')
    }
    if (isAdminInSession) {
      fetchRecentInvoices()
    }
  }, [session, status, router, isAdminInSession])

  const fetchRecentInvoices = async () => {
    try {
      const res = await fetch('/api/admin/invoices?limit=10&hasBexio=true')
      if (res.ok) {
        const data = await res.json()
        setRecentInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  const syncUser = async () => {
    if (!userId) return
    setLoading(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/bexio/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'user', userId: parseInt(userId) }),
      })
      const data = await res.json()
      setSyncResult(data)
    } catch (error: any) {
      setSyncResult({ success: false, errors: [error.message] })
    }
    setLoading(false)
  }

  const syncInvoice = async () => {
    if (!invoiceId) return
    setLoading(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/bexio/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invoice', invoiceId: parseInt(invoiceId) }),
      })
      const data = await res.json()
      setSyncResult(data)
      fetchRecentInvoices()
    } catch (error: any) {
      setSyncResult({ success: false, errors: [error.message] })
    }
    setLoading(false)
  }

  const runPaymentMatching = async () => {
    setLoading(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/bexio/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'manual-trigger',
        },
      })
      const data = await res.json()
      setSyncResult(data)
      setLastPaymentSync(new Date().toLocaleString('de-CH'))
      fetchRecentInvoices()
    } catch (error: any) {
      setSyncResult({ success: false, errors: [error.message] })
    }
    setLoading(false)
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bexio Integration</h1>
        <p className="mt-2 text-gray-600">
          Synchronisiere Benutzer und Rechnungen mit Bexio für automatisches Payment Matching.
        </p>
      </div>

      {/* Status Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold">API Status</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {process.env.NEXT_PUBLIC_BEXIO_ENABLED === 'true' ? 'Verbunden' : 'Nicht konfiguriert'}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold">Letzter Sync</h3>
          </div>
          <p className="text-lg font-medium text-gray-700">{lastPaymentSync || 'Noch nie'}</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="font-semibold">Cron Job</h3>
          </div>
          <p className="text-lg font-medium text-gray-700">Alle 15 Min</p>
        </div>
      </div>

      {/* Manual Sync Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sync User */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Benutzer synchronisieren</h2>
          <p className="mb-4 text-sm text-gray-600">
            Erstellt oder aktualisiert einen Kontakt in Bexio für den angegebenen Benutzer.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="User ID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="flex-1 rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={syncUser}
              disabled={loading || !userId}
              className="rounded-lg bg-amber-600 px-6 py-2 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Sync Invoice */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Rechnung synchronisieren</h2>
          <p className="mb-4 text-sm text-gray-600">
            Erstellt eine Rechnung in Bexio und generiert eine eindeutige QR-Referenz.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Invoice ID"
              value={invoiceId}
              onChange={e => setInvoiceId(e.target.value)}
              className="flex-1 rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={syncInvoice}
              disabled={loading || !invoiceId}
              className="rounded-lg bg-amber-600 px-6 py-2 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* Payment Matching */}
      <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Payment Matching</h2>
            <p className="text-sm text-gray-600">
              Verarbeitet eingehende Zahlungen und ordnet sie automatisch Rechnungen zu.
            </p>
          </div>
          <button
            onClick={runPaymentMatching}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            Jetzt ausführen
          </button>
        </div>
      </div>

      {/* Result Display */}
      {syncResult && (
        <div
          className={`mb-8 rounded-xl p-6 ${syncResult.success ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'}`}
        >
          <h3
            className={`mb-2 text-lg font-semibold ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}
          >
            {syncResult.success ? 'Erfolg!' : 'Fehler'}
          </h3>
          {syncResult.matched !== undefined && (
            <p className="text-green-700">
              Matched: {syncResult.matched} | Unmatched: {syncResult.unmatched}
            </p>
          )}
          {syncResult.bexioContactId && (
            <p className="text-green-700">Bexio Contact ID: {syncResult.bexioContactId}</p>
          )}
          {syncResult.bexioInvoiceId && (
            <p className="text-green-700">Bexio Invoice ID: {syncResult.bexioInvoiceId}</p>
          )}
          {syncResult.qrReference && (
            <p className="font-mono text-green-700">QR Reference: {syncResult.qrReference}</p>
          )}
          {syncResult.errors && syncResult.errors.length > 0 && (
            <ul className="list-inside list-disc text-red-700">
              {syncResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Recent Invoices with Bexio */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Letzte synchronisierte Rechnungen</h2>
        {recentInvoices.length === 0 ? (
          <p className="text-gray-500">Keine synchronisierten Rechnungen gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-3 text-left">Rechnung</th>
                  <th className="px-2 py-3 text-left">QR-Referenz</th>
                  <th className="px-2 py-3 text-left">Bexio ID</th>
                  <th className="px-2 py-3 text-left">Status</th>
                  <th className="px-2 py-3 text-right">Betrag</th>
                  <th className="px-2 py-3 text-left">Verkäufer</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(invoice => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-2 py-3 font-mono text-xs">{invoice.qrReference || '-'}</td>
                    <td className="px-2 py-3">{invoice.bexioInvoiceId || '-'}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">CHF {invoice.total.toFixed(2)}</td>
                    <td className="px-2 py-3 text-gray-600">
                      {invoice.seller.firstName} {invoice.seller.lastName || invoice.seller.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 font-semibold text-blue-900">QR-Referenz Dokumentation</h3>
        <p className="mb-3 text-sm text-blue-800">
          Das System generiert eindeutige QR-Referenzen im SCOR-Format (RF + 23 Zeichen), die:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
          <li>User ID kodieren für automatische Zuordnung</li>
          <li>Invoice ID kodieren für exaktes Matching</li>
          <li>MOD-97 Prüfsumme enthalten für Validierung</li>
          <li>Kompatibel sind mit Swiss QR-Bills</li>
        </ul>
      </div>
    </div>
  )
}
