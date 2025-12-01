'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Minus, Star, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface Purchase {
  id: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    seller: {
      id: string
      name: string
      email: string
    }
  }
  review?: {
    id: string
    rating: 'positive' | 'neutral' | 'negative'
    comment: string | null
    createdAt: string
  } | null
  canReview: boolean
}

export default function PurchaseReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, 'positive' | 'neutral' | 'negative' | ''>>(
    {}
  )
  const [comments, setComments] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session?.user) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    loadPurchases()
  }, [session, status, router])

  const loadPurchases = async () => {
    try {
      const res = await fetch('/api/purchases/my-purchases')
      if (res.ok) {
        const data = await res.json()
        // Für jeden Purchase prüfe ob bereits eine Bewertung vorhanden ist
        const purchasesWithReviews = await Promise.all(
          (data.purchases || []).map(async (purchase: any) => {
            try {
              const reviewRes = await fetch(`/api/purchases/${purchase.id}/review`)
              if (reviewRes.ok) {
                const reviewData = await reviewRes.json()
                return {
                  ...purchase,
                  review: reviewData.review,
                  canReview: reviewData.canReview,
                }
              }
            } catch (error) {
              console.error('Error loading review for purchase:', purchase.id, error)
            }
            return {
              ...purchase,
              review: null,
              canReview: true,
            }
          })
        )
        setPurchases(purchasesWithReviews)
      }
    } catch (error) {
      console.error('Error loading purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (purchaseId: string) => {
    const rating = ratings[purchaseId]
    const comment = comments[purchaseId] || ''

    if (!rating) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      })

      if (res.ok) {
        // Reload purchases
        await loadPurchases()
        setReviewingId(null)
        setRatings(prev => {
          const newRatings = { ...prev }
          delete newRatings[purchaseId]
          return newRatings
        })
        setComments(prev => {
          const newComments = { ...prev }
          delete newComments[purchaseId]
          return newComments
        })
      } else {
        const data = await res.json()
        alert(data.message || 'Fehler beim Absenden der Bewertung')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Fehler beim Absenden der Bewertung')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const pendingReviews = purchases.filter(p => p.canReview)
  const completedReviews = purchases.filter(p => !p.canReview && p.review)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <Link
            href="/my-watches/buying"
            className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Mein Kaufen
          </Link>

          <h1 className="mb-8 text-3xl font-bold text-gray-900">Bewertungen</h1>

          {/* Ausstehende Bewertungen */}
          {pendingReviews.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Ausstehende Bewertungen ({pendingReviews.length})
              </h2>
              <div className="space-y-4">
                {pendingReviews.map(purchase => (
                  <div key={purchase.id} className="rounded-lg bg-white p-6 shadow-md">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {purchase.watch.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Verkäufer: {purchase.watch.seller.name}
                        </p>
                      </div>
                      {purchase.watch.images && purchase.watch.images.length > 0 && (
                        <img
                          src={purchase.watch.images[0]}
                          alt={purchase.watch.title}
                          className="h-20 w-20 rounded object-cover"
                        />
                      )}
                    </div>

                    {reviewingId === purchase.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Bewertung *
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                setRatings(prev => ({ ...prev, [purchase.id]: 'positive' }))
                              }
                              className={`rounded-lg border-2 p-4 transition-colors ${
                                ratings[purchase.id] === 'positive'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-green-300'
                              }`}
                            >
                              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                              <div className="font-medium text-gray-900">Positiv</div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setRatings(prev => ({ ...prev, [purchase.id]: 'neutral' }))
                              }
                              className={`rounded-lg border-2 p-4 transition-colors ${
                                ratings[purchase.id] === 'neutral'
                                  ? 'border-gray-500 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Minus className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                              <div className="font-medium text-gray-900">Neutral</div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setRatings(prev => ({ ...prev, [purchase.id]: 'negative' }))
                              }
                              className={`rounded-lg border-2 p-4 transition-colors ${
                                ratings[purchase.id] === 'negative'
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 hover:border-red-300'
                              }`}
                            >
                              <XCircle className="mx-auto mb-2 h-8 w-8 text-red-600" />
                              <div className="font-medium text-gray-900">Negativ</div>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Kommentar (optional)
                          </label>
                          <textarea
                            value={comments[purchase.id] || ''}
                            onChange={e =>
                              setComments(prev => ({ ...prev, [purchase.id]: e.target.value }))
                            }
                            rows={4}
                            className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Teilen Sie Ihre Erfahrung mit diesem Verkäufer..."
                            disabled={submitting}
                          />
                        </div>

                        <div className="flex justify-end space-x-4">
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingId(null)
                              setRatings(prev => {
                                const newRatings = { ...prev }
                                delete newRatings[purchase.id]
                                return newRatings
                              })
                              setComments(prev => {
                                const newComments = { ...prev }
                                delete newComments[purchase.id]
                                return newComments
                              })
                            }}
                            disabled={submitting}
                            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Abbrechen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitReview(purchase.id)}
                            disabled={!ratings[purchase.id] || submitting}
                            className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {submitting ? 'Wird gesendet...' : 'Bewertung absenden'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewingId(purchase.id)}
                        className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                      >
                        Bewertung abgeben
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abgegebene Bewertungen */}
          {completedReviews.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Abgegebene Bewertungen ({completedReviews.length})
              </h2>
              <div className="space-y-4">
                {completedReviews.map(purchase => (
                  <div key={purchase.id} className="rounded-lg bg-white p-6 shadow-md">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {purchase.watch.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Verkäufer: {purchase.watch.seller.name}
                        </p>
                      </div>
                      {purchase.watch.images && purchase.watch.images.length > 0 && (
                        <img
                          src={purchase.watch.images[0]}
                          alt={purchase.watch.title}
                          className="h-20 w-20 rounded object-cover"
                        />
                      )}
                    </div>

                    {purchase.review && (
                      <div
                        className={`rounded-lg border-l-4 p-4 ${
                          purchase.review.rating === 'positive'
                            ? 'border-green-500 bg-green-50'
                            : purchase.review.rating === 'neutral'
                              ? 'border-gray-500 bg-gray-50'
                              : 'border-red-500 bg-red-50'
                        }`}
                      >
                        <div className="mb-2 flex items-center">
                          {purchase.review.rating === 'positive' && (
                            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                          )}
                          {purchase.review.rating === 'neutral' && (
                            <Minus className="mr-2 h-5 w-5 text-gray-600" />
                          )}
                          {purchase.review.rating === 'negative' && (
                            <XCircle className="mr-2 h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium capitalize text-gray-900">
                            {purchase.review.rating}
                          </span>
                        </div>
                        {purchase.review.comment && (
                          <p className="text-gray-700">{purchase.review.comment}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(purchase.review.createdAt).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingReviews.length === 0 && completedReviews.length === 0 && (
            <div className="rounded-lg bg-white py-12 text-center shadow-md">
              <Star className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Sie haben noch keine gekauften Artikel zum Bewerten.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
