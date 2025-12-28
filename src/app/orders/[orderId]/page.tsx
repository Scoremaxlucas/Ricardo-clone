'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Package,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  CreditCard,
  User,
  Calendar,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
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
    email: string
  }
  seller: {
    id: string
    name: string | null
    email: string
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
      setIsBuyer(orderData.buyerId === ((session?.user as { id?: string })?.id ?? ''))
      setIsSeller(orderData.sellerId === ((session?.user as { id?: string })?.id ?? ''))
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
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
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
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
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
              Die angeforderte Bestellung existiert nicht oder wurde noch nicht erstellt.
              Dies kann passieren, wenn die Zahlung noch nicht abgeschlossen wurde.
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
  const canConfirmReceipt = isBuyer && order.paymentStatus === 'paid' && !order.buyerConfirmedReceipt && order.disputeStatus === 'none'
  const canOpenDispute = isBuyer && order.paymentStatus === 'paid' && order.disputeStatus === 'none'

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={isBuyer ? '/my-watches/buying' : '/my-watches/selling'}
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu {isBuyer ? 'Meine Käufe' : 'Meine Verkäufe'}
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
          <div className="lg:col-span-2 space-y-6">
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

            {/* Zahlungsschutz Status */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <div className="flex items-start">
                <Shield className="mr-3 h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <h3 className="mb-2 font-semibold text-blue-900">Zahlungsschutz Status</h3>
                  {order.paymentStatus === 'paid' && !order.buyerConfirmedReceipt && (
                    <p className="text-sm text-blue-800">
                      Ihr Geld wird geschützt gehalten. Bitte bestätigen Sie den Erhalt der Ware,
                      um die Zahlung freizugeben.
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
                    <p className="text-sm text-blue-800">
                      Die Zahlung wurde zurückerstattet.
                    </p>
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

            {/* Timeline */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Zeitachse</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="mr-3 h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Bestellung erstellt</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString('de-CH')}
                    </p>
                  </div>
                </div>
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
                    <h3 className="mb-4 font-semibold text-gray-900">Problem mit der Bestellung?</h3>
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
                          <option value="item_not_as_described">Ware entspricht nicht der Beschreibung</option>
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
                        disabled={openingDispute || !disputeReason || disputeDescription.trim().length < 10}
                        className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        {openingDispute ? 'Wird verarbeitet...' : 'Dispute öffnen'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preis-Übersicht */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Preis-Übersicht</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Artikelpreis:</span>
                  <span className="font-medium">CHF {order.itemPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Versandkosten:</span>
                  <span className="font-medium">CHF {order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plattform-Gebühr:</span>
                  <span className="font-medium">CHF {order.platformFee.toFixed(2)}</span>
                </div>
                {order.protectionFee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zahlungsschutz:</span>
                    <span className="font-medium">CHF {order.protectionFee.toFixed(2)}</span>
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
                    {isBuyer ? order.seller.name || order.seller.email : order.buyer.name || order.buyer.email}
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
