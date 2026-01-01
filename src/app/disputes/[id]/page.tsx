'use client'

import { DisputeChat } from '@/components/dispute/DisputeChat'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Flame,
  Package,
  Search,
  Shield,
  User,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DisputeDetail {
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
  }
  buyer: {
    id: string
    name: string
    email: string
    image?: string
  }
  seller: {
    id: string
    name: string
    email: string
    image?: string
  }
  disputeReason: string
  disputeDescription: string
  disputeStatus: string
  disputeOpenedAt: string | null
  disputeDeadline: string | null
  disputeResolvedAt: string | null
  disputeAttachments: string[] | null
  purchaseStatus: string
  purchasePrice: number | null
  createdAt: string
  paymentProtectionEnabled: boolean
  userRole: 'buyer' | 'seller'
  // Ricardo-Style Fields
  sellerResponseDeadline?: string | null
  sellerRespondedAt?: string | null
  disputeEscalationLevel?: number
  disputeEscalationReason?: string | null
  disputeRefundRequired?: boolean
  disputeRefundAmount?: number | null
  disputeRefundDeadline?: string | null
  disputeRefundCompletedAt?: string | null
}

const REASON_LABELS: Record<string, string> = {
  item_not_received: 'Artikel nicht erhalten',
  item_damaged: 'Artikel beschädigt',
  item_wrong: 'Falscher Artikel geliefert',
  item_not_as_described: 'Artikel entspricht nicht der Beschreibung',
  seller_not_responding: 'Verkäufer antwortet nicht',
  buyer_not_responding: 'Käufer antwortet nicht',
  payment_not_confirmed: 'Zahlung nicht bestätigt',
  payment_not_received: 'Zahlung nicht erhalten',
  buyer_not_paying: 'Käufer zahlt nicht',
  other: 'Sonstiges',
}

export default function DisputeDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const disputeId = params.id as string

  const [loading, setLoading] = useState(true)
  const [dispute, setDispute] = useState<DisputeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    loadDispute()
  }, [session, status, disputeId])

  const loadDispute = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/disputes/${disputeId}`)
      if (res.ok) {
        const data = await res.json()
        setDispute(data.dispute)
      } else {
        const errorData = await res.json()
        setError(errorData.message || 'Dispute nicht gefunden')
      }
    } catch (err) {
      console.error('Error loading dispute:', err)
      setError('Fehler beim Laden des Disputes')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            <Clock className="mr-1.5 h-4 w-4" />
            In Bearbeitung
          </span>
        )
      case 'escalated':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
            <Flame className="mr-1.5 h-4 w-4" />
            Eskaliert
          </span>
        )
      case 'under_review':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <Search className="mr-1.5 h-4 w-4" />
            In Prüfung
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Gelöst
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            <XCircle className="mr-1.5 h-4 w-4" />
            Abgelehnt
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Geschlossen
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="mb-2 text-xl font-bold text-gray-900">Dispute nicht gefunden</h1>
            <p className="mb-6 text-gray-600">
              {error || 'Der angeforderte Dispute existiert nicht.'}
            </p>
            <Link
              href="/my-watches/buying/purchased"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zu meinen Käufen
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const daysRemaining = dispute.disputeDeadline
    ? Math.max(
        0,
        Math.ceil(
          (new Date(dispute.disputeDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Link */}
        <Link
          href={
            dispute.userRole === 'buyer'
              ? '/my-watches/buying/purchased'
              : '/my-watches/selling/sold'
          }
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu {dispute.userRole === 'buyer' ? 'meinen Käufen' : 'meinen Verkäufen'}
        </Link>

        {/* Header */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dispute #{dispute.id.slice(-8)}
                </h1>
                <p className="mt-1 text-gray-600">
                  {REASON_LABELS[dispute.disputeReason] || dispute.disputeReason}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(dispute.disputeStatus)}
              {dispute.disputeStatus === 'pending' && daysRemaining !== null && (
                <span className="text-sm text-gray-500">
                  {daysRemaining > 0
                    ? `${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} bis zur Entscheidung`
                    : 'Entscheidung wird erwartet'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ricardo-Style: Escalation Banner */}
        {dispute.disputeStatus === 'escalated' && (
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Dieser Dispute wurde eskaliert</p>
                <p className="text-sm text-orange-700">
                  {dispute.userRole === 'seller'
                    ? 'Da keine rechtzeitige Stellungnahme erfolgte, wird der Fall nun mit höherer Priorität bearbeitet.'
                    : 'Ihr Fall wird nun mit höherer Priorität bearbeitet. Ein Helvenda-Mitarbeiter wird sich umgehend um Ihren Fall kümmern.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ricardo-Style: Seller Response Deadline Banner (for sellers) */}
        {dispute.userRole === 'seller' &&
          dispute.sellerResponseDeadline &&
          !dispute.sellerRespondedAt &&
          dispute.disputeStatus !== 'resolved' &&
          dispute.disputeStatus !== 'rejected' && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Ihre Stellungnahme ist erforderlich</p>
                  <p className="text-sm text-yellow-700">
                    Bitte antworten Sie bis zum{' '}
                    <strong>
                      {new Date(dispute.sellerResponseDeadline).toLocaleDateString('de-CH')}
                    </strong>
                    . Ohne Ihre Antwort wird der Fall automatisch eskaliert.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Ricardo-Style: Refund Required Banner (for sellers) */}
        {dispute.userRole === 'seller' &&
          dispute.disputeRefundRequired &&
          !dispute.disputeRefundCompletedAt && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    Rückerstattung erforderlich: CHF {(dispute.disputeRefundAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-red-700">
                    Bitte erstatten Sie den Betrag dem Käufer bis zum{' '}
                    <strong>
                      {dispute.disputeRefundDeadline
                        ? new Date(dispute.disputeRefundDeadline).toLocaleDateString('de-CH')
                        : 'baldmöglichst'}
                    </strong>
                    . Bei Nichterfüllung können Konsequenzen für Ihr Konto folgen.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Ricardo-Style: Refund Pending Banner (for buyers) */}
        {dispute.userRole === 'buyer' &&
          dispute.disputeRefundRequired &&
          !dispute.disputeRefundCompletedAt && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    Rückerstattung ausstehend: CHF {(dispute.disputeRefundAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-700">
                    Der Verkäufer wurde aufgefordert, Ihnen den Betrag zu erstatten. Wir werden Sie
                    benachrichtigen, sobald dies erfolgt ist.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Ricardo-Style: Refund Completed Banner */}
        {dispute.disputeRefundRequired && dispute.disputeRefundCompletedAt && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Rückerstattung bestätigt: CHF {(dispute.disputeRefundAmount || 0).toFixed(2)}
                </p>
                <p className="text-sm text-green-700">
                  Die Rückerstattung wurde am{' '}
                  {new Date(dispute.disputeRefundCompletedAt).toLocaleDateString('de-CH')}{' '}
                  bestätigt.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="space-y-6 lg:col-span-1">
            {/* Article Info */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Package className="h-5 w-5 text-gray-600" />
                Artikel
              </h2>
              <div className="flex items-start gap-4">
                {dispute.watch.images && dispute.watch.images.length > 0 && (
                  <img
                    src={dispute.watch.images[0]}
                    alt={dispute.watch.title}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{dispute.watch.title}</h3>
                  <p className="text-sm text-gray-600">
                    {dispute.watch.brand} {dispute.watch.model}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    CHF {(dispute.purchasePrice || dispute.watch.price).toFixed(2)}
                  </p>
                  {dispute.paymentProtectionEnabled && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <Shield className="h-3 w-3" />
                      Zahlungsschutz
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User className="h-5 w-5 text-gray-600" />
                Beteiligte Parteien
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Käufer</p>
                    <p className="font-medium text-gray-900">
                      {dispute.buyer.name}
                      {dispute.userRole === 'buyer' && (
                        <span className="ml-2 text-xs text-primary-600">(Sie)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Verkäufer</p>
                    <p className="font-medium text-gray-900">
                      {dispute.seller.name}
                      {dispute.userRole === 'seller' && (
                        <span className="ml-2 text-xs text-primary-600">(Sie)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem Description */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-gray-600" />
                Problembeschreibung
              </h2>
              <p className="whitespace-pre-wrap text-gray-700">{dispute.disputeDescription}</p>
              {dispute.disputeAttachments && dispute.disputeAttachments.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">Anhänge:</p>
                  <div className="flex flex-wrap gap-2">
                    {dispute.disputeAttachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4" />
                        Anhang {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="h-5 w-5 text-gray-600" />
                Zeitverlauf
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kauf</span>
                  <span className="font-medium text-gray-900">
                    {new Date(dispute.createdAt).toLocaleDateString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {dispute.disputeOpenedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dispute eröffnet</span>
                    <span className="font-medium text-gray-900">
                      {new Date(dispute.disputeOpenedAt).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {dispute.disputeDeadline && dispute.disputeStatus === 'pending' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entscheidungsfrist</span>
                    <span className="font-medium text-orange-600">
                      {new Date(dispute.disputeDeadline).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {dispute.disputeResolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gelöst am</span>
                    <span className="font-medium text-green-600">
                      {new Date(dispute.disputeResolvedAt).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <DisputeChat
              purchaseId={dispute.purchaseId}
              disputeStatus={dispute.disputeStatus}
              userRole={dispute.userRole}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
