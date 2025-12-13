'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ProductCard } from '@/components/ui/ProductCard'
import { ReportUserModal } from '@/components/user/ReportUserModal'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Calendar,
  CheckCircle,
  CheckCircle2,
  Filter,
  Flag,
  MapPin,
  Minus,
  User,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface UserStats {
  user: {
    id: string
    name: string | null
    nickname: string | null
    image: string | null
    city: string | null
    postalCode: string | null
    createdAt: string
    bio: string | null
    specialization: string | null
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
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'ending'>('newest')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    if (userId) {
      loadUserStats()
      if ((session?.user as { id?: string })?.id) {
        checkFollowStatus()
        loadFavorites()
      }
    }
  }, [userId, session])

  const loadFavorites = async () => {
    if (!(session?.user as { id?: string })?.id) return
    try {
      const res = await fetch('/api/favorites')
      if (res.ok) {
        const data = await res.json()
        setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

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
    if (!(session?.user as { id?: string })?.id) {
      return
    }
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        const wasFollowing = isFollowing
        setIsFollowing(data.isFollowing)

        // Zeige Toast-Benachrichtigung im Helvenda-Stil
        if (data.isFollowing && !wasFollowing) {
          toast.success(
            'Sie folgen jetzt diesem Verkäufer! Sie werden benachrichtigt, wenn er neue Artikel einstellt.',
            {
              position: 'top-right',
              duration: 5000,
              style: {
                background: '#fff',
                color: '#374151',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '14px',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                maxWidth: '400px',
              },
              icon: (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                  <CheckCircle2 className="h-5 w-5 text-primary-600" />
                </div>
              ),
            }
          )
        } else if (!data.isFollowing && wasFollowing) {
          toast.success('Sie folgen diesem Verkäufer nicht mehr.', {
            position: 'top-right',
            duration: 3000,
            style: {
              background: '#fff',
              color: '#374151',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
            },
            icon: <CheckCircle2 className="h-5 w-5 text-gray-600" />,
          })
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
      toast.error('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
        },
      })
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
        'Januar',
        'Februar',
        'März',
        'April',
        'Mai',
        'Juni',
        'Juli',
        'August',
        'September',
        'Oktober',
        'November',
        'Dezember',
      ]
      return `${monthNames[month]} ${year}`
    }

    // Wenn es ein früheres Jahr ist, zeige nur das Jahr
    return year.toString()
  }

  // WICHTIG: Immer 2 Dezimalstellen anzeigen, damit Preise wie CHF 1.80 korrekt angezeigt werden
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
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
          <div className="mx-auto max-w-6xl px-4">
            <div className="py-12 text-center">
              <p className="text-gray-600">{t.product.notFound}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const { user, verified, phoneVerified, stats: userStats, activeWatches, recentReviews } = stats
  const isOwnProfile = (session?.user as { id?: string })?.id === userId

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          {/* Profil-Header im Helvenda-Stil */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-start gap-6 md:flex-row">
              {/* Profilbild */}
              <div className="relative flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.nickname || user.name || 'User'}
                    className="h-32 w-32 rounded-2xl border-2 border-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-primary-100 bg-primary-600">
                    <span className="text-4xl font-bold text-white">
                      {(user.nickname || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profil-Info */}
              <div className="w-full flex-1">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="mb-3 text-3xl font-bold text-gray-900">
                      {user.nickname || user.name || t.common.unknown}
                    </h1>

                    {/* Verifizierungsstatus */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      {verified && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span>Verifiziert</span>
                        </div>
                      )}
                      {phoneVerified && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                          <CheckCircle className="h-4 w-4" />
                          <span>Handy verifiziert</span>
                        </div>
                      )}
                    </div>

                    {/* Standort und Mitglied seit */}
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-gray-600">
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
                        <span className="text-sm">
                          Mitglied seit {formatMemberSince(user.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Bio/Profilbeschreibung */}
                    {user.bio && (
                      <div className="mb-4 rounded-lg bg-gray-50 p-4">
                        <p className="text-sm leading-relaxed text-gray-700">{user.bio}</p>
                      </div>
                    )}

                    {/* Spezialisierung */}
                    {user.specialization && (
                      <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                          {user.specialization}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* FOLGEN Button - Helvenda Primary */}
                  {!isOwnProfile && (session?.user as { id?: string })?.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                          isFollowing
                            ? 'border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow'
                        }`}
                      >
                        {followLoading ? '...' : isFollowing ? '✓ Gefolgt' : 'Folgen'}
                      </button>
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                        title="User melden"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Melden</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats Grid - Moderner Helvenda-Stil */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="mb-1 text-2xl font-bold text-primary-600">
                      {activeWatches.length}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Aktive Angebote</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 text-2xl font-bold text-primary-600">
                      {userStats.totalSales}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Verkauft</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 text-2xl font-bold text-primary-600">
                      {userStats.totalPurchases}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Gekauft</div>
                  </div>
                  <div className="text-center">
                    {userStats.positivePercentage !== null ? (
                      <>
                        <div className="mb-1 text-2xl font-bold text-green-600">
                          {userStats.positivePercentage}%
                        </div>
                        <div className="text-xs font-medium text-gray-600">Positiv</div>
                        {userStats.totalReviews > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            ({userStats.totalReviews} Bewertungen)
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="mb-1 text-2xl font-bold text-gray-400">—</div>
                        <div className="text-xs font-medium text-gray-600">Bewertungen</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Helvenda-Stil */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('offers')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'offers' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Alle Angebote
                {activeTab === 'offers' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`relative px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'reviews' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bewertungen
                {activeTab === 'reviews' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary-600" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'offers' && (
                <div>
                  {activeWatches.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <p className="mb-2 text-lg">Keine aktiven Angebote</p>
                      <p className="text-sm">
                        Dieser Verkäufer hat derzeit keine Artikel zum Verkauf.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Alle Angebote ({activeWatches.length})
                        </h2>

                        {/* Sortierung */}
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-400" />
                          <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="newest">Neueste zuerst</option>
                            <option value="price-low">Preis: niedrig → hoch</option>
                            <option value="price-high">Preis: hoch → niedrig</option>
                            <option value="ending">Endet bald</option>
                          </select>
                        </div>
                      </div>

                      {/* Angebote mit ProductCard für Konsistenz */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5">
                        {activeWatches
                          .sort((a, b) => {
                            if (sortBy === 'newest') {
                              return (
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                              )
                            } else if (sortBy === 'price-low') {
                              return a.price - b.price
                            } else if (sortBy === 'price-high') {
                              return b.price - a.price
                            } else if (sortBy === 'ending') {
                              if (!a.auctionEnd) return 1
                              if (!b.auctionEnd) return -1
                              return (
                                new Date(a.auctionEnd).getTime() - new Date(b.auctionEnd).getTime()
                              )
                            }
                            return 0
                          })
                          .map(watch => (
                            <ProductCard
                              key={watch.id}
                              id={watch.id}
                              title={watch.title}
                              brand=""
                              price={watch.price}
                              images={watch.images}
                              city={user.city || undefined}
                              postalCode={user.postalCode || undefined}
                              auctionEnd={watch.auctionEnd || undefined}
                              buyNowPrice={watch.buyNowPrice || undefined}
                              isAuction={watch.isAuction}
                              boosters={[]}
                              bids={[]}
                              favorites={favorites}
                              onFavoriteToggle={(id, isFavorite) => {
                                setFavorites(prev => {
                                  const newSet = new Set(prev)
                                  if (isFavorite) {
                                    newSet.add(id)
                                  } else {
                                    newSet.delete(id)
                                  }
                                  return newSet
                                })
                              }}
                            />
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
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">
                      Bewertungen der letzten 12 Monate
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
                        <div className="mb-2 text-4xl font-bold text-green-600">
                          {userStats.recentPositive}
                        </div>
                        <div className="mb-1 text-sm font-semibold text-gray-900">Positiv</div>
                        <div className="text-xs text-gray-500">
                          {userStats.positiveReviews} insgesamt
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                        <div className="mb-2 text-4xl font-bold text-gray-600">
                          {userStats.recentNeutral}
                        </div>
                        <div className="mb-1 text-sm font-semibold text-gray-900">Neutral</div>
                        <div className="text-xs text-gray-500">
                          {userStats.neutralReviews} insgesamt
                        </div>
                      </div>
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
                        <div className="mb-2 text-4xl font-bold text-red-600">
                          {userStats.recentNegative}
                        </div>
                        <div className="mb-1 text-sm font-semibold text-gray-900">Negativ</div>
                        <div className="text-xs text-gray-500">
                          {userStats.negativeReviews} insgesamt
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Einzelne Bewertungen */}
                  <div>
                    {recentReviews.length === 0 ? (
                      <div className="py-12 text-center text-gray-500">
                        <p>Noch keine Bewertungen</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentReviews.map(review => (
                          <div
                            key={review.id}
                            className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {review.reviewer.image ? (
                                  <img
                                    src={review.reviewer.image}
                                    alt={review.reviewer.nickname || review.reviewer.name || 'User'}
                                    className="h-12 w-12 rounded-xl border border-gray-100 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-200 bg-primary-100">
                                    <User className="h-6 w-6 text-primary-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="mb-1 font-semibold text-gray-900">
                                    {review.reviewer.nickname ||
                                      review.reviewer.name ||
                                      t.common.unknown}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {review.rating === 'positive' && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                        <CheckCircle className="h-3 w-3" />
                                        Positiv
                                      </span>
                                    )}
                                    {review.rating === 'neutral' && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                                        <Minus className="h-3 w-3" />
                                        Neutral
                                      </span>
                                    )}
                                    {review.rating === 'negative' && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
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
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="mb-2 ml-[60px] text-sm leading-relaxed text-gray-700">
                                {review.comment}
                              </p>
                            )}
                            {review.watchId && review.watchTitle && (
                              <div className="ml-[60px] mt-2">
                                <Link
                                  href={`/watches/${review.watchId}`}
                                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
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

      {/* Report User Modal */}
      {showReportModal && (
        <ReportUserModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          userId={userId}
          userName={user.nickname || user.name}
        />
      )}
    </>
  )
}
