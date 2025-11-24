'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Clock, CheckCircle2, Sparkles, Zap, Flame } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ModernProductCardProps {
  id: string
  title: string
  brand?: string
  price: number
  images: string[]
  condition?: string
  city?: string
  postalCode?: string
  auctionEnd?: string
  buyNowPrice?: number
  isAuction?: boolean
  bids?: any[]
  boosters?: string[]
  verified?: boolean
  href?: string
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void
  favorites?: Set<string>
  className?: string
}

export function ModernProductCard({
  id,
  title,
  brand,
  price,
  images,
  condition,
  city,
  postalCode,
  auctionEnd,
  buyNowPrice,
  isAuction,
  bids,
  boosters = [],
  verified = false,
  href,
  onFavoriteToggle,
  favorites,
  className = ''
}: ModernProductCardProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(favorites?.has(id) || false)
  const [imageError, setImageError] = useState(false)

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session?.user) return

    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)

    if (onFavoriteToggle) {
      onFavoriteToggle(id, newFavoriteState)
    } else {
      try {
        const method = isFavorite ? 'DELETE' : 'POST'
        await fetch(`/api/favorites/${id}`, { method })
      } catch (error) {
        console.error('Error toggling favorite:', error)
        setIsFavorite(!newFavoriteState)
      }
    }
  }

  const formatPrice = (price: number) => {
    return `CHF ${new Intl.NumberFormat('de-CH').format(price)}`
  }

  const formatAuctionEnd = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Beendet'
    
    return end.toLocaleString('de-CH', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getHighestBooster = () => {
    if (boosters.includes('super-boost')) return 'super-boost'
    if (boosters.includes('turbo-boost')) return 'turbo-boost'
    if (boosters.includes('boost')) return 'boost'
    return null
  }

  const booster = getHighestBooster()
  const productHref = href || `/products/${id}`
  const hasImage = images && images.length > 0 && !imageError
  const imageUrl = hasImage ? images[0] : null

  return (
    <Link
      href={productHref}
      className={`
        bg-white rounded-[16px] border border-[#F4F4F4] overflow-hidden
        hover:shadow-lg transition-all duration-200
        hover:scale-[1.03]
        ${className}
      `}
    >
      {/* Image Container - 260x260px */}
      <div className="relative w-full h-[260px] bg-[#F4F4F4] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C6C6C6] text-sm">
            Kein Bild
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={`
            absolute top-3 right-3 rounded-full p-2 shadow-md transition-all z-10
            ${isFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-[#3A3A3A] hover:bg-white hover:text-red-500'
            }
          `}
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Booster Badge */}
        {booster && (
          <div className={`
            absolute top-3 left-3 p-1 rounded-full shadow-md z-10 flex items-center justify-center
            ${booster === 'super-boost'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              : booster === 'turbo-boost'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-primary-600 text-white'
            }
          `}>
            {booster === 'super-boost' ? (
              <Sparkles className="h-3 w-3" />
            ) : booster === 'turbo-boost' ? (
              <Zap className="h-3 w-3" />
            ) : (
              <Flame className="h-3 w-3" />
            )}
          </div>
        )}

        {/* Auction Badge */}
        {!booster && isAuction && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-[10px] font-medium shadow-md z-10">
            Auktion
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4">
        {/* Brand */}
        {brand && (
          <div className="text-[13px] font-medium text-[#137A5F] mb-1 truncate">
            {brand}
          </div>
        )}

        {/* Title - 15px */}
        <div className="text-[15px] font-medium text-[#3A3A3A] line-clamp-2 mb-2 min-h-[44px] leading-tight">
          {title}
        </div>

        {/* Price - 17px Bold */}
        <div className="text-[17px] font-bold text-[#3A3A3A] mb-2">
          {formatPrice(price)}
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-2 text-[13px] text-[#C6C6C6]">
          {/* Location */}
          {(city || postalCode) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {city && postalCode 
                ? `${city} ${postalCode}`
                : city || postalCode}
            </span>
          )}

          {/* Verified Badge */}
          {verified && (
            <span className="flex items-center gap-1 text-[#137A5F]">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[11px] font-medium">Verifiziert</span>
            </span>
          )}

          {/* Auction End */}
          {isAuction && auctionEnd && (
            <span className="flex items-center gap-1 text-orange-600">
              <Clock className="h-3 w-3" />
              <span className="text-[11px]">{formatAuctionEnd(auctionEnd)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

