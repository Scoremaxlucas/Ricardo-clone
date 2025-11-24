'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, User, Mail, Phone, MapPin, Package, CreditCard, Calendar, FileText, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'

interface Dispute {
  id: string
  purchaseId: string
  watchId: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    price: number
    buyNowPrice: number | null
  }
  buyer: {
    id: string
    name: string
    email: string
    phone: string | null
    address: string | null
    paymentMethods: any[]
  }
  seller: {
    id: string
    name: string
    email: string
    phone: string | null
    address: string | null
    paymentMethods: any[]
  }
  disputeReason: string
  disputeDescription: string
  disputeStatus: string
  disputeOpenedAt: string | null
  disputeResolvedAt: string | null
  disputeResolvedBy: string | null
  purchaseStatus: string
  purchasePrice: number | null
  shippingMethod: string | null
  itemReceived: boolean
  itemReceivedAt: string | null
  paymentConfirmed: boolean
  paymentConfirmedAt: string | null
  contactDeadline: string | null
  sellerContactedAt: string | null
  buyerContactedAt: string | null
  trackingNumber: string | null
  trackingProvider: string | null
  shippedAt: string | null
  createdAt: string
  statusHistory: any[]
}

export default function AdminDisputeDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [refundBuyer, setRefundBuyer] = useState(false)
  const [refundSeller, setRefundSeller] = useState(false)
  const [cancelPurchase, setCancelPurchase] = useState(false)

  useEffect(() => {
    if (status === 'loading' || !params.id) return

    if (!session?.user) {
      router.push('/login')
      return
    }

    // Prüfe Admin-Status nur aus Session
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadDispute()
  }, [session, status, router, params.id])

  const loadDispute = async () => {
    if (!params.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/disputes/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setDispute(data.dispute)
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        toast.error('Fehler beim Laden des Disputes: ' + (errorData.message || 'Unbekannter Fehler'))
        router.push('/admin/disputes')
      }
    } catch (error) {
      console.error('Error loading dispute:', error)
      toast.error('Fehler beim Laden des Disputes')
      router.push('/admin/disputes')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resolution.trim()) {
      toast.error('Bitte geben Sie eine Lösung ein')
      return
    }

    if (!params.id) return
    setResolving(true)
    try {
      const res = await fetch(`/api/admin/disputes/${params.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolution: resolution.trim(),
          refundBuyer,
          refundSeller,
          cancelPurchase
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Dispute erfolgreich gelöst!')
        router.push('/admin/disputes')
      } else {
        toast.error(data.message || 'Fehler beim Lösen des Disputes')
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast.error('Fehler beim Lösen des Disputes')
    } finally {
      setResolving(false)
    }
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      item_not_received: 'Artikel nicht erhalten',
      item_damaged: 'Artikel beschädigt',
      item_wrong: 'Falscher Artikel',
      payment_not_confirmed: 'Zahlung nicht bestätigt',
      seller_not_responding: 'Verkäufer antwortet nicht',
      buyer_not_responding: 'Käufer antwortet nicht',
      other: 'Sonstiges'
    }
    return labels[reason] || reason
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            Offen
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Gelöst
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Geschlossen
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Dispute nicht gefunden</p>
          <Link href="/admin/disputes" className="mt-4 text-primary-600 hover:text-primary-700">
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  // Prüfe Admin-Status erneut für UI
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

  if (!isAdminInSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite.</p>
          <Link href="/" className="mt-4 text-primary-600 hover:text-primary-700">
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link
          href="/admin/disputes"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Link>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dispute-Details</h1>
              <p className="mt-2 text-gray-600">ID: {dispute.id}</p>
            </div>
            {getStatusBadge(dispute.disputeStatus)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hauptinhalt */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artikel-Informationen */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Artikel-Informationen</h2>
              <div className="flex gap-4">
                {dispute.watch.images && dispute.watch.images.length > 0 && (
                  <img
                    src={dispute.watch.images[0]}
                    alt={dispute.watch.title}
                    className="h-24 w-24 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{dispute.watch.title}</h3>
                  <p className="text-gray-600">{dispute.watch.brand} {dispute.watch.model}</p>
                  {dispute.purchasePrice && (
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      CHF {dispute.purchasePrice.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dispute-Informationen */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispute-Informationen</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Grund</label>
                  <p className="mt-1 text-gray-900">{getReasonLabel(dispute.disputeReason)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Beschreibung</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{dispute.disputeDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Eröffnet am</label>
                    <p className="mt-1 text-gray-900">
                      {dispute.disputeOpenedAt
                        ? new Date(dispute.disputeOpenedAt).toLocaleString('de-CH')
                        : '-'}
                    </p>
                  </div>
                  {dispute.disputeResolvedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gelöst am</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(dispute.disputeResolvedAt).toLocaleString('de-CH')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kauf-Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kauf-Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-gray-900">{dispute.purchaseStatus}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Zahlung bestätigt</label>
                  <p className="mt-1 text-gray-900">
                    {dispute.paymentConfirmed ? 'Ja' : 'Nein'}
                    {dispute.paymentConfirmedAt && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({new Date(dispute.paymentConfirmedAt).toLocaleDateString('de-CH')})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Artikel erhalten</label>
                  <p className="mt-1 text-gray-900">
                    {dispute.itemReceived ? 'Ja' : 'Nein'}
                    {dispute.itemReceivedAt && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({new Date(dispute.itemReceivedAt).toLocaleDateString('de-CH')})
                      </span>
                    )}
                  </p>
                </div>
                {dispute.shippingMethod && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Versandart</label>
                    <p className="mt-1 text-gray-900">{dispute.shippingMethod}</p>
                  </div>
                )}
                {dispute.trackingNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tracking-Nummer</label>
                    <p className="mt-1 text-gray-900">{dispute.trackingNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lösung-Formular (nur wenn noch nicht gelöst) */}
            {dispute.disputeStatus === 'pending' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispute lösen</h2>
                <form onSubmit={handleResolve} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lösung <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Beschreiben Sie die Lösung des Disputes..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={cancelPurchase}
                        onChange={(e) => setCancelPurchase(e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Kauf stornieren</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={refundBuyer}
                        onChange={(e) => setRefundBuyer(e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Rückerstattung an Käufer</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={refundSeller}
                        onChange={(e) => setRefundSeller(e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Rückerstattung an Verkäufer</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={resolving}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Dispute lösen
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Käufer-Informationen */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Käufer
              </h2>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">{dispute.buyer.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {dispute.buyer.email}
                </div>
                {dispute.buyer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {dispute.buyer.phone}
                  </div>
                )}
                {dispute.buyer.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    {dispute.buyer.address}
                  </div>
                )}
              </div>
            </div>

            {/* Verkäufer-Informationen */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Verkäufer
              </h2>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">{dispute.seller.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {dispute.seller.email}
                </div>
                {dispute.seller.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {dispute.seller.phone}
                  </div>
                )}
                {dispute.seller.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    {dispute.seller.address}
                  </div>
                )}
              </div>
            </div>

            {/* Status-Historie */}
            {dispute.statusHistory && dispute.statusHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Status-Historie
                </h2>
                <div className="space-y-3">
                  {dispute.statusHistory.map((entry: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-3">
                      <p className="text-sm font-medium text-gray-900">{entry.status}</p>
                      {entry.timestamp && (
                        <p className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString('de-CH')}
                        </p>
                      )}
                      {entry.reason && (
                        <p className="text-xs text-gray-600 mt-1">{entry.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

