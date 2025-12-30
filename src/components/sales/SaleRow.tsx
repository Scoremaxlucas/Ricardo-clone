'use client'

import { memo } from 'react'
import Image from 'next/image'
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Shield,
} from 'lucide-react'
import { formatCHF } from '@/lib/product-utils'

// === TYPES ===
export interface Sale {
  id: string
  soldAt: string
  shippingMethod: string | null
  paid: boolean
  paidAt: string | null
  status: string
  itemReceived: boolean
  itemReceivedAt: string | null
  paymentConfirmed: boolean
  paymentConfirmedAt: string | null
  paymentProtectionEnabled?: boolean
  isPaidViaStripe?: boolean
  stripePaymentStatus?: string | null
  orderId?: string | null
  contactDeadline: string | null
  sellerContactedAt: string | null
  buyerContactedAt: string | null
  contactWarningSentAt: string | null
  contactDeadlineMissed: boolean
  disputeOpenedAt: string | null
  disputeReason: string | null
  disputeStatus: string | null
  disputeResolvedAt: string | null
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    price: number
    finalPrice: number
    purchaseType: 'auction' | 'buy-now'
  }
  buyer: {
    id: string
    name: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    street: string | null
    streetNumber: string | null
    postalCode: string | null
    city: string | null
    phone: string | null
    paymentMethods: string | null
  }
}

interface SaleRowProps {
  sale: Sale
  onOpenDetails: (sale: Sale) => void
  onMarkContacted: (saleId: string) => void
  onConfirmPayment: (saleId: string) => void
  onOpenBuyerContact: (sale: Sale) => void
}

// === HELPER FUNCTIONS ===

/** Determine the primary action needed for this sale */
function getPrimaryAction(sale: Sale): {
  label: string
  action: 'contact' | 'mark_contacted' | 'confirm_payment' | 'shipping' | 'details' | 'view_offer'
  variant: 'danger' | 'warning' | 'primary' | 'secondary'
} {
  // Priority 1: Contact deadline issues
  if (sale.status === 'pending' && sale.contactDeadline && !sale.sellerContactedAt) {
    const deadline = new Date(sale.contactDeadline)
    const now = new Date()
    const isOverdue = now > deadline || sale.contactDeadlineMissed

    if (isOverdue) {
      return { label: 'Kontakt aufnehmen!', action: 'mark_contacted', variant: 'danger' }
    }
    
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysRemaining <= 2) {
      return { label: 'Kontakt markieren', action: 'mark_contacted', variant: 'warning' }
    }
    return { label: 'Kontakt markieren', action: 'mark_contacted', variant: 'primary' }
  }

  // Priority 2: Payment confirmation needed
  if (!sale.paymentConfirmed && sale.paid) {
    return { label: 'Zahlung bestätigen', action: 'confirm_payment', variant: 'primary' }
  }

  // Priority 3: Shipping info needed (after payment confirmed)
  if (sale.paymentConfirmed && !sale.itemReceived) {
    return { label: 'Versand vorbereiten', action: 'shipping', variant: 'primary' }
  }

  // Priority 4: Waiting for payment
  if (!sale.paid && !sale.paymentConfirmed) {
    return { label: 'Details', action: 'details', variant: 'secondary' }
  }

  // Default
  return { label: 'Details', action: 'details', variant: 'secondary' }
}

/** Get status chip info */
function getStatusChip(sale: Sale): { label: string; color: string; icon: React.ReactNode } {
  if (sale.status === 'completed') {
    return { label: 'Abgeschlossen', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> }
  }
  if (sale.disputeOpenedAt && sale.disputeStatus !== 'resolved') {
    return { label: 'Dispute', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-3 w-3" /> }
  }
  if (sale.isPaidViaStripe && !sale.itemReceived) {
    return { label: 'Bezahlt', color: 'bg-primary-100 text-primary-700', icon: <Shield className="h-3 w-3" /> }
  }
  if (sale.paymentConfirmed) {
    return { label: 'Zahlung bestätigt', color: 'bg-blue-100 text-blue-700', icon: <CreditCard className="h-3 w-3" /> }
  }
  if (sale.paid) {
    return { label: 'Käufer hat bezahlt', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> }
  }
  return { label: 'Warten auf Zahlung', color: 'bg-gray-100 text-gray-600', icon: <Clock className="h-3 w-3" /> }
}

/** Get deadline badge if relevant */
function getDeadlineBadge(sale: Sale): { text: string; variant: 'danger' | 'warning' | 'info' } | null {
  if (sale.status !== 'pending' || !sale.contactDeadline || sale.sellerContactedAt) {
    return null
  }

  const deadline = new Date(sale.contactDeadline)
  const now = new Date()
  const isOverdue = now > deadline || sale.contactDeadlineMissed

  if (isOverdue) {
    return { text: 'Frist überschritten!', variant: 'danger' }
  }

  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysRemaining <= 0) {
    return { text: 'Heute letzer Tag', variant: 'danger' }
  }
  if (daysRemaining <= 2) {
    return { text: `Frist ${daysRemaining}T`, variant: 'warning' }
  }
  if (daysRemaining <= 5) {
    return { text: `Frist ${daysRemaining}T`, variant: 'info' }
  }
  return null
}

// === COMPONENT ===
export const SaleRow = memo(function SaleRow({
  sale,
  onOpenDetails,
  onMarkContacted,
  onConfirmPayment,
  onOpenBuyerContact,
}: SaleRowProps) {
  const primaryAction = getPrimaryAction(sale)
  const statusChip = getStatusChip(sale)
  const deadlineBadge = getDeadlineBadge(sale)
  const buyerName = sale.buyer.name || sale.buyer.email?.split('@')[0] || 'Käufer'
  const saleDate = new Date(sale.soldAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })
  const imageUrl = sale.watch.images?.[0] || '/images/placeholder.jpg'

  const handlePrimaryAction = () => {
    switch (primaryAction.action) {
      case 'mark_contacted':
        onMarkContacted(sale.id)
        break
      case 'confirm_payment':
        onConfirmPayment(sale.id)
        break
      case 'shipping':
      case 'details':
        onOpenDetails(sale)
        break
      default:
        onOpenDetails(sale)
    }
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300 hover:shadow-sm lg:gap-4 lg:p-4">
      {/* LEFT: Thumbnail + Title + Meta */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Thumbnail */}
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 lg:h-16 lg:w-16">
          <Image
            src={imageUrl}
            alt={sale.watch.title}
            fill
            className="object-cover"
            sizes="64px"
          />
          {/* Type Chip overlay */}
          <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">
            {sale.watch.purchaseType === 'auction' ? 'Auktion' : 'Sofort'}
          </span>
        </div>

        {/* Title + Meta */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-gray-900 lg:text-base">
            {sale.watch.title}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
            <span>{sale.watch.brand}</span>
            <span className="text-gray-300">·</span>
            <span>{saleDate}</span>
            {sale.paymentProtectionEnabled && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-0.5 text-primary-600">
                  <Shield className="h-3 w-3" />
                  Schutz
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE: Buyer + Status (hidden on mobile, shown inline) */}
      <div className="hidden flex-shrink-0 items-center gap-4 lg:flex">
        {/* Buyer */}
        <div className="w-28 text-sm">
          <div className="truncate font-medium text-gray-700">{buyerName}</div>
        </div>

        {/* Price */}
        <div className="w-24 text-right">
          <span className="text-sm font-semibold text-gray-900">
            {formatCHF(sale.watch.finalPrice)}
          </span>
        </div>
      </div>

      {/* RIGHT: Status + Actions */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {/* Status Chip */}
        <div className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium sm:flex ${statusChip.color}`}>
          {statusChip.icon}
          <span className="hidden lg:inline">{statusChip.label}</span>
        </div>

        {/* Deadline Badge */}
        {deadlineBadge && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            deadlineBadge.variant === 'danger' ? 'bg-red-100 text-red-700' :
            deadlineBadge.variant === 'warning' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {deadlineBadge.text}
          </span>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handlePrimaryAction}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            primaryAction.variant === 'danger'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : primaryAction.variant === 'warning'
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : primaryAction.variant === 'primary'
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {primaryAction.label}
        </button>

        {/* Secondary Actions Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => onOpenDetails(sale)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Details öffnen"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
})

export default SaleRow
