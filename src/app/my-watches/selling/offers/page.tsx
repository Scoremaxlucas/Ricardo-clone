'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Tag,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PriceOffer {
  id: string
  amount: number
  message: string | null
  status: string
  createdAt: string
  buyer: {
    id: string
    name: string | null
    nickname: string | null
    image: string | null
  }
  watch: {
    id: string
    title: string
    price: number
    images: string
  }
}

export default function ReceivedOffersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offers, setOffers] = useState<PriceOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null)
  const [confirmOfferId, setConfirmOfferId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as { id?: string })?.id) {
      fetchOffers()
    }
  }, [status, session])

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers?type=received')
      const data = await response.json()
      if (data.offers) {
        setOffers(data.offers)
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openConfirmModal = (offerId: string, action: 'accept' | 'reject') => {
    setConfirmOfferId(offerId)
    setConfirmAction(action)
    setShowConfirmModal(true)
  }

  const closeConfirmModal = () => {
    setShowConfirmModal(false)
    setConfirmOfferId(null)
    setConfirmAction(null)
  }

  const handleConfirm = async () => {
    if (!confirmOfferId || !confirmAction) return

    setProcessing(confirmOfferId)
    closeConfirmModal()

    try {
      const response = await fetch(`/api/offers/${confirmOfferId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: confirmAction }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(
          data.message ||
            `Fehler beim ${confirmAction === 'accept' ? 'Akzeptieren' : 'Ablehnen'} des Preisvorschlags`
        )
        return
      }

      // Aktualisiere die Liste
      await fetchOffers()

      if (confirmAction === 'accept') {
        toast.success('Preisvorschlag akzeptiert! Der Käufer wurde benachrichtigt.', {
          duration: 4000,
          icon: '✅',
        })
      } else {
        toast.success('Preisvorschlag abgelehnt.', {
          duration: 3000,
          icon: '✓',
        })
      }
    } catch (error) {
      toast.error(
        `Fehler beim ${confirmAction === 'accept' ? 'Akzeptieren' : 'Ablehnen'} des Preisvorschlags`
      )
    } finally {
      setProcessing(null)
    }
  }

  const handleAccept = (offerId: string) => {
    openConfirmModal(offerId, 'accept')
  }

  const handleReject = (offerId: string) => {
    openConfirmModal(offerId, 'reject')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const parseImages = (images: string): string[] => {
    try {
      if (typeof images === 'string') {
        return JSON.parse(images)
      }
      return Array.isArray(images) ? images : []
    } catch {
      return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <Link
          href="/my-watches"
          className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <h1 className="mb-8 flex items-center text-3xl font-bold text-gray-900">
          <Tag className="mr-3 h-8 w-8 text-primary-600" />
          Erhaltene Preisvorschläge
        </h1>

        {offers.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="py-12 text-center">
              <Tag className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Keine Preisvorschläge</h3>
              <p className="text-gray-600">Sie haben noch keine Preisvorschläge erhalten.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => {
              const images = parseImages(offer.watch.images)
              return (
                <div
                  key={offer.id}
                  className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
                >
                  <div className="flex gap-6">
                    {/* Bild */}
                    <Link href={`/products/${offer.watch.id}`} className="flex-shrink-0">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={offer.watch.title}
                          className="h-32 w-32 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                          Kein Bild
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1">
                      <Link
                        href={`/products/${offer.watch.id}`}
                        className="mb-2 block text-lg font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {offer.watch.title}
                      </Link>

                      <div className="mb-4 flex items-center gap-2">
                        {offer.buyer.image ? (
                          <img
                            src={offer.buyer.image}
                            alt={offer.buyer.nickname || offer.buyer.name || 'Käufer'}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <span className="text-sm text-gray-600">
                          {offer.buyer.nickname || offer.buyer.name || 'Unbekannter Käufer'}
                        </span>
                      </div>

                      <div className="mb-4 flex items-center gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Verkaufspreis</div>
                          <div className="text-lg font-semibold text-gray-900">
                            CHF {new Intl.NumberFormat('de-CH').format(offer.watch.price)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Preisvorschlag</div>
                          <div className="text-lg font-bold text-primary-600">
                            CHF {new Intl.NumberFormat('de-CH').format(offer.amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Differenz</div>
                          <div className="text-lg font-semibold text-red-600">
                            - CHF{' '}
                            {new Intl.NumberFormat('de-CH').format(
                              offer.watch.price - offer.amount
                            )}
                          </div>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="mb-4 rounded-lg bg-gray-50 p-3">
                          <div className="mb-1 text-sm text-gray-600">Nachricht vom Käufer</div>
                          <div className="text-sm text-gray-900">{offer.message}</div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {new Date(offer.createdAt).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(offer.id)}
                            disabled={processing === offer.id}
                            className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processing === offer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Ablehnen'
                            )}
                          </button>
                          <button
                            onClick={() => handleAccept(offer.id)}
                            disabled={processing === offer.id}
                            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processing === offer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Akzeptieren'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bestätigungs-Modal im Helvenda-Stil */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={closeConfirmModal}
        >
          <div
            className="w-full max-w-md rounded-lg border-2 border-gray-200 bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`rounded-lg p-2 ${
                  confirmAction === 'accept' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {confirmAction === 'accept' ? (
                  <CheckCircle
                    className={`h-6 w-6 ${
                      confirmAction === 'accept' ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Preisvorschlag {confirmAction === 'accept' ? 'akzeptieren' : 'ablehnen'}?
              </h3>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="mb-4 text-gray-700">
                {confirmAction === 'accept' ? (
                  <>
                    Möchten Sie diesen Preisvorschlag wirklich <strong>akzeptieren</strong>?
                    <br />
                    <span className="mt-2 block text-sm text-gray-500">
                      Der Käufer wird per E-Mail benachrichtigt und kann den Artikel kaufen.
                    </span>
                  </>
                ) : (
                  <>
                    Möchten Sie diesen Preisvorschlag wirklich <strong>ablehnen</strong>?
                    <br />
                    <span className="mt-2 block text-sm text-gray-500">
                      Der Käufer wird per E-Mail über die Ablehnung informiert.
                    </span>
                  </>
                )}
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Info className="h-4 w-4 text-gray-400" />
                  <span>Diese Aktion kann nicht rückgängig gemacht werden.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing === confirmOfferId}
                className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg ${
                  confirmAction === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {processing === confirmOfferId ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  <>
                    {confirmAction === 'accept' ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Akzeptieren
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        Ablehnen
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
