'use client'

import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'
import { DisputeModal } from '@/components/dispute/DisputeModal'
import { ShippingInfoCard } from '@/components/shipping/ShippingInfoCard'
import { getShippingCostForMethod, getShippingLabels } from '@/lib/shipping'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Package,
  PackageCheck,
  Shield,
  User,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Sale {
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

interface SaleDetailsDrawerProps {
  purchaseId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function SaleDetailsDrawer({ purchaseId, isOpen, onClose, onUpdate }: SaleDetailsDrawerProps) {
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(false)
  const [showBuyerModal, setShowBuyerModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Load sale details when purchaseId changes
  useEffect(() => {
    if (!purchaseId || !isOpen) {
      setSale(null)
      setDebugInfo(null)
      return
    }

    const loadSale = async () => {
      setLoading(true)
      setDebugInfo(null)
      try {
        // Use dedicated API endpoint for single sale
        const res = await fetch(`/api/sales/${purchaseId}?t=${Date.now()}`)
        const data = await res.json()
        
        if (res.ok) {
          setSale(data.sale || null)
        } else {
          console.error('Sale not found:', data)
          setSale(null)
          setDebugInfo(data.debug || null)
        }
      } catch (error) {
        console.error('Error loading sale:', error)
        setSale(null)
      } finally {
        setLoading(false)
      }
    }

    loadSale()
  }, [purchaseId, isOpen])

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const reloadSale = async () => {
    if (!purchaseId) return
    try {
      const res = await fetch(`/api/sales/${purchaseId}?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setSale(data.sale || null)
      }
    } catch (error) {
      console.error('Error reloading sale:', error)
    }
  }

  const handleConfirmPayment = async () => {
    if (!sale) return
    try {
      const res = await fetch(`/api/purchases/${sale.id}/confirm-payment`, { method: 'POST' })
      if (res.ok) {
        toast.success('Zahlung bestätigt!')
        onUpdate?.()
        await reloadSale()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler')
      }
    } catch {
      toast.error('Fehler beim Bestätigen')
    }
  }

  const handleMarkContacted = async () => {
    if (!sale) return
    try {
      const res = await fetch(`/api/purchases/${sale.id}/mark-contacted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'seller' }),
      })
      if (res.ok) {
        toast.success('Kontaktaufnahme markiert!')
        onUpdate?.()
        await reloadSale()
      }
    } catch {
      toast.error('Fehler')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Verkaufsdetails</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : !sale ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Package className="mb-4 h-12 w-12" />
              <p className="font-medium">Verkauf nicht gefunden</p>
              {purchaseId && (
                <p className="mt-2 text-xs text-gray-400">Gesuchte ID: {purchaseId}</p>
              )}
              
              {/* Debug info */}
              {debugInfo && (
                <div className="mt-4 w-full rounded-lg bg-gray-100 p-4 text-left text-xs">
                  <p className="mb-2 font-semibold text-gray-700">Debug-Information:</p>
                  {debugInfo.availablePurchases?.length > 0 ? (
                    <div>
                      <p className="text-gray-600">Verfügbare Verkäufe ({debugInfo.availablePurchases.length}):</p>
                      <ul className="mt-1 space-y-1">
                        {debugInfo.availablePurchases.map((p: any) => (
                          <li key={p.id} className="rounded bg-white p-2">
                            <span className="font-mono text-[10px]">ID: {p.id}</span>
                            <br />
                            <span className="font-mono text-[10px]">Watch: {p.watchId}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-600">Keine Verkäufe für diesen Verkäufer gefunden.</p>
                  )}
                </div>
              )}
              
              <button
                onClick={() => {
                  setLoading(true)
                  setDebugInfo(null)
                  fetch(`/api/sales/${purchaseId}?t=${Date.now()}`)
                    .then(res => res.json())
                    .then(data => {
                      console.log('Debug sale response:', data)
                      setSale(data.sale || null)
                      setDebugInfo(data.debug || null)
                    })
                    .catch(console.error)
                    .finally(() => setLoading(false))
                }}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Erneut versuchen
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="flex gap-4">
                {sale.watch.images?.[0] ? (
                  <img
                    src={sale.watch.images[0]}
                    alt={sale.watch.title}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {sale.watch.purchaseType === 'auction' ? 'Auktion' : 'Sofortkauf'}
                    </span>
                    {sale.paymentProtectionEnabled && (
                      <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                        <Shield className="h-3 w-3" />
                        Zahlungsschutz
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary-600">{sale.watch.brand} {sale.watch.model}</p>
                  <h3 className="font-semibold text-gray-900">{sale.watch.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Verkauft am {new Date(sale.soldAt).toLocaleDateString('de-CH')}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 font-medium text-gray-900">Preisübersicht</h4>
                {sale.shippingMethod ? (() => {
                  let methods: string[] = []
                  try { methods = JSON.parse(sale.shippingMethod) } catch { methods = [] }
                  const shippingCost = methods.length > 0 ? getShippingCostForMethod(methods[0] as any) : 0
                  const total = sale.watch.finalPrice + shippingCost
                  return (
                    <>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-gray-600">Verkaufspreis</span>
                        <span className="font-medium">CHF {sale.watch.finalPrice.toLocaleString('de-CH')}</span>
                      </div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-gray-600">Versand ({getShippingLabels(methods as any).join(', ')})</span>
                        <span className="font-medium">CHF {shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="font-semibold">Total</span>
                        <span className="text-lg font-bold text-green-700">CHF {total.toLocaleString('de-CH')}</span>
                      </div>
                    </>
                  )
                })() : (
                  <div className="flex justify-between">
                    <span className="font-semibold">Verkaufspreis</span>
                    <span className="text-lg font-bold text-green-700">
                      CHF {sale.watch.finalPrice.toLocaleString('de-CH')}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Deadline Warning */}
              {sale.status === 'pending' && sale.contactDeadline && !sale.sellerContactedAt && (() => {
                const deadline = new Date(sale.contactDeadline)
                const now = new Date()
                const timeLeft = deadline.getTime() - now.getTime()
                const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))
                const isOverdue = timeLeft < 0 || sale.contactDeadlineMissed

                return (
                  <div className={`rounded-lg border-2 p-4 ${
                    isOverdue ? 'border-red-400 bg-red-50' :
                    daysLeft <= 2 ? 'border-orange-400 bg-orange-50' :
                    'border-yellow-300 bg-yellow-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                        isOverdue ? 'text-red-600' : daysLeft <= 2 ? 'text-orange-600' : 'text-yellow-600'
                      }`} />
                      <div>
                        <h4 className={`font-semibold ${
                          isOverdue ? 'text-red-900' : daysLeft <= 2 ? 'text-orange-900' : 'text-yellow-900'
                        }`}>
                          {isOverdue ? '❌ Kontaktfrist überschritten' : '⚠️ Kontaktaufnahme erforderlich'}
                        </h4>
                        <p className={`mt-1 text-sm ${
                          isOverdue ? 'text-red-800' : daysLeft <= 2 ? 'text-orange-800' : 'text-yellow-800'
                        }`}>
                          {isOverdue
                            ? 'Der Käufer kann den Kauf jetzt stornieren. Bitte umgehend Kontakt aufnehmen!'
                            : `Noch ${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''} Zeit, um den Käufer zu kontaktieren.`
                          }
                        </p>
                        <button
                          onClick={handleMarkContacted}
                          className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                        >
                          ✓ Kontakt aufgenommen markieren
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Contact confirmed */}
              {sale.sellerContactedAt && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Kontakt aufgenommen am {new Date(sale.sellerContactedAt).toLocaleDateString('de-CH')}</span>
                </div>
              )}

              {/* Status */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 font-medium text-gray-900">Status</h4>
                <div className="flex items-center gap-3">
                  {sale.status === 'completed' ? (
                    <>
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700">Abgeschlossen</p>
                        <p className="text-sm text-gray-500">Transaktion erfolgreich beendet</p>
                      </div>
                    </>
                  ) : sale.isPaidViaStripe && !sale.itemReceived ? (
                    <>
                      <div className="rounded-full bg-primary-100 p-2">
                        <Shield className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-primary-700">Bezahlt</p>
                        <p className="text-sm text-gray-500">Warten auf Erhalt-Bestätigung des Käufers</p>
                      </div>
                    </>
                  ) : sale.paymentConfirmed ? (
                    <>
                      <div className="rounded-full bg-blue-100 p-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-700">Zahlung bestätigt</p>
                        <p className="text-sm text-gray-500">
                          {sale.paymentConfirmedAt && new Date(sale.paymentConfirmedAt).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                    </>
                  ) : sale.status === 'item_received' ? (
                    <>
                      <div className="rounded-full bg-orange-100 p-2">
                        <PackageCheck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-orange-700">Erhalt bestätigt</p>
                        <p className="text-sm text-gray-500">Warten auf Ihre Zahlungsbestätigung</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-full bg-gray-100 p-2">
                        <Clock className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Warten auf Zahlung</p>
                        <p className="text-sm text-gray-500">Der Käufer muss noch bezahlen</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dispute Banner - für Verkäufer wenn Dispute aktiv */}
              {sale.disputeOpenedAt && (
                <div className={`rounded-lg border-2 p-4 ${
                  sale.disputeStatus === 'resolved' || sale.disputeStatus === 'rejected'
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-red-300 bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`mt-0.5 h-6 w-6 flex-shrink-0 ${
                      sale.disputeStatus === 'resolved' || sale.disputeStatus === 'rejected'
                        ? 'text-gray-500'
                        : 'text-red-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${
                          sale.disputeStatus === 'resolved' || sale.disputeStatus === 'rejected'
                            ? 'text-gray-700'
                            : 'text-red-900'
                        }`}>
                          {sale.disputeStatus === 'resolved'
                            ? '✓ Dispute gelöst'
                            : sale.disputeStatus === 'rejected'
                              ? '✗ Dispute abgelehnt'
                              : '⚠️ Dispute aktiv'}
                        </h4>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          sale.disputeStatus === 'resolved'
                            ? 'bg-green-100 text-green-700'
                            : sale.disputeStatus === 'rejected'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {sale.disputeStatus === 'pending'
                            ? 'In Bearbeitung'
                            : sale.disputeStatus === 'resolved'
                              ? 'Gelöst'
                              : sale.disputeStatus === 'rejected'
                                ? 'Abgelehnt'
                                : sale.disputeStatus}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${
                        sale.disputeStatus === 'resolved' || sale.disputeStatus === 'rejected'
                          ? 'text-gray-600'
                          : 'text-red-800'
                      }`}>
                        {sale.disputeReason && (
                          <span className="font-medium">Grund: {sale.disputeReason}</span>
                        )}
                        {sale.disputeStatus === 'pending' && (
                          <span className="block mt-1">
                            Der Käufer hat ein Problem gemeldet. Bitte reagieren Sie zeitnah.
                          </span>
                        )}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/disputes/${sale.id}`}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium ${
                            sale.disputeStatus === 'resolved' || sale.disputeStatus === 'rejected'
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Dispute-Details ansehen
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Info */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 font-medium text-gray-900">Käufer</h4>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {sale.buyer.name || sale.buyer.email || 'Unbekannt'}
                    </p>
                    {sale.buyer.city && (
                      <p className="text-sm text-gray-500">{sale.buyer.postalCode} {sale.buyer.city}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowBuyerModal(true)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Kontakt
                  </button>
                </div>
                {sale.buyer.phone && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                    <p className="font-medium">Telefon: {sale.buyer.phone}</p>
                    {sale.buyer.email && <p>E-Mail: {sale.buyer.email}</p>}
                  </div>
                )}
              </div>

              {/* Payment Protection Info */}
              {sale.paymentProtectionEnabled && sale.isPaidViaStripe && !sale.itemReceived && (
                <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 flex-shrink-0 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-primary-900">Zahlung sicher erhalten</h4>
                      <p className="mt-1 text-sm text-primary-700">
                        Das Geld wird sicher verwahrt und nach Erhalt-Bestätigung des Käufers an Sie freigegeben.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              {sale.paymentConfirmed && (
                <div>
                  <h4 className="mb-3 font-medium text-gray-900">Versand</h4>
                  <ShippingInfoCard
                    purchaseId={sale.id}
                    isSeller={true}
                    onShippingAdded={() => {
                      onUpdate?.()
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {sale && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-col gap-3">
              {/* Confirm payment button */}
              {!sale.paymentConfirmed && sale.paid && (
                <button
                  onClick={handleConfirmPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
                >
                  <CreditCard className="h-5 w-5" />
                  Zahlung erhalten bestätigen
                </button>
              )}

              {/* Order details link */}
              {sale.paymentProtectionEnabled && sale.orderId && (
                <Link
                  href={`/orders/${sale.orderId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary-600 bg-white px-4 py-3 font-medium text-primary-600 hover:bg-primary-50"
                >
                  <ExternalLink className="h-5 w-5" />
                  Bestelldetails ansehen
                </Link>
              )}

              {/* View product */}
              <Link
                href={`/products/${sale.watch.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 hover:bg-gray-200"
              >
                Angebot ansehen
              </Link>

              {/* Problem melden Button - nur wenn noch kein Dispute existiert */}
              {!sale.disputeOpenedAt && sale.status !== 'completed' && sale.status !== 'cancelled' && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 font-medium text-orange-700 transition-colors hover:bg-orange-100"
                >
                  <AlertTriangle className="h-5 w-5" />
                  Problem melden
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buyer Modal */}
      {sale && (
        <BuyerInfoModal
          buyer={sale.buyer}
          watchTitle={sale.watch.title}
          purchaseId={sale.id}
          isPaid={sale.paid}
          isOpen={showBuyerModal}
          onClose={() => setShowBuyerModal(false)}
          onMarkPaid={() => {
            onUpdate?.()
          }}
        />
      )}

      {/* Dispute Modal */}
      {sale && (
        <DisputeModal
          purchaseId={sale.id}
          watchTitle={sale.watch.title}
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            onUpdate?.()
            reloadSale()
          }}
          userRole="seller"
        />
      )}
    </>
  )
}
