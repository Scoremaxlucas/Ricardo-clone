'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  MessageSquare,
  Package,
  Shield,
  Truck,
  User,
  X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ShippingInfoCard } from '@/components/shipping/ShippingInfoCard'
import { getShippingCostForMethod, getShippingLabels } from '@/lib/shipping'
import { formatCHF } from '@/lib/product-utils'
import type { Sale } from './SaleRow'

interface SaleDetailsDrawerProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  onMarkContacted: (saleId: string) => Promise<void>
  onConfirmPayment: (saleId: string) => Promise<void>
  onOpenBuyerContact: (sale: Sale) => void
  onDataRefresh: () => void
  sellerStripeStatus?: {
    hasStripeAccount: boolean
    isOnboardingComplete: boolean
    connectOnboardingStatus: string
    payoutsEnabled: boolean
  } | null
}

export function SaleDetailsDrawer({
  sale,
  isOpen,
  onClose,
  onMarkContacted,
  onConfirmPayment,
  onOpenBuyerContact,
  onDataRefresh,
  sellerStripeStatus,
}: SaleDetailsDrawerProps) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!sale) return null

  const imageUrl = sale.watch.images?.[0] || '/images/placeholder.jpg'

  // Parse shipping methods
  let shippingMethods: string[] = []
  let shippingCost = 0
  try {
    if (sale.shippingMethod) {
      shippingMethods = JSON.parse(sale.shippingMethod)
      shippingCost = shippingMethods.length > 0 ? getShippingCostForMethod(shippingMethods[0] as any) : 0
    }
  } catch {
    shippingMethods = []
  }
  const total = sale.watch.finalPrice + shippingCost

  // Contact deadline calculation
  const contactDeadlineInfo = (() => {
    if (sale.status !== 'pending' || !sale.contactDeadline || sale.sellerContactedAt) {
      return null
    }
    const deadline = new Date(sale.contactDeadline)
    const now = new Date()
    const timeUntilDeadline = deadline.getTime() - now.getTime()
    const daysRemaining = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24))
    const isOverdue = timeUntilDeadline < 0 || sale.contactDeadlineMissed
    return { deadline, daysRemaining, isOverdue }
  })()

  const handleMarkContacted = async () => {
    await onMarkContacted(sale.id)
  }

  const handleConfirmPayment = async () => {
    await onConfirmPayment(sale.id)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg transform bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <h2 id="drawer-title" className="text-lg font-semibold text-gray-900">
            Verkauf Details
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-4">
          {/* Product Info Header */}
          <div className="mb-4 flex gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={imageUrl}
                alt={sale.watch.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {sale.watch.purchaseType === 'auction' ? 'Auktion' : 'Sofortkauf'}
                </span>
                {sale.paymentProtectionEnabled && (
                  <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    <Shield className="h-3 w-3" />
                    Zahlungsschutz
                  </span>
                )}
              </div>
              <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
                {sale.watch.title}
              </h3>
              <p className="text-sm text-primary-600">
                {sale.watch.brand} {sale.watch.model}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Verkauft am {new Date(sale.soldAt).toLocaleDateString('de-CH')}
              </p>
            </div>
          </div>

          {/* === CONTACT DEADLINE WARNING === */}
          {contactDeadlineInfo && (
            <div
              className={`mb-4 rounded-lg border-2 p-3 ${
                contactDeadlineInfo.isOverdue
                  ? 'border-red-400 bg-red-50'
                  : contactDeadlineInfo.daysRemaining <= 2
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                    contactDeadlineInfo.isOverdue
                      ? 'text-red-600'
                      : contactDeadlineInfo.daysRemaining <= 2
                        ? 'text-orange-600'
                        : 'text-yellow-600'
                  }`}
                />
                <div className="flex-1">
                  <div
                    className={`mb-1 text-sm font-semibold ${
                      contactDeadlineInfo.isOverdue
                        ? 'text-red-900'
                        : contactDeadlineInfo.daysRemaining <= 2
                          ? 'text-orange-900'
                          : 'text-yellow-900'
                    }`}
                  >
                    {contactDeadlineInfo.isOverdue
                      ? '❌ Kontaktfrist überschritten'
                      : '⚠️ Kontaktaufnahme erforderlich'}
                  </div>
                  <p
                    className={`text-xs ${
                      contactDeadlineInfo.isOverdue
                        ? 'text-red-800'
                        : contactDeadlineInfo.daysRemaining <= 2
                          ? 'text-orange-800'
                          : 'text-yellow-800'
                    }`}
                  >
                    {contactDeadlineInfo.isOverdue ? (
                      <>
                        Die 7-Tage-Kontaktfrist wurde überschritten. Der Käufer kann den Kauf jetzt
                        stornieren. Bitte nehmen Sie umgehend Kontakt auf!
                      </>
                    ) : contactDeadlineInfo.daysRemaining > 0 ? (
                      <>
                        Sie müssen innerhalb von{' '}
                        <span className="font-bold">
                          {contactDeadlineInfo.daysRemaining} Tag
                          {contactDeadlineInfo.daysRemaining !== 1 ? 'en' : ''}
                        </span>{' '}
                        mit dem Käufer Kontakt aufnehmen, um Zahlungs- und Liefermodalitäten zu
                        klären.
                      </>
                    ) : (
                      <>Die Kontaktfrist läuft heute ab. Bitte nehmen Sie umgehend Kontakt auf.</>
                    )}
                  </p>
                  {sale.contactWarningSentAt && (
                    <p className="mt-1 text-xs italic text-gray-600">
                      Erinnerung gesendet am{' '}
                      {new Date(sale.contactWarningSentAt).toLocaleDateString('de-CH')}
                    </p>
                  )}
                  <button
                    onClick={handleMarkContacted}
                    className="mt-2 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    ✓ Kontakt aufgenommen markieren
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Already contacted indicator */}
          {sale.sellerContactedAt && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              Kontakt aufgenommen am{' '}
              {new Date(sale.sellerContactedAt).toLocaleDateString('de-CH')}
            </div>
          )}

          {/* === PRICE BREAKDOWN === */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Preisübersicht</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Verkaufspreis</span>
                <span className="font-medium text-gray-900">{formatCHF(sale.watch.finalPrice)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Versand</span>
                  <span className="font-medium text-gray-900">{formatCHF(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-green-700">{formatCHF(total)}</span>
              </div>
            </div>
          </div>

          {/* === SHIPPING INFO === */}
          {shippingMethods.length > 0 && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Truck className="h-4 w-4" />
                Lieferart
              </div>
              <p className="mt-1 text-sm text-blue-900">
                {getShippingLabels(shippingMethods as any).join(', ')}
              </p>
            </div>
          )}

          {/* === STATUS === */}
          <div className="mb-4 rounded-lg border border-gray-200 p-3">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">Status</h4>
            {sale.status === 'completed' ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Abgeschlossen</span>
              </div>
            ) : sale.isPaidViaStripe && !sale.itemReceived ? (
              <div className="flex items-center gap-2 text-primary-700">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Bezahlt - Warten auf Erhalt-Bestätigung</span>
              </div>
            ) : sale.paymentConfirmed ? (
              <div className="flex items-center gap-2 text-blue-700">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Zahlung bestätigt - Warten auf Erhalt-Bestätigung
                </span>
              </div>
            ) : sale.status === 'item_received' ? (
              <div className="flex items-center gap-2 text-orange-700">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Erhalt bestätigt - Warten auf Zahlungsbestätigung
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Warten auf Zahlung</span>
              </div>
            )}
          </div>

          {/* === BUYER INFO === */}
          <div className="mb-4 rounded-lg border border-gray-200 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User className="h-4 w-4" />
              Käufer
            </h4>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">
                {sale.buyer.firstName && sale.buyer.lastName
                  ? `${sale.buyer.firstName} ${sale.buyer.lastName}`
                  : sale.buyer.name || sale.buyer.email || 'Unbekannt'}
              </p>
              {sale.buyer.street && sale.buyer.streetNumber && (
                <p>
                  {sale.buyer.street} {sale.buyer.streetNumber}
                </p>
              )}
              {sale.buyer.postalCode && sale.buyer.city && (
                <p>
                  {sale.buyer.postalCode} {sale.buyer.city}
                </p>
              )}
              {sale.buyer.phone && <p className="mt-1 font-medium">Tel: {sale.buyer.phone}</p>}
              {sale.buyer.email && <p>E-Mail: {sale.buyer.email}</p>}
            </div>
          </div>

          {/* === HELVENDA PAYMENT PROTECTION INFO === */}
          {sale.paymentProtectionEnabled && sale.isPaidViaStripe && !sale.itemReceived && (
            <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                <Shield className="h-4 w-4" />
                Zahlung sicher erhalten
              </div>
              <p className="mt-1 text-xs text-primary-600">
                Das Geld wird sicher verwahrt und nach Erhalt-Bestätigung des Käufers freigegeben.
                {!sellerStripeStatus?.isOnboardingComplete && (
                  <Link
                    href="/my-watches/account?setup_payout=1"
                    className="ml-1 font-medium text-primary-800 underline"
                  >
                    Auszahlung einrichten →
                  </Link>
                )}
              </p>
            </div>
          )}

          {/* === ACTION BUTTONS === */}
          <div className="space-y-2">
            {/* Confirm Payment (if buyer marked as paid but seller hasn't confirmed) */}
            {!sale.paymentConfirmed && sale.paid && (
              <button
                onClick={handleConfirmPayment}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4" />
                Zahlung erhalten bestätigen
              </button>
            )}

            {/* Payment confirmed indicator */}
            {sale.paymentConfirmed && (
              <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-medium text-green-700">
                <CheckCircle className="h-4 w-4" />
                Zahlung bestätigt{' '}
                {sale.paymentConfirmedAt &&
                  new Date(sale.paymentConfirmedAt).toLocaleDateString('de-CH')}
              </div>
            )}

            {/* Waiting for payment indicator */}
            {!sale.paid && !sale.paymentConfirmed && (
              <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-700">
                <Clock className="h-4 w-4" />
                {sale.paymentProtectionEnabled
                  ? 'Warten auf sichere Zahlung durch Käufer'
                  : 'Warten auf Käufer-Bestätigung der Zahlung'}
              </div>
            )}

            {/* Shipping info card (when payment confirmed) */}
            {sale.paymentConfirmed && (
              <div className="my-3">
                <ShippingInfoCard
                  purchaseId={sale.id}
                  isSeller={true}
                  onShippingAdded={onDataRefresh}
                />
              </div>
            )}

            {/* Buyer contact button */}
            <button
              onClick={() => onOpenBuyerContact(sale)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <MessageSquare className="h-4 w-4" />
              Käufer kontaktieren
            </button>

            {/* Order details (for payment protected sales with order) */}
            {sale.paymentProtectionEnabled && sale.orderId && (
              <Link
                href={`/orders/${sale.orderId}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary-600 bg-white px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                <ExternalLink className="h-4 w-4" />
                Bestelldetails ansehen
              </Link>
            )}

            {/* View offer */}
            <Link
              href={`/products/${sale.watch.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              <ExternalLink className="h-4 w-4" />
              Angebot ansehen
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SaleDetailsDrawer
