'use client'

import { Heart, MapPin, Package, Clock, Shield, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatCHF, formatTimeLeft, getListingBadges, getDeliveryLabel, type ListingData } from '@/lib/product-utils'

export interface ProductCardData extends ListingData {
  images: string[] | string
  city?: string
  postalCode?: string
  href?: string
  brand?: string
  model?: string
  boosters?: string[]
}

interface ProductCardProps {
  product: ProductCardData
  variant?: 'default' | 'compact' | 'list'
  showCondition?: boolean
  showBuyNowButton?: boolean
  onFavoriteToggle?: (productId: string, isFavorite: boolean) => void
  className?: string
}

export function ProductCard({
  product,
  variant = 'default',
  showCondition = false,
  showBuyNowButton = false,
  onFavoriteToggle,
  className = '',
}: ProductCardProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)

  // Parse images
  const images =
    typeof product.images === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(product.images)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return product.images.split(',').filter(Boolean)
          }
        })()
      : Array.isArray(product.images)
        ? product.images
        : []

  const mainImage = images.length > 0 ? images[0] : null

  // Check if product is favorite on mount
  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const checkFavorite = async () => {
      if (!session?.user) {
        if (isMounted) setIsFavorite(false)
        return
      }

      try {
        const res = await fetch('/api/favorites', {
          signal: abortController.signal,
        })
        if (res.ok && isMounted) {
          const data = await res.json()
          const favoriteIds = (data.favorites || []).map((f: any) => f.watchId || f.watch?.id)
          if (isMounted) {
            setIsFavorite(favoriteIds.includes(product.id))
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Error checking favorite:', error)
        }
      }
    }
    checkFavorite()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [product.id, session?.user])

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      const currentUrl =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
      return
    }

    if (isLoadingFavorite) return

    setIsLoadingFavorite(true)
    const newFavoriteState = !isFavorite

    setIsFavorite(newFavoriteState)
    onFavoriteToggle?.(product.id, newFavoriteState)

    try {
      if (isFavorite) {
        const response = await fetch(`/api/favorites/${product.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          setIsFavorite(!newFavoriteState)
          onFavoriteToggle?.(product.id, !newFavoriteState)
          toast.error('Fehler beim Entfernen aus Favoriten')
        } else {
          toast.success('Aus Favoriten entfernt', { icon: '❤️' })
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchId: product.id }),
        })

        if (!response.ok) {
          setIsFavorite(!newFavoriteState)
          onFavoriteToggle?.(product.id, !newFavoriteState)
          toast.error('Fehler beim Hinzufügen zu Favoriten')
        } else {
          toast.success('Zu Favoriten hinzugefügt', { icon: '❤️' })
        }
      }
    } catch (error) {
      setIsFavorite(!newFavoriteState)
      onFavoriteToggle?.(product.id, !newFavoriteState)
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoadingFavorite(false)
    }
  }

  const productHref = product.href || `/products/${product.id}`

  // Get badges (max 2)
  const badges = getListingBadges(product)
  
  // Get delivery label
  const deliveryLabel = getDeliveryLabel(product)
  
  // Determine price display
  const isAuction = product.isAuction === true
  // Calculate currentBid from bids if not provided
  const currentBid = product.currentBid ?? 
    (product.bids && product.bids.length > 0 
      ? Math.max(...product.bids.map((b: any) => typeof b === 'object' ? b.amount : b))
      : undefined)
  const mainPrice = isAuction ? (currentBid ?? product.price) : product.price
  const hasBuyNowPrice = product.buyNowPrice && product.buyNowPrice > 0
  
  // Format bid count and time left for auctions
  const bidCount = product.bids?.length || 0
  const timeLeft = product.auctionEnd ? formatTimeLeft(product.auctionEnd) : ''

  // Default variant - exact spec implementation
  return (
    <Link
      href={productHref}
      prefetch={true}
      className={`group w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${className}`}
    >
      {/* Media Container - Fixed 4:3 ratio */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {/* Image */}
        {mainImage ? (
          mainImage.startsWith('data:image/') ||
          mainImage.startsWith('blob:') ||
          mainImage.length > 1000 ||
          mainImage.includes('blob.vercel-storage.com') ? (
            <img
              src={mainImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <Image
              src={mainImage}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )
        ) : (
          /* Placeholder when no image */
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
            <Sparkles className="h-8 w-8 opacity-50" />
            <span className="mt-2 text-sm">Kein Bild</span>
          </div>
        )}

        {/* Top-left Badge Stack (max 2) */}
        {badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {badges.slice(0, 2).map((badge, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-900 shadow-sm backdrop-blur"
              >
                {badge === 'Zahlungsschutz' && <Shield className="mr-1 h-3 w-3" />}
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Top-right Heart Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white"
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* Content Wrapper */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-[13px] font-medium leading-5 text-gray-900 line-clamp-2 min-h-[40px]">
          {product.title}
        </h3>

        {/* Price Block */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[12px] font-medium text-gray-600">CHF</span>
          <span className="text-[20px] font-semibold leading-6 text-gray-900">
            {formatCHF(mainPrice).replace('CHF ', '')}
          </span>
        </div>

        {/* Secondary Price (only for Auction + BuyNowPrice) */}
        {isAuction && hasBuyNowPrice && (
          <div className="mt-0.5 text-[12px] text-gray-600">
            Sofort: {formatCHF(product.buyNowPrice!)}
          </div>
        )}

        {/* Meta Row */}
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-gray-600">
          {/* Left Meta: Location + Delivery */}
          <div className="flex items-center gap-2 min-w-0">
            {(product.city || product.postalCode) && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {product.postalCode && product.city
                    ? `${product.postalCode} ${product.city}`
                    : product.postalCode || product.city || ''}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 shrink-0">
              <Package className="h-3 w-3" />
              {deliveryLabel}
            </span>
          </div>

          {/* Right Meta (only for Auction): bidCount + timeLeft */}
          {isAuction && (bidCount > 0 || timeLeft) && (
            <div className="shrink-0">
              {bidCount > 0 && `${bidCount} Gebote`}
              {bidCount > 0 && timeLeft && ' · '}
              {timeLeft && timeLeft}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
