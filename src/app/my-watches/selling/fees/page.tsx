'use client'

import { ProfileCompletionGate } from '@/components/account/ProfileCompletionGate'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { InvoicePaymentModal } from '@/components/payment/InvoicePaymentModal'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  FileText,
  Package,
  Receipt,
  Tag,
  Wallet,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
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

type TabType = 'open' | 'paid'

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
  const [activeTab, setActiveTab] = useState<TabType>('open')

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
      // Find if invoice is paid or open to switch tab
      const invoice = invoices.find(i => i.id === invoiceId)
      if (invoice) {
        setActiveTab(invoice.status === 'paid' ? 'paid' : 'open')
      }

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

  // Filtered invoices
  const openInvoices = useMemo(
    () => invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue'),
    [invoices]
  )

  const paidInvoices = useMemo(
    () => invoices.filter(inv => inv.status === 'paid'),
    [invoices]
  )

  const filteredInvoices = activeTab === 'open' ? openInvoices : paidInvoices

  // Calculations
  const totalPending = useMemo(
    () => openInvoices.reduce((sum, inv) => sum + inv.total, 0),
    [openInvoices]
  )

  const totalPaid = useMemo(
    () => paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
    [paidInvoices]
  )

  const overdueCount = useMemo(
    () => invoices.filter(inv => inv.status === 'overdue').length,
    [invoices]
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      amount
    )

  const formatDate = (date: string) => new Date(date).toLocaleDateString('de-CH')

  // Get days until due or days overdue
  const getDaysInfo = (dueDate: string, status: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (status === 'overdue' || diffDays < 0) {
      return { text: `${Math.abs(diffDays)} Tage überfällig`, isOverdue: true }
    } else if (diffDays === 0) {
      return { text: 'Heute fällig', isOverdue: false }
    } else if (diffDays <= 3) {
      return { text: `In ${diffDays} Tagen fällig`, isOverdue: false }
    }
    return { text: `Fällig am ${formatDate(dueDate)}`, isOverdue: false }
  }

  // Get first item's watch info for preview
  const getPreviewInfo = (invoice: Invoice) => {
    const firstItem = invoice.items[0]
    if (firstItem?.watch) {
      return {
        image: firstItem.watch.images?.[0] || null,
        title: firstItem.watch.title || firstItem.description,
        brand: firstItem.watch.brand,
        model: firstItem.watch.model,
      }
    }
    return {
      image: null,
      title: firstItem?.description || 'Verkaufsgebühr',
      brand: null,
      model: null,
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600"></div>
          <p className="mt-3 text-sm text-gray-500">Lädt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary-600">
                  Startseite
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link href="/my-watches/selling" className="hover:text-primary-600">
                  Mein Verkaufen
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-900">Gebühren & Rechnungen</li>
            </ol>
          </nav>

          {/* Header with Icon */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 p-3 shadow-lg shadow-primary-200">
                <Receipt className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Gebühren & Rechnungen</h1>
                <p className="text-sm text-gray-500">Übersicht Ihrer Verkaufsgebühren</p>
              </div>
            </div>

            {/* Summary Box with Pay All CTA */}
            {openInvoices.length > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm lg:min-w-[380px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-100 p-2">
                      <Wallet className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {openInvoices.length} offene {openInvoices.length === 1 ? 'Rechnung' : 'Rechnungen'}
                      </p>
                      <p className="text-2xl font-bold text-amber-900">
                        CHF {formatCurrency(totalPending)}
                      </p>
                    </div>
                  </div>
                </div>

                {overdueCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">{overdueCount} überfällig</span>
                  </div>
                )}

                {openInvoices.length > 1 && (
                  <button
                    onClick={() => handlePayInvoice(openInvoices[0])}
                    className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-teal-600 px-5 py-3 font-semibold text-white shadow-lg shadow-primary-200 transition-all hover:from-primary-700 hover:to-teal-700 hover:shadow-xl"
                  >
                    <CreditCard className="h-5 w-5" />
                    Jetzt bezahlen
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Secondary Navigation */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Link
              href="/my-watches/selling"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Package className="h-4 w-4 text-gray-500" />
              Meine Angebote
            </Link>
            <Link
              href="/my-watches/selling/offers"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Tag className="h-4 w-4 text-gray-500" />
              Preisvorschläge
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
              <button
                onClick={() => setActiveTab('open')}
                className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'open'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Clock className="h-4 w-4" />
                Offen
                {openInvoices.length > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeTab === 'open' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {openInvoices.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'paid'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Bezahlt
                {paidInvoices.length > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeTab === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {paidInvoices.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Invoice List */}
          {filteredInvoices.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              {activeTab === 'open' ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Keine offenen Rechnungen</h3>
                  <p className="mt-2 text-gray-500">Alle Gebühren sind bezahlt. Weiter so!</p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Receipt className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Keine bezahlten Rechnungen</h3>
                  <p className="mt-2 text-gray-500">Sie haben noch keine Rechnungen bezahlt.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => {
                const isOverdue = invoice.status === 'overdue'
                const isPaid = invoice.status === 'paid'
                const isExpanded = expandedInvoice === invoice.id
                const isHighlighted = highlightedInvoiceId === invoice.id
                const preview = getPreviewInfo(invoice)
                const daysInfo = !isPaid ? getDaysInfo(invoice.dueDate, invoice.status) : null

                return (
                  <div
                    key={invoice.id}
                    ref={el => {
                      invoiceRefs.current[invoice.id] = el
                    }}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                      isHighlighted
                        ? 'border-primary-400 ring-2 ring-primary-200'
                        : isOverdue
                          ? 'border-red-200'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Main Invoice Row */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Left: Preview Image + Info */}
                        <div className="flex flex-1 items-center gap-4">
                          {/* Article Preview */}
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-20 sm:w-20">
                            {preview.image ? (
                              <Image
                                src={preview.image}
                                alt={preview.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            {/* Status Overlay */}
                            {!isPaid && (
                              <div className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-xs font-medium text-white ${
                                isOverdue ? 'bg-red-500' : 'bg-amber-500'
                              }`}>
                                {isOverdue ? 'Überfällig' : 'Offen'}
                              </div>
                            )}
                          </div>

                          {/* Invoice Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-semibold text-gray-900">
                                {preview.title}
                              </h3>
                            </div>
                            {preview.brand && (
                              <p className="mt-0.5 text-sm text-gray-500">
                                {preview.brand} {preview.model}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="font-mono">{invoice.invoiceNumber}</span>
                              {daysInfo && (
                                <span className={`flex items-center gap-1 ${daysInfo.isOverdue ? 'font-medium text-red-600' : ''}`}>
                                  <Calendar className="h-3 w-3" />
                                  {daysInfo.text}
                                </span>
                              )}
                              {isPaid && invoice.paidAt && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Bezahlt am {formatDate(invoice.paidAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount + Actions */}
                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                              CHF {formatCurrency(invoice.total)}
                            </p>
                            <p className="text-xs text-gray-500">inkl. MwSt.</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isPaid && (
                              <button
                                onClick={() => handlePayInvoice(invoice)}
                                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                              >
                                Bezahlen
                              </button>
                            )}

                            <button
                              onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                              title="PDF herunterladen"
                            >
                              <Download className="h-5 w-5" />
                            </button>

                            <button
                              onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
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
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4 sm:p-5">
                        {/* Items */}
                        <div className="mb-4">
                          <h4 className="mb-3 text-sm font-medium text-gray-700">Positionen</h4>
                          <div className="space-y-3">
                            {invoice.items.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  {item.watch?.images?.[0] ? (
                                    <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                                      <Image
                                        src={item.watch.images[0]}
                                        alt={item.watch?.title || ''}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                                      <Receipt className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900">{item.description}</p>
                                    {item.watch && (
                                      <p className="text-sm text-gray-500">
                                        {item.watch.brand} {item.watch.model}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="font-semibold text-gray-900">
                                  CHF {formatCurrency(item.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:ml-auto sm:max-w-xs">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Zwischensumme</span>
                              <span className="text-gray-900">CHF {formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">MwSt. ({(invoice.vatRate * 100).toFixed(1)}%)</span>
                              <span className="text-gray-900">CHF {formatCurrency(invoice.vatAmount)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                              <span className="text-gray-900">Gesamt</span>
                              <span className="text-primary-600">CHF {formatCurrency(invoice.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Erstellt: {formatDate(invoice.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Fällig: {formatDate(invoice.dueDate)}
                          </span>
                          {invoice.paidAt && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Bezahlt: {formatDate(invoice.paidAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Paid Summary */}
          {activeTab === 'paid' && paidInvoices.length > 0 && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{paidInvoices.length} bezahlte Rechnungen</span>
                </div>
                <span className="text-lg font-bold text-green-700">
                  Total: CHF {formatCurrency(totalPaid)}
                </span>
              </div>
            </div>
          )}
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
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600"></div>
            <p className="mt-3 text-sm text-gray-500">Lädt...</p>
          </div>
        </div>
      }
    >
      <SellingFeesContent />
    </Suspense>
  )
}
