'use client'

import { CheckCircle, Clock, Download, CreditCard, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { InvoiceDetailsAccordion } from './InvoiceDetailsAccordion'

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

interface InvoiceCardCompactProps {
  invoice: Invoice
  onPay: () => void
  onDownloadPDF: () => void
  isHighlighted?: boolean
}

export function InvoiceCardCompact({
  invoice,
  onPay,
  onDownloadPDF,
  isHighlighted = false,
}: InvoiceCardCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const isCreditNote = invoice.invoiceNumber.startsWith('KORR-')

  return (
    <div
      className={`rounded-lg bg-white p-4 shadow-sm transition-all ${
        isHighlighted ? 'ring-4 ring-primary-500 ring-offset-2' : ''
      }`}
    >
      {/* Compact Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {invoice.invoiceNumber}
            </h3>
            {isCreditNote && (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 whitespace-nowrap">
                Korrektur-Abrechnung
              </span>
            )}
            {getStatusBadge(invoice.status)}
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 text-xs text-gray-500">
            <span>
              Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-CH')}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Erstellt: {new Date(invoice.createdAt).toLocaleDateString('de-CH')}
            </span>
            {invoice.paidAt && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-green-600">
                  Bezahlt am: {new Date(invoice.paidAt).toLocaleDateString('de-CH')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Amount and Actions */}
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2 sm:flex-shrink-0">
          <p
            className={`text-lg font-bold sm:text-xl ${
              isCreditNote ? 'text-green-600' : 'text-gray-900'
            }`}
          >
            CHF{' '}
            {new Intl.NumberFormat('de-CH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Math.abs(invoice.total))}
          </p>

          {/* Actions Row */}
          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' && !isCreditNote && (
              <button
                onClick={onPay}
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 sm:text-sm"
              >
                <CreditCard className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Jetzt bezahlen</span>
                <span className="sm:hidden">Bezahlen</span>
              </button>
            )}
            {invoice.status === 'paid' && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 cursor-not-allowed sm:text-sm">
                <CheckCircle className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Bezahlt</span>
              </span>
            )}
            <button
              onClick={onDownloadPDF}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:text-sm"
            >
              <Download className="mr-1.5 h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
        >
          <span>Details {isExpanded ? 'ausblenden' : 'anzeigen'}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3">
            <InvoiceDetailsAccordion invoice={invoice} />
          </div>
        )}
      </div>
    </div>
  )
}
