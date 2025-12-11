'use client'

import { CheckCircle2, Clock, Flame, Gavel, Heart, MapPin, Sparkles, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

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
  offerEnd?: string // Für normale Angebote
  createdAt?: string // Für Berechnung des Ablaufdatums
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
  offerEnd,
  createdAt,
  buyNowPrice,
  isAuction,
  bids,
  boosters = [],
  verified = false,
  href,
  onFavoriteToggle,
  favorites,
  className = '',
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

  // WICHTIG: Immer 2 Dezimalstellen anzeigen, damit Preise wie CHF 1.80 korrekt angezeigt werden
  const formatPrice = (price: number) => {
    return `CHF ${new Intl.NumberFormat('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)}`
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
      minute: '2-digit',
    })
  }

  // Berechne Ablaufdatum für normale Angebote (30 Tage nach Erstellung)
  const calculateOfferEnd = (): Date | null => {
    if (offerEnd) {
      return new Date(offerEnd)
    }
    if (createdAt && !isAuction) {
      const created = new Date(createdAt)
      const end = new Date(created)
      end.setDate(end.getDate() + 30) // 30 Tage Gültigkeit
      return end
    }
    return null
  }

  // Prüfe Dringlichkeit (weniger als 24 Stunden)
  const isUrgent = (endDate: Date): boolean => {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    const hoursRemaining = diff / (1000 * 60 * 60)
    return hoursRemaining > 0 && hoursRemaining <= 24
  }

  const formatOfferEnd = (endDate: Date) => {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()

    if (diff <= 0) return 'Abgelaufen'

    const hoursRemaining = diff / (1000 * 60 * 60)
    if (hoursRemaining < 24) {
      const minutesRemaining = Math.floor((diff / (1000 * 60)) % 60)
      const hours = Math.floor(hoursRemaining)
      if (hours < 1) {
        return `${Math.floor(minutesRemaining)} Min.`
      }
      return `${hours}h ${minutesRemaining}Min.`
    }

    return endDate.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
      className={`group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-[#F4F4F4] bg-white transition-all duration-300 hover:scale-[1.02] hover:border-[#137A5F]/30 hover:shadow-xl ${className} `}
    >
      {/* Image Container - 260x260px */}
      <div className="relative h-[260px] w-full flex-shrink-0 overflow-hidden bg-[#F4F4F4]">
        {imageUrl && !imageError ? (
          imageUrl.startsWith('data:') ||
          imageUrl.startsWith('blob:') ||
          imageUrl.includes('blob.vercel-storage.com') ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-sm text-[#C6C6C6]">
            <Sparkles className="mb-2 h-8 w-8 opacity-50" />
            <span>Kein Bild</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={`absolute right-3 top-3 z-10 rounded-full p-2 shadow-md transition-all ${
            isFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-[#3A3A3A] hover:bg-white hover:text-red-500'
          } `}
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Badges oben links - Booster oder Auktion */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {/* Auktion Badge - Immer sichtbar wenn Auktion (auch mit Booster) - Subtiler */}
          {isAuction && (
            <div className="flex items-center gap-1 rounded-md bg-gray-800/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
              <Gavel className="h-2.5 w-2.5" />
              <span>Auktion</span>
            </div>
          )}
          {/* Booster Badge - Unter Auktion wenn beide vorhanden */}
          {booster && (
            <div
              className={`flex items-center justify-center rounded-full p-1 shadow-md ${
                booster === 'super-boost'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                  : booster === 'turbo-boost'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-primary-600 text-white'
              } `}
            >
              {booster === 'super-boost' ? (
                <Sparkles className="h-3 w-3" />
              ) : booster === 'turbo-boost' ? (
                <Zap className="h-3 w-3" />
              ) : (
                <Flame className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Container - Wichtige Infos immer sichtbar */}
      <div className="relative flex min-h-0 flex-1 flex-col p-4">
        {/* Title - Immer sichtbar, 1 Zeile */}
        <div
          className="group/title relative mb-2 line-clamp-1 flex-shrink-0 text-[15px] font-medium leading-tight text-[#3A3A3A]"
          title={title}
        >
          {title}
        </div>

        {/* Price - Immer sichtbar */}
        <div className="mb-1.5 flex-shrink-0 text-[17px] font-bold text-[#3A3A3A]">
          {formatPrice(price)}
        </div>

        {/* Buy Now Price - IMMER sichtbar bei normalen Angeboten */}
        {!isAuction && buyNowPrice && (
          <div className="mb-2 flex-shrink-0 text-[13px] font-semibold text-primary-600">
            Sofort: {formatPrice(buyNowPrice)}
          </div>
        )}

        {/* Auktion Info - Prominent wenn Auktion */}
        {isAuction &&
          auctionEnd &&
          (() => {
            const endDate = new Date(auctionEnd)
            const urgent = isUrgent(endDate)
            return (
              <div
                className={`mb-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 ${
                  urgent ? 'border border-red-200 bg-red-50' : 'bg-orange-50'
                }`}
              >
                <Clock
                  className={`h-3.5 w-3.5 flex-shrink-0 ${urgent ? 'text-red-600' : 'text-orange-600'}`}
                />
                <span
                  className={`text-[11px] font-semibold ${urgent ? 'text-red-700' : 'text-orange-700'}`}
                >
                  {formatAuctionEnd(auctionEnd)}
                  {urgent && <span className="ml-1">⚠️</span>}
                </span>
                {bids && bids.length > 0 && (
                  <span
                    className={`ml-auto text-[11px] ${urgent ? 'text-red-600' : 'text-orange-600'}`}
                  >
                    {bids.length} {bids.length === 1 ? 'Gebot' : 'Gebote'}
                  </span>
                )}
              </div>
            )
          })()}

        {/* Angebotsende bei normalen Angeboten */}
        {!isAuction &&
          (() => {
            const offerEndDate = calculateOfferEnd()
            if (!offerEndDate) return null
            const urgent = isUrgent(offerEndDate)
            return (
              <div
                className={`mb-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 ${
                  urgent ? 'border border-red-200 bg-red-50' : 'bg-gray-50'
                }`}
              >
                <Clock
                  className={`h-3.5 w-3.5 flex-shrink-0 ${urgent ? 'text-red-600' : 'text-gray-600'}`}
                />
                <span
                  className={`text-[11px] font-semibold ${urgent ? 'text-red-700' : 'text-gray-700'}`}
                >
                  Endet: {formatOfferEnd(offerEndDate)}
                  {urgent && <span className="ml-1">⚠️</span>}
                </span>
              </div>
            )
          })()}

        {/* Location - IMMER sichtbar, sehr prominent */}
        {(city || postalCode) && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1.5 text-[12px] font-bold text-gray-800">
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary-600" />
            <span className="truncate">
              {postalCode && city ? `${postalCode} ${city}` : postalCode || city || ''}
            </span>
          </div>
        )}

        {/* Zusätzliche Details - Nur beim Hover sichtbar */}
        <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-[#C6C6C6] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {/* Brand */}
          {brand && <span className="font-medium text-[#137A5F]">{brand}</span>}

          {/* Condition Badge */}
          {condition && (
            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
              {condition}
            </span>
          )}

          {/* Verified Badge */}
          {verified && (
            <span className="flex flex-shrink-0 items-center gap-1 text-[#137A5F]">
              <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
              <span className="whitespace-nowrap text-[10px] font-medium">Verifiziert</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
