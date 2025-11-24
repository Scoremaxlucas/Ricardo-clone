'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Star, CheckCircle, Package } from 'lucide-react'

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
      alert('Bitte melden Sie sich an, um Verkäufern zu folgen.')
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
        alert('Sie folgen diesem Verkäufer nicht mehr.')
      } else {
        // Folgen
        currentFollows.push(sellerId)
        localStorage.setItem('seller_follows', JSON.stringify(currentFollows))
        setIsFollowing(true)
        alert('Sie folgen jetzt diesem Verkäufer! Sie werden benachrichtigt, wenn er neue Artikel einstellt.')
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const stats = sellerData?.reviewStats || { total: 0, positivePercentage: 100, averageRating: 5 }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Verkäufer</h3>
      
      <div className="flex items-start gap-4 mb-4">
        {/* Verkäufer Avatar */}
        <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {getInitials(sellerName)}
        </div>

        <div className="flex-1">
          {/* Verkäufer Name */}
          <Link
            href={`/profile/${sellerId}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 block mb-1"
          >
            {sellerName}
          </Link>

          {/* Anzahl offener Angebote */}
          <div className="text-sm text-gray-600 mb-2">
            {sellerData?.activeListings || 0} offene Angebote
          </div>

          {/* Bewertungen */}
          <div className="flex items-center gap-3 mb-2">
            {stats.total > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-900">
                    {stats.positivePercentage}%
                  </span>
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
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
            <div className="flex items-center gap-1 text-sm text-green-600 mb-3">
              <CheckCircle className="h-4 w-4" />
              <span>Ausweis verifiziert</span>
            </div>
          )}

          {/* Folgen Button */}
          <button
            onClick={toggleFollow}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
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
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Weitere Artikel dieses Verkäufers
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {sellerData.otherItems.slice(0, 3).map((item) => {
              const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images || []
              return (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="group"
                >
                  {images[0] ? (
                    <img
                      src={images[0]}
                      alt={item.title}
                      className="w-full h-20 object-cover rounded border border-gray-200 group-hover:border-primary-400 transition-colors"
                    />
                  ) : (
                    <div className="w-full h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
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

