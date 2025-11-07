'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, Minus, User, ShoppingBag, TrendingUp, Star } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface UserStats {
  user: {
    id: string
    name: string | null
    nickname: string | null
    image: string | null
  }
  stats: {
    totalPurchases: number
    totalSales: number
    totalReviews: number
    positiveReviews: number
    neutralReviews: number
    negativeReviews: number
    positivePercentage: number | null
  }
  recentReviews: Array<{
    id: string
    rating: 'positive' | 'neutral' | 'negative'
    comment: string | null
    createdAt: string
    reviewer: {
      id: string
      name: string | null
      nickname: string | null
      image: string | null
    }
  }>
}

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadUserStats()
    }
  }, [userId])

  const loadUserStats = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/stats`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!stats) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-gray-600">Profil nicht gefunden</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const { user, stats: userStats, recentReviews } = stats

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profil-Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.nickname || user.name || 'User'}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.nickname || user.name || 'Unbekannter Benutzer'}
                </h1>
                {user.nickname && user.name && (
                  <p className="text-gray-600">{user.name}</p>
                )}
                {userStats.positivePercentage !== null && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="text-3xl font-bold text-primary-600">
                      {userStats.positivePercentage}%
                    </div>
                    <div className="text-sm text-gray-600">
                      positive Bewertungen
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalPurchases}</div>
                  <div className="text-sm text-gray-600">Käufe</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalSales}</div>
                  <div className="text-sm text-gray-600">Verkäufe</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalReviews}</div>
                  <div className="text-sm text-gray-600">Bewertungen</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bewertungsübersicht */}
          {userStats.totalReviews > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bewertungsübersicht</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{userStats.positiveReviews}</div>
                  <div className="text-sm text-gray-600 mt-1">Positive</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600">{userStats.neutralReviews}</div>
                  <div className="text-sm text-gray-600 mt-1">Neutrale</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{userStats.negativeReviews}</div>
                  <div className="text-sm text-gray-600 mt-1">Negative</div>
                </div>
              </div>
            </div>
          )}

          {/* Letzte Bewertungen */}
          {recentReviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Letzte Bewertungen</h2>
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      review.rating === 'positive' ? 'bg-green-50 border-green-500' :
                      review.rating === 'neutral' ? 'bg-gray-50 border-gray-500' :
                      'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {review.reviewer.image ? (
                          <img
                            src={review.reviewer.image}
                            alt={review.reviewer.nickname || review.reviewer.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {review.reviewer.nickname || review.reviewer.name || 'Unbekannter Benutzer'}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {review.rating === 'positive' && (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">Positiv</span>
                              </>
                            )}
                            {review.rating === 'neutral' && (
                              <>
                                <Minus className="h-4 w-4 text-gray-600" />
                                <span className="text-sm text-gray-600">Neutral</span>
                              </>
                            )}
                            {review.rating === 'negative' && (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-red-600">Negativ</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('de-CH')}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mt-2">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentReviews.length === 0 && userStats.totalReviews === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Noch keine Bewertungen vorhanden</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

