'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Tag, CheckCircle, XCircle, Loader2, User, AlertTriangle, Info } from 'lucide-react'
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
    if (status === 'authenticated' && session?.user?.id) {
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: confirmAction })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || `Fehler beim ${confirmAction === 'accept' ? 'Akzeptieren' : 'Ablehnen'} des Preisvorschlags`)
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
      toast.error(`Fehler beim ${confirmAction === 'accept' ? 'Akzeptieren' : 'Ablehnen'} des Preisvorschlags`)
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
      <div className="max-w-7xl mx-auto px-4">
        <Link
          href="/my-watches"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Mein Verkaufen
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <Tag className="h-8 w-8 mr-3 text-primary-600" />
          Erhaltene Preisvorschläge
        </h1>

        {offers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Preisvorschläge
              </h3>
              <p className="text-gray-600">
                Sie haben noch keine Preisvorschläge erhalten.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => {
              const images = parseImages(offer.watch.images)
              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-6">
                    {/* Bild */}
                    <Link href={`/products/${offer.watch.id}`} className="flex-shrink-0">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={offer.watch.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          Kein Bild
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1">
                      <Link
                        href={`/products/${offer.watch.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-primary-600 mb-2 block"
                      >
                        {offer.watch.title}
                      </Link>

                      <div className="flex items-center gap-2 mb-4">
                        {offer.buyer.image ? (
                          <img
                            src={offer.buyer.image}
                            alt={offer.buyer.nickname || offer.buyer.name || 'Käufer'}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <span className="text-sm text-gray-600">
                          {offer.buyer.nickname || offer.buyer.name || 'Unbekannter Käufer'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
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
                            - CHF {new Intl.NumberFormat('de-CH').format(offer.watch.price - offer.amount)}
                          </div>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Nachricht vom Käufer</div>
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
                            minute: '2-digit'
                          })}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(offer.id)}
                            disabled={processing === offer.id}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeConfirmModal}>
          <div 
            className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                confirmAction === 'accept' 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                {confirmAction === 'accept' ? (
                  <CheckCircle className={`h-6 w-6 ${
                    confirmAction === 'accept' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`} />
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
              <p className="text-gray-700 mb-4">
                {confirmAction === 'accept' ? (
                  <>
                    Möchten Sie diesen Preisvorschlag wirklich <strong>akzeptieren</strong>?
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      Der Käufer wird per E-Mail benachrichtigt und kann den Artikel kaufen.
                    </span>
                  </>
                ) : (
                  <>
                    Möchten Sie diesen Preisvorschlag wirklich <strong>ablehnen</strong>?
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      Der Käufer wird per E-Mail über die Ablehnung informiert.
                    </span>
                  </>
                )}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing === confirmOfferId}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg ${
                  confirmAction === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
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








