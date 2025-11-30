'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Clock, Sparkles, Gavel, Zap, Flame } from 'lucide-react'
import { useSession } from 'next-auth/react'

export interface ProductCardData {
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
  className = '' 
}: ProductCardProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)

  // Check if product is favorite on mount
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user) {
        setIsFavorite(false)
        return
      }

      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          const favoriteIds = (data.favorites || []).map((f: any) => f.watchId || f.watch?.id)
          setIsFavorite(favoriteIds.includes(product.id))
        }
      } catch (error) {
        console.error('Error checking favorite:', error)
      }
    }
    checkFavorite()
  }, [product.id, session?.user])

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

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Format auction end time
  const formatAuctionEnd = (auctionEnd?: string) => {
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
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session?.user) {
      // Redirect to login if not authenticated
      const currentUrl = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/'
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
      return
    }

    if (isLoadingFavorite) return

    setIsLoadingFavorite(true)
    const newFavoriteState = !isFavorite
    
    try {
      if (isFavorite) {
        // Entfernen: DELETE /api/favorites/${watchId}
        const response = await fetch(`/api/favorites/${product.id}`, { 
          method: 'DELETE' 
        })
        
        if (response.ok) {
          setIsFavorite(false)
          onFavoriteToggle?.(product.id, false)
        } else {
          const errorData = await response.json()
          console.error('Error removing favorite:', errorData.message)
        }
      } else {
        // Hinzufügen: POST /api/favorites mit watchId im Body
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchId: product.id })
        })
        
        if (response.ok) {
          setIsFavorite(true)
          onFavoriteToggle?.(product.id, true)
        } else {
          const errorData = await response.json()
          console.error('Error adding favorite:', errorData.message)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoadingFavorite(false)
    }
  }

  const productHref = product.href || `/products/${product.id}`

  // Compact variant (smaller, for dense grids)
  if (variant === 'compact') {
    return (
      <Link
        href={productHref}
        className={`group bg-white rounded-[20px] overflow-hidden transition-all duration-300 ${className}`}
        style={{
          border: '1px solid rgba(20, 184, 166, 0.1)',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(20, 184, 166, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0px 12px 40px rgba(20, 184, 166, 0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(20, 184, 166, 0.1)'
        }}
      >
        <div className="relative aspect-[5/4] bg-gray-100 overflow-hidden">
          {mainImage && !imageError ? (
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
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
            <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Booster Badges */}
          {hasSuperBoost && (
            <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
              <Sparkles className="h-3 w-3" />
            </div>
          )}
          {hasTurboBoost && (
            <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
              <Zap className="h-3 w-3" />
            </div>
          )}
          {hasBoost && (
            <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
              <Flame className="h-3 w-3" />
            </div>
          )}
        </div>

        <div className="p-2">
          {product.brand && (
            <div className="text-xs font-medium text-primary-600 mb-1 truncate">
              {product.brand}
            </div>
          )}
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-bold text-gray-900">
              {formatPrice(product.currentBid || product.price)}
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
        className={`bg-white rounded-[20px] overflow-hidden flex group transition-all duration-300 ${className}`}
        style={{
          border: '1px solid rgba(20, 184, 166, 0.1)',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(20, 184, 166, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0px 12px 40px rgba(20, 184, 166, 0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(20, 184, 166, 0.1)'
        }}
      >
        <div className="relative w-64 flex-shrink-0 bg-gray-100">
          <div className="aspect-[5/4]">
            {mainImage && !imageError ? (
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                onError={() => setImageError(true)}
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
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          {hasSuperBoost && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1.5 rounded-full shadow-md z-10 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          )}
          {hasTurboBoost && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1.5 rounded-full shadow-md z-10 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5" />
            </div>
          )}
          {hasBoost && (
            <div className="absolute top-2 left-2 bg-primary-600 text-white p-1.5 rounded-full shadow-md z-10 flex items-center justify-center">
              <Flame className="h-3.5 w-3.5" />
            </div>
          )}
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
                {formatPrice(product.currentBid || product.price)}
              </div>
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
      className={`group bg-white rounded-[20px] overflow-hidden transition-all duration-300 animate-fade-in-up ${className}`}
      style={{
        border: '1px solid rgba(20, 184, 166, 0.1)',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(20, 184, 166, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
        e.currentTarget.style.boxShadow = '0px 12px 40px rgba(20, 184, 166, 0.25)'
        e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(20, 184, 166, 0.1)'
        e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.1)'
      }}
    >
      <div className="relative aspect-[5/4] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
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
          <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Booster Badges */}
        {hasSuperBoost && (
          <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
            <Sparkles className="h-3 w-3" />
          </div>
        )}
        {hasTurboBoost && (
          <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
            <Zap className="h-3 w-3" />
          </div>
        )}
        {hasBoost && (
          <div className="absolute top-1.5 left-1.5 bg-primary-600 text-white p-1 rounded-full shadow-md z-10 flex items-center justify-center">
            <Flame className="h-3 w-3" />
          </div>
        )}
      </div>

      <div className="p-2">
        {product.brand && (
          <div className="text-xs font-medium text-primary-600 mb-1 truncate">
            {product.brand}
          </div>
        )}
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-bold text-gray-900">
            {formatPrice(product.currentBid || product.price)}
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

