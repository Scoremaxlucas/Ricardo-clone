'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Tag, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface PriceOffer {
  id: string
  amount: number
  message: string | null
  status: string
  createdAt: string
  expiresAt: string | null
  watch: {
    id: string
    title: string
    price: number
    images: string
    seller: {
      id: string
      name: string | null
      nickname: string | null
      image: string | null
    }
  }
}

export default function OffersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offers, setOffers] = useState<PriceOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchOffers()
    }
  }, [status, session, router])

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers?type=sent')
      const data = await response.json()
      if (data.offers) {
        setOffers(data.offers)
        
        // Markiere alle Preisvorschläge als gelesen
        const readOffers = JSON.parse(localStorage.getItem('readOffers') || '[]')
        const newReadOffers = [...new Set([...readOffers, ...data.offers.map((o: PriceOffer) => o.id)])]
        localStorage.setItem('readOffers', JSON.stringify(newReadOffers))
        
        // Trigger event für Badge-Update
        window.dispatchEvent(new CustomEvent('offers-viewed'))
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Wenn nicht authentifiziert, zeige Loading (Redirect wird in useEffect behandelt)
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Weiterleitung zur Anmeldung...</div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'expired':
        return <Clock className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-blue-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Akzeptiert'
      case 'rejected':
        return 'Abgelehnt'
      case 'expired':
        return 'Abgelaufen'
      default:
        return 'Ausstehend'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'expired':
        return 'bg-gray-50 border-gray-200 text-gray-600'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
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
          href="/my-watches/buying"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Mein Kaufen
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <Tag className="h-8 w-8 mr-3 text-primary-600" />
          Meine Preisvorschläge
        </h1>

        {offers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Preisvorschläge
              </h3>
              <p className="text-gray-600 mb-6">
                Sie haben noch keine Preisvorschläge abgegeben.
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Angebote durchstöbern
              </Link>
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

                      <div className="flex items-center gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Verkaufspreis</div>
                          <div className="text-lg font-semibold text-gray-900">
                            CHF {new Intl.NumberFormat('de-CH').format(offer.watch.price)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Ihr Preisvorschlag</div>
                          <div className="text-lg font-bold text-primary-600">
                            CHF {new Intl.NumberFormat('de-CH').format(offer.amount)}
                          </div>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Ihre Nachricht</div>
                          <div className="text-sm text-gray-900">{offer.message}</div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(offer.status)}`}
                        >
                          {getStatusIcon(offer.status)}
                          <span className="text-sm font-medium">
                            {getStatusText(offer.status)}
                          </span>
                        </div>

                        <div className="text-sm text-gray-500">
                          {new Date(offer.createdAt).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {offer.status === 'accepted' && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            Der Verkäufer hat Ihren Preisvorschlag akzeptiert! Sie können jetzt den Kauf abschließen.
                          </p>
                          <Link
                            href={`/products/${offer.watch.id}`}
                            className="mt-2 inline-block text-sm font-semibold text-green-700 hover:text-green-800"
                          >
                            Zum Angebot →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
