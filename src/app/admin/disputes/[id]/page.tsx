'use client'

import { AdminDisputeChat } from '@/components/dispute/AdminDisputeChat'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
    disputeWarningCount?: number
    disputesLostCount?: number
    disputeRestrictionLevel?: string | null
  }
  disputeReason: string
  disputeDescription: string
  disputeStatus: string
  disputeOpenedAt: string | null
  disputeDeadline: string | null
  disputeFrozenAt: string | null
  disputeAttachments: string[]
  disputeReminderCount: number
  disputeReminderSentAt: string | null
  disputeResolvedAt: string | null
  disputeResolvedBy: string | null
  // Ricardo-Style Fields
  disputeInitiatedBy: string | null
  sellerResponseDeadline: string | null
  sellerRespondedAt: string | null
  sellerResponseText: string | null
  disputeEscalatedAt: string | null
  disputeEscalationLevel: number
  disputeEscalationReason: string | null
  disputeRefundRequired: boolean
  disputeRefundAmount: number | null
  disputeRefundDeadline: string | null
  disputeRefundCompletedAt: string | null
  sellerWarningIssued: boolean
  sellerWarningReason: string | null
  type: 'dispute' | 'cancellation'
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
  stripePaymentIntentId?: string | null
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
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  // Ricardo-Style Options
  const [requireManualRefund, setRequireManualRefund] = useState(false)
  const [refundAmount, setRefundAmount] = useState<number | undefined>(undefined)
  const [refundNote, setRefundNote] = useState('')
  const [issueWarning, setIssueWarning] = useState(false)
  const [warningReason, setWarningReason] = useState('')

  useEffect(() => {
    if (status === 'loading' || !params.id) return

    if (!session?.user) {
      router.push('/login')
      return
    }

    // Prüfe Admin-Status nur aus Session
    const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true

    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadDispute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.error(
          'Fehler beim Laden des Disputes: ' + (errorData.message || 'Unbekannter Fehler'),
          {
            duration: 4000,
            icon: '❌',
          }
        )
        router.push('/admin/disputes')
      }
    } catch (error) {
      console.error('Error loading dispute:', error)
      toast.error('Fehler beim Laden des Disputes. Bitte Seite neu laden.', {
        duration: 4000,
        icon: '❌',
      })
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution: resolution.trim(),
          refundBuyer,
          refundSeller,
          cancelPurchase,
          // Ricardo-Style Options
          requireManualRefund,
          refundAmount: requireManualRefund ? refundAmount : undefined,
          refundNote: requireManualRefund ? refundNote : undefined,
          issueWarning,
          warningReason: issueWarning ? warningReason : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('✓ Dispute erfolgreich gelöst!', {
          duration: 3000,
          icon: '✅',
        })
        router.push('/admin/disputes')
      } else {
        toast.error(data.message || 'Fehler beim Lösen des Disputes', {
          duration: 4000,
          icon: '❌',
        })
      }
    } catch (error: any) {
      console.error('Error resolving dispute:', error)
      toast.error(`Fehler beim Lösen des Disputes: ${error.message || 'Netzwerkfehler'}`, {
        duration: 4000,
        icon: '❌',
      })
    } finally {
      setResolving(false)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rejectionReason.trim()) {
      toast.error('Bitte geben Sie einen Ablehnungsgrund ein')
      return
    }

    if (!params.id) return
    setResolving(true)
    try {
      const res = await fetch(`/api/admin/disputes/${params.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejected: true,
          rejectionReason: rejectionReason.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('✓ Dispute abgelehnt!', { duration: 3000, icon: '✅' })
        router.push('/admin/disputes')
      } else {
        toast.error(data.message || 'Fehler beim Ablehnen des Disputes', {
          duration: 4000,
          icon: '❌',
        })
      }
    } catch (error: any) {
      console.error('Error rejecting dispute:', error)
      toast.error(`Fehler beim Ablehnen des Disputes: ${error.message || 'Netzwerkfehler'}`, {
        duration: 4000,
        icon: '❌',
      })
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
      other: 'Sonstiges',
    }
    return labels[reason] || reason
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            <Clock className="mr-1 h-4 w-4" />
            Offen
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckCircle className="mr-1 h-4 w-4" />
            Gelöst
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            <XCircle className="mr-1 h-4 w-4" />
            Abgelehnt
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            <CheckCircle className="mr-1 h-4 w-4" />
            Geschlossen
          </span>
        )
      case 'escalated':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
            <Clock className="mr-1 h-4 w-4" />
            Eskaliert
          </span>
        )
      case 'under_review':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <Clock className="mr-1 h-4 w-4" />
            In Prüfung
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
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
  const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true

  if (!isAdminInSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/admin/disputes"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Link>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dispute-Details</h1>
              <p className="mt-2 text-gray-600">
                ID: {dispute.id}
                {dispute.type === 'cancellation' && (
                  <span className="ml-2 rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                    Stornierungsantrag
                  </span>
                )}
              </p>
            </div>
            {getStatusBadge(dispute.disputeStatus)}
          </div>

          {/* Urgency Banner */}
          {dispute.disputeStatus === 'pending' &&
            dispute.disputeDeadline &&
            (() => {
              const deadline = new Date(dispute.disputeDeadline)
              const now = new Date()
              const daysLeft = Math.ceil(
                (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
              const isUrgent = daysLeft <= 3
              const isOverdue = daysLeft < 0

              if (isOverdue || isUrgent) {
                return (
                  <div
                    className={`mt-4 rounded-lg p-4 ${isOverdue ? 'border border-red-200 bg-red-50' : 'border border-orange-200 bg-orange-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}
                      />
                      <span
                        className={`font-medium ${isOverdue ? 'text-red-800' : 'text-orange-800'}`}
                      >
                        {isOverdue
                          ? `⚠️ Überfällig! Frist war am ${deadline.toLocaleDateString('de-CH')}`
                          : `⚡ Dringend: Noch ${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''} bis zur Frist (${deadline.toLocaleDateString('de-CH')})`}
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            })()}

          {/* Ricardo-Style: Escalation Banner */}
          {dispute.disputeEscalationLevel > 0 && (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-600">🚨</span>
                <span className="font-medium text-orange-800">
                  Eskaliert (Stufe {dispute.disputeEscalationLevel})
                  {dispute.disputeEscalationReason &&
                    ` - ${dispute.disputeEscalationReason === 'no_seller_response' ? 'Keine Verkäufer-Antwort' : dispute.disputeEscalationReason}`}
                </span>
              </div>
            </div>
          )}

          {/* Ricardo-Style: Seller Response Status */}
          {dispute.disputeInitiatedBy === 'buyer' && (
            <div
              className={`mt-4 rounded-lg p-4 ${dispute.sellerRespondedAt ? 'border border-green-200 bg-green-50' : 'border border-yellow-200 bg-yellow-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {dispute.sellerRespondedAt ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Verkäufer hat am{' '}
                        {new Date(dispute.sellerRespondedAt).toLocaleDateString('de-CH')}{' '}
                        geantwortet
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        Verkäufer hat noch nicht geantwortet
                        {dispute.sellerResponseDeadline &&
                          ` (Frist: ${new Date(dispute.sellerResponseDeadline).toLocaleDateString('de-CH')})`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {dispute.sellerResponseText && (
                <div className="mt-3 rounded bg-white p-3 text-sm text-gray-700">
                  <strong>Verkäufer-Stellungnahme:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{dispute.sellerResponseText}</p>
                </div>
              )}
            </div>
          )}

          {/* Ricardo-Style: Refund Status */}
          {dispute.disputeRefundRequired && (
            <div
              className={`mt-4 rounded-lg p-4 ${dispute.disputeRefundCompletedAt ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'}`}
            >
              <div className="flex items-center gap-2">
                {dispute.disputeRefundCompletedAt ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Rückerstattung bestätigt am{' '}
                      {new Date(dispute.disputeRefundCompletedAt).toLocaleDateString('de-CH')}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      💰 Rückerstattung ausstehend: CHF{' '}
                      {(dispute.disputeRefundAmount || 0).toFixed(2)}
                      {dispute.disputeRefundDeadline &&
                        ` (Frist: ${new Date(dispute.disputeRefundDeadline).toLocaleDateString('de-CH')})`}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Hauptinhalt */}
          <div className="space-y-6 lg:col-span-2">
            {/* Artikel-Informationen */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Artikel-Informationen</h2>
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
                  <p className="text-gray-600">
                    {dispute.watch.brand} {dispute.watch.model}
                  </p>
                  {dispute.purchasePrice && (
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      CHF {dispute.purchasePrice.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dispute-Informationen */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Dispute-Informationen</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Grund</label>
                  <p className="mt-1 text-gray-900">{getReasonLabel(dispute.disputeReason)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Beschreibung</label>
                  <p className="mt-1 whitespace-pre-wrap text-gray-900">
                    {dispute.disputeDescription}
                  </p>
                </div>

                {/* Beweismaterial/Anhänge */}
                {dispute.disputeAttachments && dispute.disputeAttachments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Beweismaterial ({dispute.disputeAttachments.length})
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dispute.disputeAttachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FileText className="h-4 w-4" />
                          Anhang {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Eröffnet am</label>
                    <p className="mt-1 text-gray-900">
                      {dispute.disputeOpenedAt
                        ? new Date(dispute.disputeOpenedAt).toLocaleString('de-CH')
                        : '-'}
                    </p>
                  </div>
                  {dispute.disputeDeadline && dispute.disputeStatus === 'pending' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Frist</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(dispute.disputeDeadline).toLocaleString('de-CH')}
                      </p>
                    </div>
                  )}
                  {dispute.disputeResolvedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gelöst am</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(dispute.disputeResolvedAt).toLocaleString('de-CH')}
                      </p>
                    </div>
                  )}
                  {dispute.disputeReminderCount > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Erinnerungen gesendet
                      </label>
                      <p className="mt-1 text-gray-900">
                        {dispute.disputeReminderCount}x
                        {dispute.disputeReminderSentAt && (
                          <span className="ml-1 text-xs text-gray-500">
                            (zuletzt:{' '}
                            {new Date(dispute.disputeReminderSentAt).toLocaleDateString('de-CH')})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kauf-Status */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Kauf-Status</h2>
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
                      <span className="ml-2 text-sm text-gray-500">
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
                      <span className="ml-2 text-sm text-gray-500">
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

            {/* Kommunikation/Chat */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                <MessageCircle className="h-5 w-5" />
                Kommunikation
              </h2>
              <AdminDisputeChat purchaseId={dispute.id} disputeStatus={dispute.disputeStatus} />
            </div>

            {/* Lösung-Formular (nur wenn noch nicht gelöst) */}
            {dispute.disputeStatus === 'pending' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Dispute bearbeiten</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        !showRejectForm
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Lösen
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        showRejectForm
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>

                {showRejectForm ? (
                  <form onSubmit={handleReject} className="space-y-4">
                    <div className="rounded-lg bg-red-50 p-4">
                      <p className="text-sm text-red-800">
                        <strong>Achtung:</strong> Bei Ablehnung wird der Dispute geschlossen und der
                        Initiator benachrichtigt. Der Kaufprozess wird wieder freigegeben.
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Ablehnungsgrund <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                        placeholder="Begründen Sie die Ablehnung..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resolving}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resolving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Wird verarbeitet...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Dispute ablehnen
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResolve} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Lösung <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={resolution}
                        onChange={e => setResolution(e.target.value)}
                        rows={6}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                        placeholder="Beschreiben Sie die Lösung des Disputes..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={cancelPurchase}
                          onChange={e => setCancelPurchase(e.target.checked)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Kauf stornieren</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={refundBuyer}
                          onChange={e => setRefundBuyer(e.target.checked)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          Rückerstattung an Käufer{' '}
                          {dispute.stripePaymentIntentId ? '(Stripe)' : '(Manuell)'}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={refundSeller}
                          onChange={e => setRefundSeller(e.target.checked)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Rückerstattung an Verkäufer</span>
                      </label>
                    </div>

                    {/* Ricardo-Style: Manual Refund Options */}
                    {refundBuyer && !dispute.stripePaymentIntentId && (
                      <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm font-medium text-yellow-800">
                          💰 Manuelle Rückerstattung (kein Stripe-Zahlungsschutz)
                        </p>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={requireManualRefund}
                            onChange={e => setRequireManualRefund(e.target.checked)}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="text-sm text-gray-700">
                            Verkäufer zur Rückerstattung auffordern (14 Tage Frist)
                          </span>
                        </label>
                        {requireManualRefund && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Rückerstattungsbetrag (CHF)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={refundAmount ?? dispute.purchasePrice ?? ''}
                                onChange={e =>
                                  setRefundAmount(parseFloat(e.target.value) || undefined)
                                }
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                placeholder={`z.B. ${dispute.purchasePrice?.toFixed(2) || '0.00'}`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Hinweis an Verkäufer
                              </label>
                              <textarea
                                value={refundNote}
                                onChange={e => setRefundNote(e.target.value)}
                                rows={2}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                placeholder="z.B. Grund für Rückerstattung..."
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Ricardo-Style: Warning Options */}
                    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-800">⚠️ Verkäufer-Konsequenzen</p>
                      {dispute.seller.disputeWarningCount !== undefined && (
                        <p className="text-xs text-red-600">
                          Aktuelle Warnungen: {dispute.seller.disputeWarningCount} / 3 | Verlorene
                          Disputes: {dispute.seller.disputesLostCount || 0}
                          {dispute.seller.disputeRestrictionLevel &&
                            ` | Status: ${dispute.seller.disputeRestrictionLevel}`}
                        </p>
                      )}
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={issueWarning}
                          onChange={e => setIssueWarning(e.target.checked)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">
                          Verwarnung an Verkäufer aussprechen
                        </span>
                      </label>
                      {issueWarning && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Verwarnungsgrund
                          </label>
                          <input
                            type="text"
                            value={warningReason}
                            onChange={e => setWarningReason(e.target.value)}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="z.B. Artikel nicht wie beschrieben..."
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={resolving}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Käufer-Informationen */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User className="h-5 w-5" />
                Käufer
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{dispute.buyer.name}</p>
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
                    <MapPin className="mt-0.5 h-4 w-4" />
                    {dispute.buyer.address}
                  </div>
                )}
              </div>
            </div>

            {/* Verkäufer-Informationen */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User className="h-5 w-5" />
                Verkäufer
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{dispute.seller.name}</p>
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
                    <MapPin className="mt-0.5 h-4 w-4" />
                    {dispute.seller.address}
                  </div>
                )}
              </div>
            </div>

            {/* Status-Historie */}
            {dispute.statusHistory && dispute.statusHistory.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
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
                      {entry.reason && <p className="mt-1 text-xs text-gray-600">{entry.reason}</p>}
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
