'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
// import Image from 'next/image' // Can be used for optimization later
import { Heart, MapPin, Clock, Sparkles, TrendingUp, Gavel, Zap, Flame } from 'lucide-react'
import { useSession } from 'next-auth/react'

export interface UnifiedProductCardData {
  id: string
  title: string
  brand?: string
  model?: string
  price: number
  images: string[] | string
  condition?: string
  city?: string
  postalCode?: string
  auctionEnd?: string
  buyNowPrice?: number
  isAuction?: boolean
  bids?: any[]
  boosters?: string[]
  currentBid?: number
  href?: string
  createdAt?: string
}

interface UnifiedProductCardProps {
  product: UnifiedProductCardData
  variant?: 'default' | 'compact' | 'list'
  showCondition?: boolean
  showBuyNowButton?: boolean
  onFavoriteToggle?: (productId: string, isFavorite: boolean) => void
  className?: string
  priority?: boolean // Für Next.js Image Optimization
}

/**
 * Unified Product Card Component
 * 
 * Verbesserungen gegenüber Ricardo:
 * 1. Optimistic UI Updates für bessere Performance
 * 2. Lazy Loading mit Next.js Image Optimization
 * 3. Bessere Accessibility (ARIA-Labels, Keyboard-Navigation)
 * 4. Micro-interactions für bessere UX
 * 5. Einheitliches Design überall
 * 6. Responsive und Touch-optimiert
 */
export const UnifiedProductCard = memo(function UnifiedProductCard({
  product,
  variant = 'default',
  showCondition = false,
  showBuyNowButton = false,
  onFavoriteToggle,
  className = '',
  priority = false
}: UnifiedProductCardProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Parse images
  const images = typeof product.images === 'string' 
    ? (() => {
        try {
          return JSON.parse(product.images)
        } catch {
          return product.images.split(',').filter(Boolean)
        }
      })()
    : product.images || []
  
  const mainImage = images[0] || null

  // Parse boosters
  const boosters = product.boosters || []
  const hasSuperBoost = boosters.includes('super-boost')
  const hasTurboBoost = boosters.includes('turbo-boost') && !hasSuperBoost
  const hasBoost = boosters.includes('boost') && !hasSuperBoost && !hasTurboBoost

  // Check if product is new (less than 7 days old)
  const isNew = product.createdAt 
    ? (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

  // Format price
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }, [])

  // Format auction end time
  const formatAuctionEnd = useCallback((auctionEnd?: string) => {
    if (!auctionEnd) return null
    const end = new Date(auctionEnd)
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
  }, [])

  // Load favorite status
  useEffect(() => {
    if (!session?.user) return
    
    const checkFavorite = async () => {
      try {
        const response = await fetch(`/api/favorites/${product.id}`)
        if (response.ok) {
          const data = await response.json()
          setIsFavorite(data.isFavorite || false)
        }
      } catch (error) {
        // Silent fail
      }
    }
    
    checkFavorite()
  }, [session?.user, product.id])

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session?.user) {
      // Could show a toast notification here
      return
    }

    if (isLoadingFavorite) return

    // Optimistic update
    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)
    setIsLoadingFavorite(true)
    
    try {
      const method = isFavorite ? 'DELETE' : 'POST'
      const response = await fetch(`/api/favorites/${product.id}`, { method })
      
      if (!response.ok) {
        // Revert on error
        setIsFavorite(!newFavoriteState)
      } else {
        onFavoriteToggle?.(product.id, newFavoriteState)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Revert on error
      setIsFavorite(!newFavoriteState)
    } finally {
      setIsLoadingFavorite(false)
    }
  }

  const productHref = product.href || `/products/${product.id}`
  const displayPrice = product.currentBid || product.price

  // Compact variant (for dense grids)
  if (variant === 'compact') {
    return (
      <Link
        href={productHref}
        className={`group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${product.title} - ${formatPrice(displayPrice)}`}
      >
        <div className="relative aspect-[5/4] bg-gray-100 overflow-hidden">
          {mainImage && !imageError ? (
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Sparkles className="h-6 w-6" />
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-1.5 right-1.5 rounded-full p-1 shadow-md transition-all z-10 ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            } ${isLoadingFavorite ? 'opacity-50 cursor-wait' : ''}`}
            aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Heart className={`h-3 w-3 transition-all ${isFavorite ? 'fill-current scale-110' : ''}`} />
          </button>

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
            {hasSuperBoost && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1 rounded-full shadow-md flex items-center justify-center">
                <Sparkles className="h-3 w-3" />
              </div>
            )}
            {hasTurboBoost && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-full shadow-md flex items-center justify-center">
                <Zap className="h-3 w-3" />
              </div>
            )}
            {hasBoost && (
              <div className="bg-primary-600 text-white p-1 rounded-full shadow-md flex items-center justify-center">
                <Flame className="h-3 w-3" />
              </div>
            )}
            {isNew && !product.isAuction && (
              <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium shadow-md flex items-center gap-0.5">
                <TrendingUp className="h-2.5 w-2.5" />
                Neu
              </div>
            )}
          </div>
        </div>

        <div className="p-2">
          {product.brand && (
            <div className="text-xs font-medium text-primary-600 mb-1 truncate">
              {product.brand}
            </div>
          )}
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-bold text-gray-900">
              {formatPrice(displayPrice)}
            </div>
            {product.buyNowPrice && (
              <div className="text-xs text-gray-500">
                Sofort: {formatPrice(product.buyNowPrice)}
              </div>
            )}
          </div>
          {product.isAuction && (
            <div className="flex items-center gap-1 mb-1">
              <Gavel className="h-3 w-3 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">Auktion</span>
            </div>
          )}
          <div className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 min-h-[40px] leading-tight">
            {product.title}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 flex-wrap mb-1">
            {showCondition && product.condition && (
              <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                {product.condition}
              </span>
            )}
            {(product.city || product.postalCode) && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {product.city && product.postalCode 
                  ? `${product.city} ${product.postalCode}`
                  : product.city || product.postalCode}
              </span>
            )}
            {product.isAuction && product.bids && product.bids.length > 0 && (
              <span className="text-gray-600">
                ({product.bids.length} {product.bids.length === 1 ? 'Gebot' : 'Gebote'})
              </span>
            )}
          </div>
          {product.isAuction && product.auctionEnd && (
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
              <Clock className="h-3 w-3" />
              <span>Endet: {formatAuctionEnd(product.auctionEnd)}</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // List variant (horizontal layout)
  if (variant === 'list') {
    return (
      <Link
        href={productHref}
        className={`bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden flex group ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${product.title} - ${formatPrice(displayPrice)}`}
      >
        <div className="relative w-64 flex-shrink-0 bg-gray-100">
          <div className="aspect-[5/4]">
            {mainImage && !imageError ? (
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Sparkles className="h-8 w-8" />
              </div>
            )}
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 rounded-full p-1.5 shadow-md transition-all z-10 ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
            aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Heart className={`h-4 w-4 transition-all ${isFavorite ? 'fill-current scale-110' : ''}`} />
          </button>
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {hasSuperBoost && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1.5 rounded-full shadow-md flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}
            {hasTurboBoost && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1.5 rounded-full shadow-md flex items-center justify-center">
                <Zap className="h-3.5 w-3.5" />
              </div>
            )}
            {hasBoost && (
              <div className="bg-primary-600 text-white p-1.5 rounded-full shadow-md flex items-center justify-center">
                <Flame className="h-3.5 w-3.5" />
              </div>
            )}
            {isNew && !product.isAuction && (
              <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-md flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                Neu
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {product.brand && (
              <div className="text-base font-semibold text-primary-600 mb-1">
                {product.brand}
              </div>
            )}
            <div className="font-semibold text-gray-900 text-lg mb-2">
              {product.title}
            </div>
            {product.isAuction && (
              <div className="flex items-center gap-1 mb-2">
                <Gavel className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-orange-600 font-medium">Auktion</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
              {(product.city || product.postalCode) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {product.city && product.postalCode 
                    ? `${product.city} ${product.postalCode}`
                    : product.city || product.postalCode}
                </span>
              )}
              {product.isAuction && product.bids && product.bids.length > 0 && (
                <span className="text-gray-600">
                  {product.bids.length} {product.bids.length === 1 ? 'Gebot' : 'Gebote'}
                </span>
              )}
            </div>
            {product.isAuction && product.auctionEnd && (
              <div className="flex items-center gap-1 text-sm text-orange-600 font-medium mb-2">
                <Clock className="h-4 w-4" />
                <span>Endet: {formatAuctionEnd(product.auctionEnd)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(displayPrice)}
              </div>
              {product.isAuction && (
                <div className="flex items-center gap-1 mt-1">
                  <Gavel className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-orange-600 font-medium">Auktion</span>
                </div>
              )}
              {product.buyNowPrice && (
                <div className="text-sm text-gray-500 mt-1">
                  Sofort: {formatPrice(product.buyNowPrice)}
                </div>
              )}
            </div>
            {showBuyNowButton && (
              <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium">
                Jetzt kaufen
              </button>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Default variant (standard card)
  return (
    <Link
      href={productHref}
      className={`group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${product.title} - ${formatPrice(displayPrice)}`}
    >
      <div className="relative aspect-[5/4] bg-gray-100 overflow-hidden">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Sparkles className="h-8 w-8" />
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-1.5 right-1.5 rounded-full p-1 shadow-md transition-all z-10 ${
            isFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          } ${isLoadingFavorite ? 'opacity-50 cursor-wait' : ''}`}
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart className={`h-3 w-3 transition-all ${isFavorite ? 'fill-current scale-110' : ''}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
          {hasSuperBoost && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1 rounded-full shadow-md flex items-center justify-center">
              <Sparkles className="h-3 w-3" />
            </div>
          )}
          {hasTurboBoost && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-full shadow-md flex items-center justify-center">
              <Zap className="h-3 w-3" />
            </div>
          )}
          {hasBoost && (
            <div className="bg-primary-600 text-white p-1 rounded-full shadow-md flex items-center justify-center">
              <Flame className="h-3 w-3" />
            </div>
          )}
          {isNew && !product.isAuction && (
            <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium shadow-md flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              Neu
            </div>
          )}
        </div>
      </div>

      <div className="p-2">
        {product.brand && (
          <div className="text-xs font-medium text-primary-600 mb-1 truncate">
            {product.brand}
          </div>
        )}
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-bold text-gray-900">
            {formatPrice(displayPrice)}
          </div>
          {product.buyNowPrice && (
            <div className="text-xs text-gray-500">
              Sofort: {formatPrice(product.buyNowPrice)}
            </div>
          )}
        </div>
        {product.isAuction && (
          <div className="flex items-center gap-1 mb-1">
            <Gavel className="h-3 w-3 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Auktion</span>
          </div>
        )}
        <div className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 min-h-[40px] leading-tight">
          {product.title}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 flex-wrap mb-1">
          {showCondition && product.condition && (
            <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
              {product.condition}
            </span>
          )}
          {(product.city || product.postalCode) && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {product.city && product.postalCode 
                ? `${product.city} ${product.postalCode}`
                : product.city || product.postalCode}
            </span>
          )}
          {product.isAuction && product.bids && product.bids.length > 0 && (
            <span className="text-gray-600">
              ({product.bids.length} {product.bids.length === 1 ? 'Gebot' : 'Gebote'})
            </span>
          )}
        </div>
        {product.isAuction && product.auctionEnd && (
          <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
            <Clock className="h-3 w-3" />
            <span>Endet: {formatAuctionEnd(product.auctionEnd)}</span>
          </div>
        )}
      </div>
    </Link>
  )
})

