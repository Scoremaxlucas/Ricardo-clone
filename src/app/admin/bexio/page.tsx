'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
    fetchRecentInvoices()
  }, [session, status, router])

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
        body: JSON.stringify({ type: 'user', userId: parseInt(userId) })
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
        body: JSON.stringify({ type: 'invoice', invoiceId: parseInt(invoiceId) })
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
          'x-cron-secret': 'manual-trigger'
        }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bexio Integration</h1>
        <p className="text-gray-600 mt-2">
          Synchronisiere Benutzer und Rechnungen mit Bexio für automatisches Payment Matching.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold">API Status</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {process.env.NEXT_PUBLIC_BEXIO_ENABLED === 'true' ? 'Verbunden' : 'Nicht konfiguriert'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold">Letzter Sync</h3>
          </div>
          <p className="text-lg font-medium text-gray-700">
            {lastPaymentSync || 'Noch nie'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold">Cron Job</h3>
          </div>
          <p className="text-lg font-medium text-gray-700">Alle 15 Min</p>
        </div>
      </div>

      {/* Manual Sync Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Sync User */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Benutzer synchronisieren</h2>
          <p className="text-gray-600 text-sm mb-4">
            Erstellt oder aktualisiert einen Kontakt in Bexio für den angegebenen Benutzer.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              onClick={syncUser}
              disabled={loading || !userId}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Sync Invoice */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Rechnung synchronisieren</h2>
          <p className="text-gray-600 text-sm mb-4">
            Erstellt eine Rechnung in Bexio und generiert eine eindeutige QR-Referenz.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Invoice ID"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              onClick={syncInvoice}
              disabled={loading || !invoiceId}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* Payment Matching */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Payment Matching</h2>
            <p className="text-gray-600 text-sm">
              Verarbeitet eingehende Zahlungen und ordnet sie automatisch Rechnungen zu.
            </p>
          </div>
          <button
            onClick={runPaymentMatching}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Jetzt ausführen
          </button>
        </div>
      </div>

      {/* Result Display */}
      {syncResult && (
        <div className={`rounded-xl p-6 mb-8 ${syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`font-semibold text-lg mb-2 ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {syncResult.success ? 'Erfolg!' : 'Fehler'}
          </h3>
          {syncResult.matched !== undefined && (
            <p className="text-green-700">Matched: {syncResult.matched} | Unmatched: {syncResult.unmatched}</p>
          )}
          {syncResult.bexioContactId && (
            <p className="text-green-700">Bexio Contact ID: {syncResult.bexioContactId}</p>
          )}
          {syncResult.bexioInvoiceId && (
            <p className="text-green-700">Bexio Invoice ID: {syncResult.bexioInvoiceId}</p>
          )}
          {syncResult.qrReference && (
            <p className="text-green-700 font-mono">QR Reference: {syncResult.qrReference}</p>
          )}
          {syncResult.errors && syncResult.errors.length > 0 && (
            <ul className="text-red-700 list-disc list-inside">
              {syncResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Recent Invoices with Bexio */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Letzte synchronisierte Rechnungen</h2>
        {recentInvoices.length === 0 ? (
          <p className="text-gray-500">Keine synchronisierten Rechnungen gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Rechnung</th>
                  <th className="text-left py-3 px-2">QR-Referenz</th>
                  <th className="text-left py-3 px-2">Bexio ID</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-right py-3 px-2">Betrag</th>
                  <th className="text-left py-3 px-2">Verkäufer</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-2 font-mono text-xs">{invoice.qrReference || '-'}</td>
                    <td className="py-3 px-2">{invoice.bexioInvoiceId || '-'}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">CHF {invoice.total.toFixed(2)}</td>
                    <td className="py-3 px-2 text-gray-600">
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
      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">QR-Referenz Dokumentation</h3>
        <p className="text-blue-800 text-sm mb-3">
          Das System generiert eindeutige QR-Referenzen im SCOR-Format (RF + 23 Zeichen), die:
        </p>
        <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
          <li>User ID kodieren für automatische Zuordnung</li>
          <li>Invoice ID kodieren für exaktes Matching</li>
          <li>MOD-97 Prüfsumme enthalten für Validierung</li>
          <li>Kompatibel sind mit Swiss QR-Bills</li>
        </ul>
      </div>
    </div>
  )
}
