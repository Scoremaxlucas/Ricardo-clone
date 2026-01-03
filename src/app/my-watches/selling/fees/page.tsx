'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, CreditCard, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Receipt } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InvoicePaymentModal } from '@/components/payment/InvoicePaymentModal'
import { ProfileCompletionGate } from '@/components/account/ProfileCompletionGate'

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

function SellingFeesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const invoiceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null)
  const [profileGateOpen, setProfileGateOpen] = useState(false)
  const [profileGateMissingFields, setProfileGateMissingFields] = useState<any[]>([])
  const [blockedAction, setBlockedAction] = useState<(() => void) | null>(null)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || !session) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }
    loadInvoices()
  }, [session, status, router])

  useEffect(() => {
    const invoiceId = searchParams.get('invoice')
    if (invoiceId && invoices.length > 0) {
      setTimeout(() => {
        const invoiceElement = invoiceRefs.current[invoiceId]
        if (invoiceElement) {
          invoiceElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightedInvoiceId(invoiceId)
          setTimeout(() => {
            setHighlightedInvoiceId(null)
            router.replace('/my-watches/selling/fees')
          }, 3000)
        }
      }, 300)
    }
  }, [invoices, searchParams, router])

  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/invoices/my-invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('[fees] Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkProfileBeforeAction = async (action: () => void): Promise<boolean> => {
    try {
      const res = await fetch('/api/profile/check-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: 'INVOICE_ACTION', options: {} }),
      })
      if (res.ok) {
        const data = await res.json()
        if (!data.isComplete) {
          setProfileGateMissingFields(data.missingFields)
          setBlockedAction(() => action)
          setProfileGateOpen(true)
          return false
        }
      }
      return true
    } catch {
      return true
    }
  }

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    const canProceed = await checkProfileBeforeAction(() => downloadPDFInternal(invoiceId, invoiceNumber))
    if (canProceed) downloadPDFInternal(invoiceId, invoiceNumber)
  }

  const downloadPDFInternal = async (invoiceId: string, invoiceNumber: string) => {
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
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const handlePayInvoice = async (invoice: Invoice) => {
    const canProceed = await checkProfileBeforeAction(() => setSelectedInvoiceForPayment(invoice))
    if (canProceed) setSelectedInvoiceForPayment(invoice)
  }

  // Calculations
  const totalPending = useMemo(
    () => invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
    [invoices]
  )

  const pendingCount = useMemo(
    () => invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length,
    [invoices]
  )

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

  const formatDate = (date: string) => new Date(date).toLocaleDateString('de-CH')

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Simple Breadcrumb */}
        <Link
          href="/my-watches"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Mein Verkaufen
        </Link>

        {/* Clean Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Gebühren & Rechnungen</h1>
          {pendingCount > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Sie haben <span className="font-medium text-primary-600">{pendingCount} offene {pendingCount === 1 ? 'Rechnung' : 'Rechnungen'}</span> über <span className="font-medium">CHF {formatCurrency(totalPending)}</span>
            </p>
          )}
        </div>

        {/* Invoice List - Clean Design */}
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
            <Receipt className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-base font-medium text-gray-900">Keine Rechnungen</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sie haben noch keine Verkaufsgebühren.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {invoices.map((invoice) => {
              const isOverdue = invoice.status === 'overdue'
              const isPaid = invoice.status === 'paid'
              const isExpanded = expandedInvoice === invoice.id
              const isHighlighted = highlightedInvoiceId === invoice.id

              return (
                <div
                  key={invoice.id}
                  ref={el => { invoiceRefs.current[invoice.id] = el }}
                  className={`transition-all ${isHighlighted ? 'bg-primary-50 ring-2 ring-primary-500 ring-inset' : ''}`}
                >
                  {/* Invoice Row */}
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Status Icon */}
                      <div className={`flex-shrink-0 rounded-full p-2 ${
                        isPaid ? 'bg-green-50' : isOverdue ? 'bg-red-50' : 'bg-amber-50'
                      }`}>
                        {isPaid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : isOverdue ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Receipt className="h-5 w-5 text-amber-600" />
                        )}
                      </div>

                      {/* Invoice Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                          {isOverdue && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              Überfällig
                            </span>
                          )}
                          {isPaid && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Bezahlt
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {isPaid && invoice.paidAt 
                            ? `Bezahlt am ${formatDate(invoice.paidAt)}`
                            : `Fällig am ${formatDate(invoice.dueDate)}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">
                        CHF {formatCurrency(invoice.total)}
                      </span>

                      {!isPaid && (
                        <button
                          onClick={() => handlePayInvoice(invoice)}
                          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                        >
                          Bezahlen
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        title="PDF herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                      <div className="ml-14">
                        {/* Items */}
                        <div className="space-y-3">
                          {invoice.items.map((item) => (
                            <div key={item.id} className="flex items-start justify-between text-sm">
                              <div className="flex items-start gap-3">
                                {item.watch?.images?.[0] && (
                                  <img
                                    src={item.watch.images[0]}
                                    alt={item.watch?.title || ''}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{item.description}</p>
                                  {item.watch && (
                                    <p className="text-gray-500">{item.watch.brand} {item.watch.model}</p>
                                  )}
                                </div>
                              </div>
                              <span className="text-gray-900">CHF {formatCurrency(item.total)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 border-t border-gray-200 pt-4 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Zwischensumme</span>
                            <span className="text-gray-900">CHF {formatCurrency(invoice.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">MwSt. ({(invoice.vatRate * 100).toFixed(1)}%)</span>
                            <span className="text-gray-900">CHF {formatCurrency(invoice.vatAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                            <span className="text-gray-900">Gesamt</span>
                            <span className="text-gray-900">CHF {formatCurrency(invoice.total)}</span>
                          </div>
                        </div>

                        {/* Invoice Meta */}
                        <div className="mt-4 flex gap-6 text-xs text-gray-500">
                          <span>Erstellt: {formatDate(invoice.createdAt)}</span>
                          <span>Fällig: {formatDate(invoice.dueDate)}</span>
                          {invoice.paidAt && <span>Bezahlt: {formatDate(invoice.paidAt)}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Help Text */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Fragen zu Ihren Rechnungen? <a href="mailto:support@helvenda.ch" className="text-primary-600 hover:underline">Kontaktieren Sie uns</a>
        </p>
      </main>

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
            loadInvoices()
          }}
          onPaymentSuccess={() => loadInvoices()}
        />
      )}

      {/* Profile Completion Gate */}
      <ProfileCompletionGate
        context="INVOICE_ACTION"
        missingFields={profileGateMissingFields}
        isOpen={profileGateOpen}
        onClose={() => {
          setProfileGateOpen(false)
          setBlockedAction(null)
        }}
        blocking={true}
      />
    </div>
  )
}

export default function SellingFeesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
      </div>
    }>
      <SellingFeesContent />
    </Suspense>
  )
}
