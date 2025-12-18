'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { InvoiceCardCompact } from './InvoiceCardCompact'

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

interface InvoiceListProps {
  invoices: Invoice[]
  onPay: (invoice: Invoice) => void
  onDownloadPDF: (invoiceId: string, invoiceNumber: string) => void
  highlightedInvoiceId?: string | null
  invoiceRefs?: { [key: string]: HTMLDivElement | null }
}

type FilterType = 'all' | 'pending' | 'paid'

export function InvoiceList({
  invoices,
  onPay,
  onDownloadPDF,
  highlightedInvoiceId,
  invoiceRefs,
}: InvoiceListProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices

    // Apply status filter
    if (filter === 'pending') {
      filtered = filtered.filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    } else if (filter === 'paid') {
      filtered = filtered.filter(inv => inv.status === 'paid')
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(query)
      )
    }

    // Sort: newest first (by createdAt)
    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [invoices, filter, searchQuery])

  const stats = useMemo(() => {
    return {
      all: invoices.length,
      pending: invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
    }
  }, [invoices])

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({stats.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Offen ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              filter === 'paid'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bezahlt ({stats.paid})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechnungsnummer suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:w-64"
          />
        </div>
      </div>

      {/* Invoice List */}
      {filteredAndSortedInvoices.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">
            {searchQuery
              ? 'Keine Rechnungen gefunden, die Ihrer Suche entsprechen.'
              : filter === 'pending'
                ? 'Keine offenen Rechnungen.'
                : filter === 'paid'
                  ? 'Keine bezahlten Rechnungen.'
                  : 'Keine Rechnungen gefunden.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedInvoices.map(invoice => (
            <div
              key={invoice.id}
              ref={el => {
                if (invoiceRefs) {
                  invoiceRefs[invoice.id] = el
                }
              }}
            >
              <InvoiceCardCompact
                invoice={invoice}
                onPay={() => onPay(invoice)}
                onDownloadPDF={() => onDownloadPDF(invoice.id, invoice.invoiceNumber)}
                isHighlighted={highlightedInvoiceId === invoice.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
