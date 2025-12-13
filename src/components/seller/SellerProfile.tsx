'use client'

import { UserBadges } from '@/components/ui/UserBadges'
import { CheckCircle, CheckCircle2, Package, Star } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface SellerProfileProps {
  sellerId: string
  sellerName: string
  sellerEmail: string
}

interface SellerData {
  name: string
  verified: boolean
  activeListings: number
  reviewStats: {
    total: number
    averageRating: number
    positivePercentage: number
  }
  otherItems: Array<{
    id: string
    title: string
    price: number
    images: string[]
  }>
}

export function SellerProfile({ sellerId, sellerName, sellerEmail }: SellerProfileProps) {
  const { data: session } = useSession()
  const [sellerData, setSellerData] = useState<SellerData | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        // Lade Verkäufer-Statistiken
        const res = await fetch(`/api/users/${sellerId}/stats`)
        if (res.ok) {
          const data = await res.json()
          setSellerData(data)
        }
      } catch (error) {
        console.error('Error fetching seller data:', error)
      } finally {
        setLoading(false)
      }
    }

    const checkFollowStatus = () => {
      if (!session?.user) return

      try {
        const currentFollows = JSON.parse(localStorage.getItem('seller_follows') || '[]')
        setIsFollowing(currentFollows.includes(sellerId))
      } catch (error) {
        console.error('Error checking follow status:', error)
      }
    }

    fetchSellerData()
    checkFollowStatus()
  }, [sellerId, session?.user])

  const toggleFollow = async () => {
    if (!session?.user) {
      toast.error('Bitte melden Sie sich an, um Verkäufern zu folgen.', {
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
      return
    }

    // Vorerst lokale Speicherung (kann später mit DB erweitert werden)
    try {
      const followKey = `follow_${sellerId}`
      const currentFollows = JSON.parse(localStorage.getItem('seller_follows') || '[]')

      if (isFollowing) {
        // Entfolgen
        const newFollows = currentFollows.filter((id: string) => id !== sellerId)
        localStorage.setItem('seller_follows', JSON.stringify(newFollows))
        setIsFollowing(false)
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
      } else {
        // Folgen
        currentFollows.push(sellerId)
        localStorage.setItem('seller_follows', JSON.stringify(currentFollows))
        setIsFollowing(true)
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
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
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
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/3 rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  const stats = sellerData?.reviewStats || { total: 0, positivePercentage: 100, averageRating: 5 }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Verkäufer</h3>

      <div className="mb-4 flex items-start gap-4">
        {/* Verkäufer Avatar */}
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
          {getInitials(sellerName)}
        </div>

        <div className="flex-1">
          {/* Verkäufer Name */}
          <div className="mb-1 flex items-center gap-2">
            <Link
              href={`/users/${sellerId}`}
              className="text-lg font-semibold text-gray-900 hover:text-primary-600"
            >
              {sellerName}
            </Link>
            <UserBadges userId={sellerId} limit={2} size="sm" />
          </div>

          {/* Anzahl offener Angebote */}
          <div className="mb-2 text-sm text-gray-600">
            {sellerData?.activeListings || 0} offene Angebote
          </div>

          {/* Bewertungen */}
          <div className="mb-2 flex items-center gap-3">
            {stats.total > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-900">
                    {stats.positivePercentage}%
                  </span>
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                </div>
                <div className="text-sm text-gray-600">
                  {stats.total} Bewertung{stats.total !== 1 ? 'en' : ''}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Noch keine Bewertungen</div>
            )}
          </div>

          {/* Verifizierungsstatus */}
          {sellerData?.verified && (
            <div className="mb-3 flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Ausweis verifiziert</span>
            </div>
          )}

          {/* Folgen Button */}
          <button
            onClick={toggleFollow}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isFollowing ? 'Wird gefolgt' : 'FOLGEN'}
          </button>
        </div>
      </div>

      {/* Andere Artikel des Verkäufers */}
      {sellerData?.otherItems && sellerData.otherItems.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            Weitere Artikel dieses Verkäufers
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {sellerData.otherItems.slice(0, 3).map(item => {
              const images =
                typeof item.images === 'string' ? JSON.parse(item.images) : item.images || []
              return (
                <Link key={item.id} href={`/products/${item.id}`} className="group">
                  {images[0] ? (
                    <img
                      src={images[0]}
                      alt={item.title}
                      className="h-20 w-full rounded border border-gray-200 object-cover transition-colors group-hover:border-primary-400"
                    />
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center rounded border border-gray-200 bg-gray-100">
                      <Package className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
