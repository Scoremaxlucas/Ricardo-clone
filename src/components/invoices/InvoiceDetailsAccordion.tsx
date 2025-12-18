'use client'

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

interface InvoiceDetailsAccordionProps {
  invoice: Invoice
}

export function InvoiceDetailsAccordion({ invoice }: InvoiceDetailsAccordionProps) {
  if (!invoice.items || invoice.items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Details sind für diese Rechnung nicht verfügbar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Line Items */}
      <div className="space-y-2">
        {invoice.items.map(item => {
          const itemVat = item.price * invoice.vatRate
          const itemTotal = item.price + itemVat
          return (
            <div
              key={item.id}
              className="flex items-start justify-between border-b border-gray-100 pb-2 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.description}</p>
                {item.watch && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.watch.brand} {item.watch.model}
                  </p>
                )}
                <div className="mt-1 flex gap-3 text-xs text-gray-600">
                  <span>
                    Netto: CHF{' '}
                    {new Intl.NumberFormat('de-CH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.price)}
                  </span>
                  <span>
                    MwSt: CHF{' '}
                    {new Intl.NumberFormat('de-CH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(itemVat)}
                  </span>
                </div>
              </div>
              <div className="ml-4 text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  CHF{' '}
                  {new Intl.NumberFormat('de-CH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(itemTotal)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="space-y-1 border-t border-gray-200 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Zwischensumme:</span>
          <span className="font-medium text-gray-900">
            CHF{' '}
            {new Intl.NumberFormat('de-CH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(invoice.subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">MwSt ({invoice.vatRate * 100}%):</span>
          <span className="font-medium text-gray-900">
            CHF{' '}
            {new Intl.NumberFormat('de-CH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(invoice.vatAmount)}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
          <span className="text-gray-900">Total:</span>
          <span className="text-primary-600">
            CHF{' '}
            {new Intl.NumberFormat('de-CH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(invoice.total)}
          </span>
        </div>
      </div>
    </div>
  )
}
