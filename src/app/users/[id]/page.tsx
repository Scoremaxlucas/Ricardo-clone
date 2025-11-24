'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CheckCircle, XCircle, Minus, User, MapPin, Calendar } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useLanguage } from '@/contexts/LanguageContext'

interface UserStats {
  user: {
    id: string
    name: string | null
    nickname: string | null
    image: string | null
    city: string | null
    postalCode: string | null
    createdAt: string
  }
  verified: boolean
  phoneVerified: boolean
  stats: {
    totalPurchases: number
    totalSales: number
    totalReviews: number
    positiveReviews: number
    neutralReviews: number
    negativeReviews: number
    positivePercentage: number | null
    recentPositive: number
    recentNeutral: number
    recentNegative: number
  }
  activeWatches: Array<{
    id: string
    title: string
    price: number
    buyNowPrice: number | null
    isAuction: boolean
    auctionEnd: string | null
    images: string[]
    createdAt: string
    categories: string[]
  }>
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
    watchId: string | null
    watchTitle: string | null
  }>
}

type TabType = 'offers' | 'reviews'

export default function PublicProfilePage() {
  const params = useParams()
  const { t } = useLanguage()
  const { data: session } = useSession()
  const userId = params.id as string
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('offers')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      loadUserStats()
      if (session?.user?.id) {
        checkFollowStatus()
      }
    }
  }, [userId, session])

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

  const checkFollowStatus = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/follow`)
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!session?.user?.id) {
      return
    }
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Wenn das Jahr in der Zukunft ist oder größer als das aktuelle Jahr, zeige nur das Jahr
    if (year > now.getFullYear()) {
      return year.toString()
    }
    
    // Wenn es das aktuelle Jahr ist, zeige Monat und Jahr
    if (year === now.getFullYear()) {
      const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ]
      return `${monthNames[month]} ${year}`
    }
    
    // Wenn es ein früheres Jahr ist, zeige nur das Jahr (wie Ricardo bei älteren Accounts)
    return year.toString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.common.loading}</p>
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
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-gray-600">{t.product.notFound}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const { user, verified, phoneVerified, stats: userStats, activeWatches, recentReviews } = stats
  const isOwnProfile = session?.user?.id === userId

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Profil-Header im Helvenda-Stil */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Profilbild */}
              <div className="relative flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.nickname || user.name || 'User'}
                    className="w-32 h-32 rounded-2xl object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-primary-600 flex items-center justify-center border-2 border-primary-100">
                    <span className="text-4xl font-bold text-white">
                      {(user.nickname || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profil-Info */}
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {user.nickname || user.name || t.common.unknown}
                </h1>

                    {/* Verifizierungsstatus */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                  {verified && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          <span>Verifiziert</span>
                    </div>
                  )}
                  {phoneVerified && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          <span>Handy verifiziert</span>
                    </div>
                  )}
                </div>

                {/* Standort und Mitglied seit */}
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                  {(user.city || user.postalCode) && (
                        <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {[user.postalCode, user.city].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  )}
                      <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Mitglied seit {formatMemberSince(user.createdAt)}</span>
                      </div>
                  </div>
                </div>

                  {/* FOLGEN Button - Helvenda Primary */}
                {!isOwnProfile && session?.user?.id && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                      isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow'
                    }`}
                  >
                      {followLoading ? '...' : isFollowing ? '✓ Gefolgt' : 'Folgen'}
                  </button>
                )}
                </div>

                {/* Stats Grid - Moderner Helvenda-Stil */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {userStats.totalSales}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Verkauft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {userStats.totalPurchases}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Gekauft</div>
                  </div>
                  <div className="text-center">
                    {userStats.positivePercentage !== null ? (
                      <>
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {userStats.positivePercentage}%
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Positiv</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-400 mb-1">—</div>
                        <div className="text-xs text-gray-600 font-medium">Bewertungen</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Helvenda-Stil */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('offers')}
                className={`px-6 py-4 font-semibold text-sm transition-all relative ${
                  activeTab === 'offers'
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Alle Angebote
                {activeTab === 'offers' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 font-semibold text-sm transition-all relative ${
                  activeTab === 'reviews'
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bewertungen
                {activeTab === 'reviews' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'offers' && (
                <div>
                  {activeWatches.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg mb-2">Keine aktiven Angebote</p>
                      <p className="text-sm">Dieser Verkäufer hat derzeit keine Artikel zum Verkauf.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Alle Angebote ({activeWatches.length})
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {activeWatches.map((watch) => (
                          <Link
                            key={watch.id}
                            href={`/watches/${watch.id}`}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all hover:border-primary-300 group"
                          >
                            <div className="relative h-48 bg-gray-100 overflow-hidden">
                              {watch.images && watch.images.length > 0 ? (
                                <img
                                  src={watch.images[0]}
                                  alt={watch.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                  <User className="h-12 w-12" />
                                </div>
                              )}
                              {watch.isAuction && (
                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm">
                                  Auktion
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm group-hover:text-primary-600 transition-colors">
                                {watch.title}
                              </h3>
                              <div className="flex flex-col gap-1">
                                <div className="text-lg font-bold text-primary-600">
                                  {formatPrice(watch.price)}
                                </div>
                                {watch.buyNowPrice && watch.buyNowPrice !== watch.price && (
                                  <div className="text-xs text-gray-500">
                                    Sofort: {formatPrice(watch.buyNowPrice)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {/* Bewertungen der letzten 12 Monate - Helvenda-Stil */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Bewertungen der letzten 12 Monate
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {userStats.recentPositive}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">Positiv</div>
                        <div className="text-xs text-gray-500">
                          {userStats.positiveReviews} insgesamt
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-4xl font-bold text-gray-600 mb-2">
                          {userStats.recentNeutral}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">Neutral</div>
                        <div className="text-xs text-gray-500">
                          {userStats.neutralReviews} insgesamt
                        </div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="text-4xl font-bold text-red-600 mb-2">
                          {userStats.recentNegative}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">Negativ</div>
                        <div className="text-xs text-gray-500">
                          {userStats.negativeReviews} insgesamt
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Einzelne Bewertungen - genau wie bei Ricardo */}
                  <div>
                    {recentReviews.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>Noch keine Bewertungen</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentReviews.map((review) => (
                          <div
                            key={review.id}
                            className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {review.reviewer.image ? (
                                  <img
                                    src={review.reviewer.image}
                                    alt={review.reviewer.nickname || review.reviewer.name || 'User'}
                                    className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center border border-primary-200">
                                    <User className="h-6 w-6 text-primary-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900 mb-1">
                                    {review.reviewer.nickname || review.reviewer.name || t.common.unknown}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {review.rating === 'positive' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                                        <CheckCircle className="h-3 w-3" />
                                        Positiv
                                      </span>
                                    )}
                                    {review.rating === 'neutral' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-700 rounded-md text-xs font-medium">
                                        <Minus className="h-3 w-3" />
                                        Neutral
                                      </span>
                                    )}
                                    {review.rating === 'negative' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-md text-xs font-medium">
                                        <XCircle className="h-3 w-3" />
                                        Negativ
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">
                                      {review.watchTitle ? 'Käufer' : 'Verkäufer'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('de-CH', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-gray-700 mb-2 ml-[60px] text-sm leading-relaxed">{review.comment}</p>
                            )}
                            {review.watchId && review.watchTitle && (
                              <div className="mt-2 ml-[60px]">
                                <Link
                                  href={`/watches/${review.watchId}`}
                                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                  Art.-Nr. {review.watchId.slice(-10)} →
                                </Link>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
