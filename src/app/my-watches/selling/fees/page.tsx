'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wallet, Download, CheckCircle, Clock, FileText, CreditCard } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InvoicePaymentModal } from '@/components/payment/InvoicePaymentModal'

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
  items: InvoiceItem[]
}

export default function SellingFeesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const invoiceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    loadInvoices()
  }, [session, status, router])

  // Scroll zu spezifischer Rechnung wenn Invoice-ID in URL
  useEffect(() => {
    const invoiceId = searchParams.get('invoice')
    if (invoiceId && invoices.length > 0) {
      // Warte kurz, damit die Rechnungen gerendert sind
      setTimeout(() => {
        const invoiceElement = invoiceRefs.current[invoiceId]
        if (invoiceElement) {
          invoiceElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightedInvoiceId(invoiceId)
          // Entferne Highlight nach 3 Sekunden
          setTimeout(() => {
            setHighlightedInvoiceId(null)
            // Entferne Query-Parameter aus URL
            router.replace('/my-watches/selling/fees')
          }, 3000)
        }
      }, 300)
    }
  }, [invoices, searchParams, router])

  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/invoices/my-invoices')
      console.log('[fees] API response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('[fees] API response data:', data)
        setInvoices(data.invoices || [])
      } else {
        const errorData = await res.json()
        console.error('[fees] API error:', errorData)
        alert('Fehler beim Laden der Rechnungen: ' + (errorData.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('[fees] Error loading invoices:', error)
      alert('Fehler beim Laden der Rechnungen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Rechnung_${invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Fehler beim Erstellen des PDFs')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Fehler beim Herunterladen des PDFs')
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!confirm('Sind Sie sicher, dass diese Rechnung bezahlt wurde?')) {
      return
    }

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        loadInvoices() // Reload um Status zu aktualisieren
      } else {
        const data = await res.json()
        alert('Fehler: ' + (data.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      alert('Fehler beim Markieren als bezahlt')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Bezahlt
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Überfällig
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Offen
          </span>
        )
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  // Statistiken berechnen
  const totalPending = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)
  
  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link
          href="/my-watches"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 mr-3 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gebühren & Rechnungen
              </h1>
              <p className="text-gray-600 mt-1">
                Übersicht aller Verkaufsgebühren und Rechnungen
              </p>
            </div>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offene Rechnungen</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPending)}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bezahlte Beträge</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPaid)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt Rechnungen</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {invoices.length}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Rechnungsliste */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Rechnungen
              </h3>
              <p className="text-gray-600">
                Sie haben noch keine Rechnungen erhalten.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id} 
                ref={(el) => { invoiceRefs.current[invoice.id] = el }}
                className={`bg-white rounded-lg shadow-md p-6 transition-all duration-500 ${
                  highlightedInvoiceId === invoice.id 
                    ? 'ring-4 ring-primary-500 ring-offset-2 bg-primary-50' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Fälligkeitsdatum: {new Date(invoice.dueDate).toLocaleDateString('de-CH')}
                    </p>
                    {invoice.paidAt && (
                      <p className="text-sm text-green-600 mt-1">
                        Bezahlt am: {new Date(invoice.paidAt).toLocaleDateString('de-CH')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.total)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => setSelectedInvoiceForPayment(invoice)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Jetzt bezahlen
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                        className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rechnungsposten */}
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    {invoice.items.map((item) => {
                      const itemVat = item.price * invoice.vatRate
                      const itemTotal = item.price + itemVat
                      return (
                        <div key={item.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                          <div className="flex justify-between text-sm mb-1">
                            <div>
                              <span className="text-gray-700 font-medium">{item.description}</span>
                              {item.watch && (
                                <span className="text-gray-500 ml-2">
                                  ({item.watch.brand} {item.watch.model})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 ml-2">
                            <div className="flex gap-4">
                              <span>Netto: CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.price)}</span>
                              <span>MwSt: CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(itemVat)}</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(itemTotal)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t mt-4 pt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Zwischensumme:</span>
                      <span className="font-medium">
                        CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        MwSt ({invoice.vatRate * 100}%):
                      </span>
                      <span className="font-medium">
                        CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.vatAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary-600">
                        CHF {new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />

      {/* Payment Modal */}
      {selectedInvoiceForPayment && (
        <InvoicePaymentModal
          invoiceId={selectedInvoiceForPayment.id}
          invoiceNumber={selectedInvoiceForPayment.invoiceNumber}
          amount={selectedInvoiceForPayment.total}
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => {
            setSelectedInvoiceForPayment(null)
            loadInvoices() // Reload invoices to update status
          }}
          onPaymentSuccess={() => {
            loadInvoices() // Reload invoices to update status
          }}
        />
      )}
    </div>
  )
}
