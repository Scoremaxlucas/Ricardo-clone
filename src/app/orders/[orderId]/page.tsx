'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  RotateCcw,
  Shield,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  itemPrice: number
  shippingCost: number
  platformFee: number
  protectionFee: number | null
  orderStatus: string
  paymentStatus: string
  paymentMethod: string | null // 'stripe' | 'bank_transfer' | 'cash_on_pickup'
  selectedDeliveryMode: string | null // 'shipping' | 'pickup'
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  releasedAt: string | null
  refundedAt: string | null
  autoReleaseAt: string | null
  buyerConfirmedReceipt: boolean
  buyerConfirmedAt: string | null
  disputeStatus: string
  disputeOpenedAt: string | null
  disputeReason: string | null
  disputeDescription: string | null
  trackingNumber: string | null
  trackingProvider: string | null
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string | null
  }
  buyer: {
    id: string
    name: string | null
    nickname?: string | null
    email: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
  }
  seller: {
    id: string
    name: string | null
    nickname?: string | null
    email: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
  }
  createdAt: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBuyer, setIsBuyer] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)
  const [openingDispute, setOpeningDispute] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')

  // Cancellation state
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelDescription, setCancelDescription] = useState('')

  // Return request state
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [requestingReturn, setRequestingReturn] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnDescription, setReturnDescription] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    fetchOrder()
  }, [orderId, session])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[OrderDetail] Order not found:', orderId, errorData)

        // Don't redirect immediately - show error state
        setLoading(false)
        return
      }
      const data = await res.json()
      const orderData = data.order

      setOrder(orderData)
      // Use the isBuyer/isSeller flags from API (more reliable than comparing IDs)
      setIsBuyer(orderData.isBuyer === true)
      setIsSeller(orderData.isSeller === true)
    } catch (err: any) {
      console.error('[OrderDetail] Error:', err)
      // Don't redirect - show error state instead
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReceipt = async () => {
    if (!confirm('Möchten Sie wirklich bestätigen, dass Sie die Ware erhalten haben?')) {
      return
    }

    setConfirmingReceipt(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-receipt`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler bei der Bestätigung')
      }

      toast.success('Erhalt bestätigt. Zahlung wurde freigegeben.')
      fetchOrder()
    } catch (err: any) {
      toast.error(err.message || 'Fehler bei der Bestätigung')
    } finally {
      setConfirmingReceipt(false)
    }
  }

  const handleOpenDispute = async () => {
    if (!disputeReason || !disputeDescription || disputeDescription.trim().length < 10) {
      toast.error('Bitte geben Sie einen Grund und eine Beschreibung (mind. 10 Zeichen) ein.')
      return
    }

    setOpeningDispute(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: disputeReason,
          description: disputeDescription.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Öffnen des Disputes')
      }

      toast.success('Dispute erfolgreich geöffnet. Wir werden den Fall prüfen.')
      setDisputeReason('')
      setDisputeDescription('')
      fetchOrder()
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Öffnen des Disputes')
    } finally {
      setOpeningDispute(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason) {
      toast.error('Bitte wählen Sie einen Stornierungsgrund.')
      return
    }

    if (!confirm('Möchten Sie diese Bestellung wirklich stornieren?')) {
      return
    }

    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason,
          description: cancelDescription.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Fehler beim Stornieren')
      }

      toast.success(data.message || 'Bestellung erfolgreich storniert.')
      setCancelReason('')
      setCancelDescription('')
      setShowCancelForm(false)
      fetchOrder()
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Stornieren')
    } finally {
      setCancelling(false)
    }
  }

  const handleReturnRequest = async () => {
    if (!returnReason) {
      toast.error('Bitte wählen Sie einen Rückgabegrund.')
      return
    }
    if (!returnDescription || returnDescription.trim().length < 10) {
      toast.error('Bitte beschreiben Sie das Problem genauer (mind. 10 Zeichen).')
      return
    }

    if (!confirm('Möchten Sie wirklich eine Rückgabe beantragen?')) {
      return
    }

    setRequestingReturn(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/return-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: returnReason,
          description: returnDescription.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Fehler beim Einreichen des Rückgabe-Antrags')
      }

      toast.success(data.message || 'Rückgabe-Antrag erfolgreich eingereicht.')
      setReturnReason('')
      setReturnDescription('')
      setShowReturnForm(false)
      fetchOrder()
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Einreichen des Rückgabe-Antrags')
    } finally {
      setRequestingReturn(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      awaiting_payment: { label: 'Zahlung ausstehend', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Versandt', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Geliefert', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800' },
      canceled: { label: 'Storniert', color: 'bg-red-100 text-red-800' },
    }

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      created: { label: 'Erstellt', color: 'bg-gray-100 text-gray-800' },
      awaiting_payment: { label: 'Zahlung ausstehend', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Bezahlt', color: 'bg-green-100 text-green-800' },
      release_pending: { label: 'Freigabe ausstehend', color: 'bg-blue-100 text-blue-800' },
      released: { label: 'Freigegeben', color: 'bg-green-100 text-green-800' },
      refunded: { label: 'Zurückerstattet', color: 'bg-red-100 text-red-800' },
      disputed: { label: 'Dispute geöffnet', color: 'bg-orange-100 text-orange-800' },
    }

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    )
  }

  const parseImages = (images: string | null): string[] => {
    if (!images) return []
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-gray-500">Lädt...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">Bestellung nicht gefunden</h2>
            <p className="mb-6 text-gray-600">
              Die angeforderte Bestellung existiert nicht oder wurde noch nicht erstellt. Dies kann
              passieren, wenn die Zahlung noch nicht abgeschlossen wurde.
            </p>
            <div className="space-y-3">
              <Link
                href="/my-watches/buying/purchased"
                className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-primary-700"
              >
                Zurück zu Gekaufte Artikel
              </Link>
              <p className="text-sm text-gray-500">
                Falls Sie ein Problem haben, kontaktieren Sie bitte unseren Support.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const images = parseImages(order.watch.images)
  const isBuyerView = isBuyer
  const isPickup = order.selectedDeliveryMode === 'pickup' || order.paymentMethod === 'cash_on_pickup'

  // Bei Abholung: Kein Zahlungsschutz, keine Stripe-Zahlung
  // Bestätigung erfolgt persönlich bei Übergabe
  const canConfirmReceipt =
    isBuyer &&
    !isPickup && // Nicht bei Abholung - da persönliche Übergabe
    order.paymentStatus === 'paid' &&
    !order.buyerConfirmedReceipt &&
    order.disputeStatus === 'none'
  const canOpenDispute = isBuyer && !isPickup && order.paymentStatus === 'paid' && order.disputeStatus === 'none'

  // Cancellation: before payment, or pickup not yet completed, or paid but not shipped
  const canCancel =
    isBuyer &&
    order.orderStatus !== 'canceled' &&
    order.orderStatus !== 'completed' &&
    !order.buyerConfirmedReceipt &&
    (order.disputeStatus === 'none' || order.disputeStatus === 'resolved' || order.disputeStatus === 'closed') &&
    (
      // Before payment
      order.paymentStatus === 'created' || order.paymentStatus === 'awaiting_payment' ||
      // Pickup orders (any status before completed)
      isPickup ||
      // Paid but not shipped (after 14 days or to show the option with info)
      (order.paymentStatus === 'paid' && !order.shippedAt)
    )

  // Return: after receipt confirmed, within 14 days, no active dispute
  const canReturn =
    isBuyer &&
    !isPickup &&
    order.buyerConfirmedReceipt &&
    order.orderStatus !== 'canceled' &&
    (order.disputeStatus === 'none' || order.disputeStatus === 'resolved' || order.disputeStatus === 'closed') &&
    (() => {
      if (!order.buyerConfirmedAt) return false
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(order.buyerConfirmedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSince <= 14
    })()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={isBuyer ? '/my-watches/buying/purchased' : '/my-watches/selling'}
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu {isBuyer ? 'Gekaufte Artikel' : 'Meine Verkäufe'}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bestelldetails</h1>
              <p className="mt-2 text-gray-600">Bestellnummer: {order.orderNumber}</p>
            </div>
            <div className="flex gap-3">
              {getStatusBadge(order.orderStatus)}
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Artikel-Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Artikel</h2>
              <div className="flex gap-6">
                {images.length > 0 && (
                  <img
                    src={images[0]}
                    alt={order.watch.title}
                    className="h-32 w-32 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <Link
                    href={`/watches/${order.watch.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {order.watch.title}
                  </Link>
                  <p className="mt-1 text-gray-600">
                    {order.watch.brand} {order.watch.model}
                  </p>
                </div>
              </div>
            </div>

            {/* Zahlungsschutz Status - NUR bei Online-Zahlung anzeigen */}
            {!isPickup && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <div className="flex items-start">
                  <Shield className="mr-3 h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-blue-900">Zahlungsschutz Status</h3>
                    {order.paymentStatus === 'paid' && !order.buyerConfirmedReceipt && (
                      <p className="text-sm text-blue-800">
                        Ihr Geld wird geschützt gehalten. Bitte bestätigen Sie den Erhalt der Ware, um
                        die Zahlung freizugeben.
                      </p>
                    )}
                    {order.buyerConfirmedReceipt && (
                      <p className="text-sm text-blue-800">
                        ✅ Sie haben den Erhalt bestätigt. Die Zahlung wurde freigegeben.
                      </p>
                    )}
                    {order.paymentStatus === 'released' && (
                      <p className="text-sm text-blue-800">
                        ✅ Die Zahlung wurde erfolgreich an den Verkäufer freigegeben.
                      </p>
                    )}
                    {order.paymentStatus === 'refunded' && (
                      <p className="text-sm text-blue-800">Die Zahlung wurde zurückerstattet.</p>
                    )}
                    {order.disputeStatus !== 'none' && (
                      <p className="mt-2 text-sm text-orange-800">
                        ⚠️ Ein Dispute wurde geöffnet. Der Fall wird geprüft.
                      </p>
                    )}
                    {order.autoReleaseAt && order.paymentStatus === 'paid' && (
                      <p className="mt-2 text-sm text-blue-800">
                        <Clock className="mr-1 inline h-4 w-4" />
                        Automatische Freigabe: {new Date(order.autoReleaseAt).toLocaleString('de-CH')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Abholung Info - NUR bei Abholung anzeigen */}
            {isPickup && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start">
                  <User className="mr-3 h-6 w-6 text-amber-600" />
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-amber-900">Abholung vereinbaren</h3>
                    <p className="text-sm text-amber-800">
                      Dieser Artikel wird persönlich abgeholt. Bitte kontaktieren Sie {isBuyer ? 'den Verkäufer' : 'den Käufer'}, um einen Abholtermin zu vereinbaren.
                    </p>
                    <p className="mt-2 text-sm text-amber-800">
                      <strong>Hinweis:</strong> Die Zahlung erfolgt bar bei der Übergabe. Es gibt keinen Zahlungsschutz bei Abholung.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                {isPickup ? 'Status' : 'Zeitachse'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {isPickup ? 'Kauf bestätigt' : 'Bestellung erstellt'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString('de-CH')}
                    </p>
                  </div>
                </div>

                {/* Bei Abholung: Spezielle Timeline */}
                {isPickup && (
                  <>
                    <div className="flex items-start">
                      <Clock className="mr-3 h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-gray-900">Abholung vereinbaren</p>
                        <p className="text-sm text-gray-600">
                          Bitte kontaktieren Sie {isBuyer ? 'den Verkäufer' : 'den Käufer'} für die Terminvereinbarung
                        </p>
                      </div>
                    </div>
                    {order.orderStatus === 'completed' && (
                      <div className="flex items-start">
                        <CheckCircle className="mr-3 h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Abgeholt & Bezahlt</p>
                          <p className="text-sm text-gray-600">Transaktion abgeschlossen</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Bei Online-Zahlung: Standard Timeline */}
                {!isPickup && (
                  <>
                    {order.paidAt && (
                      <div className="flex items-start">
                        <CreditCard className="mr-3 h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Zahlung erhalten</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.paidAt).toLocaleString('de-CH')}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.shippedAt && (
                      <div className="flex items-start">
                        <Truck className="mr-3 h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Versandt</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.shippedAt).toLocaleString('de-CH')}
                          </p>
                          {order.trackingNumber && (
                            <p className="text-sm text-gray-600">
                              Tracking: {order.trackingNumber} ({order.trackingProvider})
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {order.buyerConfirmedAt && (
                      <div className="flex items-start">
                        <CheckCircle className="mr-3 h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Erhalt bestätigt</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.buyerConfirmedAt).toLocaleString('de-CH')}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.releasedAt && (
                      <div className="flex items-start">
                        <CheckCircle className="mr-3 h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Zahlung freigegeben</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.releasedAt).toLocaleString('de-CH')}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.disputeOpenedAt && (
                      <div className="flex items-start">
                        <AlertTriangle className="mr-3 h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">Dispute geöffnet</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.disputeOpenedAt).toLocaleString('de-CH')}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.refundedAt && (
                      <div className="flex items-start">
                        <XCircle className="mr-3 h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">Zurückerstattet</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.refundedAt).toLocaleString('de-CH')}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.orderStatus === 'canceled' && (
                      <div className="flex items-start">
                        <XCircle className="mr-3 h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-600">Bestellung storniert</p>
                          {(order as any).autoCancelledAt && (
                            <p className="text-sm text-gray-600">
                              {new Date((order as any).autoCancelledAt).toLocaleString('de-CH')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Dispute Info */}
            {order.disputeStatus !== 'none' && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                <h3 className="mb-3 font-semibold text-orange-900">Dispute-Informationen</h3>
                {order.disputeReason && (
                  <p className="mb-2 text-sm text-orange-800">
                    <strong>Grund:</strong> {order.disputeReason}
                  </p>
                )}
                {order.disputeDescription && (
                  <p className="text-sm text-orange-800">
                    <strong>Beschreibung:</strong> {order.disputeDescription}
                  </p>
                )}
              </div>
            )}

            {/* Buyer Actions */}
            {isBuyer && (
              <div className="space-y-4">
                {canConfirmReceipt && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold text-gray-900">Ware erhalten?</h3>
                    <p className="mb-4 text-sm text-gray-600">
                      Bestätigen Sie den Erhalt der Ware, um die Zahlung freizugeben.
                    </p>
                    <button
                      onClick={handleConfirmReceipt}
                      disabled={confirmingReceipt}
                      className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {confirmingReceipt ? 'Wird verarbeitet...' : 'Erhalt bestätigen'}
                    </button>
                  </div>
                )}

                {canOpenDispute && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold text-gray-900">
                      Problem mit der Bestellung?
                    </h3>
                    <p className="mb-4 text-sm text-gray-600">
                      Öffnen Sie einen Dispute, wenn Sie Probleme mit der Ware haben.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Grund
                        </label>
                        <select
                          value={disputeReason}
                          onChange={e => setDisputeReason(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                          <option value="">Bitte wählen...</option>
                          <option value="item_not_received">Ware nicht erhalten</option>
                          <option value="item_not_as_described">
                            Ware entspricht nicht der Beschreibung
                          </option>
                          <option value="damaged_item">Ware beschädigt</option>
                          <option value="wrong_item">Falsche Ware erhalten</option>
                          <option value="seller_not_responding">Verkäufer antwortet nicht</option>
                          <option value="other">Sonstiges</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Beschreibung
                        </label>
                        <textarea
                          value={disputeDescription}
                          onChange={e => setDisputeDescription(e.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
                          placeholder="Beschreiben Sie das Problem..."
                        />
                      </div>
                      <button
                        onClick={handleOpenDispute}
                        disabled={
                          openingDispute || !disputeReason || disputeDescription.trim().length < 10
                        }
                        className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        {openingDispute ? 'Wird verarbeitet...' : 'Dispute öffnen'}
                      </button>
                    </div>
                  </div>
                )}

                {/* === CANCELLATION SECTION === */}
                {canCancel && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <button
                      onClick={() => setShowCancelForm(!showCancelForm)}
                      className="flex w-full items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-gray-900">Bestellung stornieren</h3>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform ${showCancelForm ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {showCancelForm && (
                      <div className="mt-4 space-y-4">
                        {/* Info about cancellation eligibility */}
                        {order.paymentStatus === 'paid' && !order.shippedAt && !isPickup && (() => {
                          const paidDate = order.paidAt ? new Date(order.paidAt) : null
                          const daysSincePaid = paidDate
                            ? Math.floor((new Date().getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24))
                            : 0
                          if (daysSincePaid < 14) {
                            return (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm text-amber-800">
                                  <strong>Hinweis:</strong> Die automatische Stornierung ist erst 14 Tage nach Zahlung möglich,
                                  wenn der Verkäufer nicht versendet hat. Noch {14 - daysSincePaid} Tag(e) verbleibend.
                                  Sie können alternativ einen <strong>Dispute</strong> öffnen.
                                </p>
                              </div>
                            )
                          }
                          return null
                        })()}

                        <p className="text-sm text-gray-600">
                          {order.paymentStatus === 'created' || order.paymentStatus === 'awaiting_payment'
                            ? 'Sie können die Bestellung vor der Zahlung kostenlos stornieren.'
                            : isPickup
                              ? 'Sie können die Abholung stornieren, solange sie noch nicht stattgefunden hat.'
                              : 'Sie können die Bestellung stornieren, da der Verkäufer nicht innerhalb von 14 Tagen versendet hat.'}
                        </p>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Grund der Stornierung
                          </label>
                          <select
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            aria-label="Stornierungsgrund"
                          >
                            <option value="">Bitte wählen...</option>
                            <option value="changed_mind">Meinung geändert</option>
                            <option value="found_elsewhere">Anderswo gefunden</option>
                            <option value="price_too_high">Preis zu hoch</option>
                            <option value="seller_not_responding">Verkäufer antwortet nicht</option>
                            <option value="seller_not_shipping">Verkäufer hat nicht versendet</option>
                            <option value="other">Sonstiges</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Bemerkung <span className="text-gray-400">(optional)</span>
                          </label>
                          <textarea
                            value={cancelDescription}
                            onChange={e => setCancelDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Zusätzliche Informationen..."
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleCancelOrder}
                            disabled={cancelling || !cancelReason}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {cancelling ? 'Wird storniert...' : 'Bestellung stornieren'}
                          </button>
                          <button
                            onClick={() => {
                              setShowCancelForm(false)
                              setCancelReason('')
                              setCancelDescription('')
                            }}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === RETURN REQUEST SECTION === */}
                {canReturn && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <button
                      onClick={() => setShowReturnForm(!showReturnForm)}
                      className="flex w-full items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-gray-900">Rückgabe beantragen</h3>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform ${showReturnForm ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {showReturnForm && (
                      <div className="mt-4 space-y-4">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <p className="text-sm text-blue-800">
                            Sie haben <strong>14 Tage</strong> nach Erhaltbestätigung Zeit, eine Rückgabe zu beantragen.
                            {order.buyerConfirmedAt && (() => {
                              const daysLeft = 14 - Math.floor(
                                (new Date().getTime() - new Date(order.buyerConfirmedAt).getTime()) / (1000 * 60 * 60 * 24)
                              )
                              return daysLeft > 0
                                ? ` Noch ${daysLeft} Tag(e) verbleibend.`
                                : ' Frist läuft heute ab.'
                            })()}
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Rückgabegrund *
                          </label>
                          <select
                            value={returnReason}
                            onChange={e => setReturnReason(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            aria-label="Rückgabegrund"
                          >
                            <option value="">Bitte wählen...</option>
                            <option value="item_not_as_described">Artikel entspricht nicht der Beschreibung</option>
                            <option value="item_damaged">Artikel beschädigt</option>
                            <option value="item_defective">Artikel defekt</option>
                            <option value="wrong_item">Falscher Artikel erhalten</option>
                            <option value="item_missing_parts">Teile fehlen</option>
                            <option value="other">Sonstiges</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Beschreibung des Problems * <span className="text-gray-400">(mind. 10 Zeichen)</span>
                          </label>
                          <textarea
                            value={returnDescription}
                            onChange={e => setReturnDescription(e.target.value)}
                            rows={4}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Beschreiben Sie das Problem mit dem Artikel genau..."
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleReturnRequest}
                            disabled={requestingReturn || !returnReason || returnDescription.trim().length < 10}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {requestingReturn ? 'Wird eingereicht...' : 'Rückgabe beantragen'}
                          </button>
                          <button
                            onClick={() => {
                              setShowReturnForm(false)
                              setReturnReason('')
                              setReturnDescription('')
                            }}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preis-Übersicht */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">
                {isSeller ? 'Auszahlung' : 'Preis-Übersicht'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Artikelpreis:</span>
                  <span className="font-medium">CHF {order.itemPrice.toFixed(2)}</span>
                </div>
                {isBuyer && (
                  <>
                    {!isPickup && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Versandkosten:</span>
                        <span className="font-medium">CHF {order.shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    {isPickup ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lieferung:</span>
                          <span className="font-medium">Abholung (kostenlos)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Zahlung:</span>
                          <span className="font-medium">Bar bei Übergabe</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zahlungsschutz:</span>
                        <span className="font-medium text-green-600">Inklusive</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Gesamt:</span>
                        <span className="text-lg font-bold text-primary-600">
                          CHF {order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {isSeller && (() => {
                  // Bei Abholung: KEINE Stripe-Gebühren, nur Plattform-Kommission
                  if (isPickup) {
                    const sellerReceives = Math.round((order.itemPrice - order.platformFee) * 100) / 100
                    return (
                      <>
                        <div className="flex justify-between text-red-600">
                          <span>Kommission (5%):</span>
                          <span className="font-medium">- CHF {order.platformFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Zahlungsgebühr:</span>
                          <span className="font-medium">CHF 0.00</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          (Keine Gebühr bei Barzahlung)
                        </p>
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">Sie erhalten bar:</span>
                            <span className="text-lg font-bold text-green-600">
                              CHF {sellerReceives.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  }

                  // Online-Zahlung: Kombinierte Zahlungsgebühr (Processing + Payout)
                  const processingFee = order.protectionFee || 0
                  const sellerAmountBeforePayout = order.itemPrice - order.platformFee - processingFee
                  const payoutFee = sellerAmountBeforePayout * 0.0025 + 0.55
                  const combinedFee = Math.round((processingFee + payoutFee) * 100) / 100
                  const sellerReceives = Math.round((order.itemPrice - order.platformFee - combinedFee) * 100) / 100

                  return (
                    <>
                      <div className="flex justify-between text-red-600">
                        <span>Kommission (5%):</span>
                        <span className="font-medium">- CHF {order.platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Zahlungsgebühr:</span>
                        <span className="font-medium">- CHF {combinedFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Sie erhalten:</span>
                          <span className="text-lg font-bold text-green-600">
                            CHF {sellerReceives.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Kontakt-Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">
                {isBuyer ? 'Verkäufer' : 'Käufer'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {isBuyer
                      ? order.seller.nickname || order.seller.name || order.seller.email
                      : order.buyer.nickname || order.buyer.name || order.buyer.email}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {isBuyer ? order.seller.email : order.buyer.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
