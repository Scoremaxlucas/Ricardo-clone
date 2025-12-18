'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wallet, CheckCircle, Clock, FileText } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InvoicePaymentModal } from '@/components/payment/InvoicePaymentModal'
import { InvoiceList } from '@/components/invoices/InvoiceList'

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
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
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
      alert(
        'Fehler beim Laden der Rechnungen: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      )
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
        headers: { 'Content-Type': 'application/json' },
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


  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/my-watches"
          className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="mb-8 flex items-center">
          <Wallet className="mr-3 h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gebühren & Rechnungen</h1>
            <p className="mt-1 text-gray-600">Übersicht aller Verkaufsgebühren und Rechnungen</p>
          </div>
        </div>

        {/* Statistiken */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offene Rechnungen</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  CHF{' '}
                  {new Intl.NumberFormat('de-CH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(totalPending)}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bezahlte Beträge</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  CHF{' '}
                  {new Intl.NumberFormat('de-CH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(totalPaid)}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt Rechnungen</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Rechnungsliste */}
        {invoices.length === 0 ? (
          <div className="rounded-lg bg-white p-12 shadow-sm">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Keine Rechnungen</h3>
              <p className="text-gray-600">Sie haben noch keine Rechnungen erhalten.</p>
            </div>
          </div>
        ) : (
          <InvoiceList
            invoices={invoices}
            onPay={invoice => setSelectedInvoiceForPayment(invoice)}
            onDownloadPDF={handleDownloadPDF}
            highlightedInvoiceId={highlightedInvoiceId}
            invoiceRefs={invoiceRefs.current}
          />
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
