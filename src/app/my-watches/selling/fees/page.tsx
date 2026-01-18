'use client'

import { ProfileCompletionGate } from '@/components/account/ProfileCompletionGate'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { InvoicePaymentModal } from '@/components/payment/InvoicePaymentModal'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Receipt,
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

  const totalPaid = useMemo(
    () => paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
    [paidInvoices]
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

  const formatDate = (date: string) => new Date(date).toLocaleDateString('de-CH')

  // Check if overdue and get days
  const getOverdueInfo = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return {
      isOverdue: diffDays > 0,
      days: diffDays > 0 ? diffDays : 0
    }
  }

  // Get first item's image
  const getFirstImage = (invoice: Invoice) => {
    const firstItem = invoice.items[0]
    return firstItem?.watch?.images?.[0] || null
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

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Simple Header */}
          <div className="mb-6">
            <Link
              href="/my-watches/selling"
              className="text-sm text-gray-500 hover:text-primary-600"
            >
              ← Mein Verkaufen
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Gebühren & Rechnungen</h1>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('open')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'open'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Offen {openInvoices.length > 0 && `(${openInvoices.length})`}
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'paid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bezahlt {paidInvoices.length > 0 && `(${paidInvoices.length})`}
            </button>
          </div>

          {/* Invoice List */}
          {filteredInvoices.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
              {activeTab === 'open' ? (
                <>
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-4 font-medium text-gray-900">Keine offenen Rechnungen</p>
                  <p className="mt-1 text-sm text-gray-500">Alles bezahlt!</p>
                </>
              ) : (
                <>
                  <Receipt className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 font-medium text-gray-900">Keine bezahlten Rechnungen</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {filteredInvoices.map((invoice, index) => {
                const isPaid = invoice.status === 'paid'
                const isExpanded = expandedInvoice === invoice.id
                const isHighlighted = highlightedInvoiceId === invoice.id
                const firstImage = getFirstImage(invoice)
                const overdueInfo = !isPaid ? getOverdueInfo(invoice.dueDate) : null
                const isOverdue = overdueInfo?.isOverdue || false

                return (
                  <div
                    key={invoice.id}
                    ref={el => { invoiceRefs.current[invoice.id] = el }}
                    className={`${index > 0 ? 'border-t border-gray-100' : ''} ${
                      isHighlighted ? 'bg-primary-50' : ''
                    } ${isOverdue ? 'bg-red-50' : ''}`}
                  >
                    {/* Invoice Row */}
                    <div className={`flex items-center gap-4 p-4 ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
                      {/* Image */}
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {firstImage ? (
                          <Image src={firstImage} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Receipt className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            {invoice.invoiceNumber}
                          </span>
                          {isOverdue && overdueInfo && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                              <Clock className="h-3 w-3" />
                              {overdueInfo.days} Tage
                            </span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-sm ${isOverdue ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                          {isPaid && invoice.paidAt
                            ? `Bezahlt am ${formatDate(invoice.paidAt)}`
                            : isOverdue
                              ? `War fällig am ${formatDate(invoice.dueDate)}`
                              : `Fällig ${formatDate(invoice.dueDate)}`
                          }
                        </p>
                      </div>

                      {/* Amount + Actions */}
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-900">
                          CHF {formatCurrency(invoice.total)}
                        </span>

                        {!isPaid && (
                          <button
                            onClick={() => handlePayInvoice(invoice)}
                            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                          >
                            Bezahlen
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                        {/* Items */}
                        <div className="space-y-2">
                          {invoice.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.description}</span>
                              <span className="text-gray-900">CHF {formatCurrency(item.total)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-4 border-t border-gray-200 pt-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Zwischensumme</span>
                            <span className="text-gray-900">CHF {formatCurrency(invoice.subtotal)}</span>
                          </div>
                          <div className="mt-1 flex justify-between text-sm">
                            <span className="text-gray-500">MwSt. ({(invoice.vatRate * 100).toFixed(1)}%)</span>
                            <span className="text-gray-900">CHF {formatCurrency(invoice.vatAmount)}</span>
                          </div>
                          <div className="mt-2 flex justify-between font-medium">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">CHF {formatCurrency(invoice.total)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </button>
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
            <div className="mt-4 text-center text-sm text-gray-500">
              Total bezahlt: CHF {formatCurrency(totalPaid)}
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
