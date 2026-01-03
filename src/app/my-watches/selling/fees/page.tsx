'use client'

import { ProfileCompletionGate } from '@/components/account/ProfileCompletionGate'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { InvoicePaymentModal } from '@/components/payment/InvoicePaymentModal'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Receipt,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

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
    const canProceed = await checkProfileBeforeAction(() =>
      downloadPDFInternal(invoiceId, invoiceNumber)
    )
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
    () =>
      invoices
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.total, 0),
    [invoices]
  )

  const pendingCount = useMemo(
    () => invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length,
    [invoices]
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      amount
    )

  const formatDate = (date: string) => new Date(date).toLocaleDateString('de-CH')

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <Link
          href="/my-watches"
          className="mb-4 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Mein Verkaufen
        </Link>

        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Gebühren & Rechnungen</h1>
            <p className="mt-1 text-gray-500">Übersicht Ihrer Verkaufsgebühren</p>
          </div>
          
          {/* Summary Card - Desktop */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 lg:min-w-[320px]">
              <div className="rounded-full bg-amber-100 p-2.5">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-800">
                  {pendingCount} offene {pendingCount === 1 ? 'Rechnung' : 'Rechnungen'}
                </p>
                <p className="text-lg font-bold text-amber-900">CHF {formatCurrency(totalPending)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
            <Receipt className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-6 text-lg font-semibold text-gray-900">Keine Rechnungen</h3>
            <p className="mt-2 text-gray-500">Sie haben noch keine Verkaufsgebühren.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {invoices.map((invoice, index) => {
              const isOverdue = invoice.status === 'overdue'
              const isPaid = invoice.status === 'paid'
              const isExpanded = expandedInvoice === invoice.id
              const isHighlighted = highlightedInvoiceId === invoice.id

              return (
                <div
                  key={invoice.id}
                  ref={el => {
                    invoiceRefs.current[invoice.id] = el
                  }}
                  className={`transition-all ${index > 0 ? 'border-t border-gray-100' : ''} ${isHighlighted ? 'bg-primary-50 ring-2 ring-inset ring-primary-500' : ''}`}
                >
                  {/* Invoice Row */}
                  <div className="flex flex-col gap-4 p-5 transition-colors hover:bg-gray-50 lg:flex-row lg:items-center lg:justify-between lg:p-6">
                    {/* Left: Status & Info */}
                    <div className="flex items-center gap-4 lg:gap-5">
                      {/* Status Icon */}
                      <div
                        className={`flex-shrink-0 rounded-xl p-3 ${
                          isPaid ? 'bg-green-100' : isOverdue ? 'bg-red-100' : 'bg-amber-100'
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : isOverdue ? (
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        ) : (
                          <Receipt className="h-6 w-6 text-amber-600" />
                        )}
                      </div>

                      {/* Invoice Info */}
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-semibold text-gray-900 lg:text-lg">{invoice.invoiceNumber}</span>
                          {isOverdue && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              Überfällig
                            </span>
                          )}
                          {isPaid && (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Bezahlt
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {isPaid && invoice.paidAt
                            ? `Bezahlt am ${formatDate(invoice.paidAt)}`
                            : `Fällig am ${formatDate(invoice.dueDate)}`}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between gap-4 lg:gap-6">
                      <span className="text-xl font-bold text-gray-900 lg:text-2xl">
                        CHF {formatCurrency(invoice.total)}
                      </span>

                      <div className="flex items-center gap-2 lg:gap-3">
                        {!isPaid && (
                          <button
                            onClick={() => handlePayInvoice(invoice)}
                            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                          >
                            Jetzt bezahlen
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          title="PDF herunterladen"
                        >
                          <Download className="inline h-4 w-4 lg:mr-2" />
                          <span className="hidden lg:inline">PDF</span>
                        </button>

                        <button
                          onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                          className="rounded-lg border border-gray-300 bg-white p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5 lg:p-6">
                      <div className="lg:ml-16">
                        {/* Items */}
                        <div className="space-y-4">
                          {invoice.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                              <div className="flex items-center gap-4">
                                {item.watch?.images?.[0] && (
                                  <img
                                    src={item.watch.images[0]}
                                    alt={item.watch?.title || ''}
                                    className="h-14 w-14 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{item.description}</p>
                                  {item.watch && (
                                    <p className="mt-0.5 text-sm text-gray-500">
                                      {item.watch.brand} {item.watch.model}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-base font-semibold text-gray-900">
                                CHF {formatCurrency(item.total)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-6 rounded-lg bg-white p-4 shadow-sm lg:ml-auto lg:max-w-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Zwischensumme</span>
                              <span className="text-gray-900">
                                CHF {formatCurrency(invoice.subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                MwSt. ({(invoice.vatRate * 100).toFixed(1)}%)
                              </span>
                              <span className="text-gray-900">
                                CHF {formatCurrency(invoice.vatAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                              <span className="text-gray-900">Gesamt</span>
                              <span className="text-gray-900">
                                CHF {formatCurrency(invoice.total)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Invoice Meta */}
                        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500">
                          <span>Erstellt: {formatDate(invoice.createdAt)}</span>
                          <span>Fällig: {formatDate(invoice.dueDate)}</span>
                          {invoice.paidAt && <span className="text-green-600">Bezahlt: {formatDate(invoice.paidAt)}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm lg:p-8">
          <p className="text-gray-600">
            Fragen zu Ihren Rechnungen oder Gebühren?
          </p>
          <a 
            href="mailto:support@helvenda.ch" 
            className="mt-3 inline-flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            support@helvenda.ch
          </a>
        </div>
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
        </div>
      }
    >
      <SellingFeesContent />
    </Suspense>
  )
}
