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
  const [ratings, setRatings] = useState<Record<string, 'positive' | 'neutral' | 'negative' | ''>>({})
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
                  canReview: reviewData.canReview
                }
              }
            } catch (error) {
              console.error('Error loading review for purchase:', purchase.id, error)
            }
            return {
              ...purchase,
              review: null,
              canReview: true
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
        body: JSON.stringify({ rating, comment: comment.trim() || null })
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/my-watches/buying" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Mein Kaufen
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Bewertungen</h1>

          {/* Ausstehende Bewertungen */}
          {pendingReviews.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ausstehende Bewertungen ({pendingReviews.length})
              </h2>
              <div className="space-y-4">
                {pendingReviews.map((purchase) => (
                  <div key={purchase.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{purchase.watch.title}</h3>
                        <p className="text-sm text-gray-600">Verkäufer: {purchase.watch.seller.name}</p>
                      </div>
                      {purchase.watch.images && purchase.watch.images.length > 0 && (
                        <img
                          src={purchase.watch.images[0]}
                          alt={purchase.watch.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                    </div>

                    {reviewingId === purchase.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bewertung *
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            <button
                              type="button"
                              onClick={() => setRatings(prev => ({ ...prev, [purchase.id]: 'positive' }))}
                              className={`p-4 border-2 rounded-lg transition-colors ${
                                ratings[purchase.id] === 'positive'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-green-300'
                              }`}
                            >
                              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                              <div className="font-medium text-gray-900">Positiv</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRatings(prev => ({ ...prev, [purchase.id]: 'neutral' }))}
                              className={`p-4 border-2 rounded-lg transition-colors ${
                                ratings[purchase.id] === 'neutral'
                                  ? 'border-gray-500 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Minus className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                              <div className="font-medium text-gray-900">Neutral</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRatings(prev => ({ ...prev, [purchase.id]: 'negative' }))}
                              className={`p-4 border-2 rounded-lg transition-colors ${
                                ratings[purchase.id] === 'negative'
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 hover:border-red-300'
                              }`}
                            >
                              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                              <div className="font-medium text-gray-900">Negativ</div>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kommentar (optional)
                          </label>
                          <textarea
                            value={comments[purchase.id] || ''}
                            onChange={(e) => setComments(prev => ({ ...prev, [purchase.id]: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
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
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Abbrechen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitReview(purchase.id)}
                            disabled={!ratings[purchase.id] || submitting}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? 'Wird gesendet...' : 'Bewertung absenden'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewingId(purchase.id)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Abgegebene Bewertungen ({completedReviews.length})
              </h2>
              <div className="space-y-4">
                {completedReviews.map((purchase) => (
                  <div key={purchase.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{purchase.watch.title}</h3>
                        <p className="text-sm text-gray-600">Verkäufer: {purchase.watch.seller.name}</p>
                      </div>
                      {purchase.watch.images && purchase.watch.images.length > 0 && (
                        <img
                          src={purchase.watch.images[0]}
                          alt={purchase.watch.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                    </div>

                    {purchase.review && (
                      <div className={`p-4 rounded-lg border-l-4 ${
                        purchase.review.rating === 'positive' ? 'bg-green-50 border-green-500' :
                        purchase.review.rating === 'neutral' ? 'bg-gray-50 border-gray-500' :
                        'bg-red-50 border-red-500'
                      }`}>
                        <div className="flex items-center mb-2">
                          {purchase.review.rating === 'positive' && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
                          {purchase.review.rating === 'neutral' && <Minus className="h-5 w-5 text-gray-600 mr-2" />}
                          {purchase.review.rating === 'negative' && <XCircle className="h-5 w-5 text-red-600 mr-2" />}
                          <span className="font-medium text-gray-900 capitalize">{purchase.review.rating}</span>
                        </div>
                        {purchase.review.comment && (
                          <p className="text-gray-700">{purchase.review.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
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
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Sie haben noch keine gekauften Artikel zum Bewerten.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

