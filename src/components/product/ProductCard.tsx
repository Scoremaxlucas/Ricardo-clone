'use client'

import { Clock, Flame, Gavel, Heart, MapPin, Sparkles, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
  className = '',
}: ProductCardProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  // WICHTIG: imageError wird nur auf true gesetzt, wenn ein Bild-Fehler auftritt
  // Initial false, damit Bilder geladen werden können
  const [imageError, setImageError] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)

  // WICHTIG: Reagiere auf Änderungen in product.images
  useEffect(() => {
    // Wenn neue Bilder vorhanden sind, reset imageError
    const images = typeof product.images === 'string'
      ? (() => {
          try {
            return JSON.parse(product.images)
          } catch {
            return product.images.split(',').filter(Boolean)
          }
        })()
      : Array.isArray(product.images) ? product.images : []

    if (images.length > 0) {
      setImageError(false) // Reset error wenn Bilder vorhanden sind
    }
  }, [product.images])

  // Check if product is favorite on mount
  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const checkFavorite = async () => {
      if (!session?.user) {
        if (isMounted) {
          setIsFavorite(false)
        }
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

  // Parse images
  // WICHTIG: Stelle sicher, dass immer das erste Bild (Titelbild) verwendet wird
  const images =
    typeof product.images === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(product.images)
            // Stelle sicher, dass es ein Array ist und die Reihenfolge beibehalten wird
            return Array.isArray(parsed) ? parsed : []
          } catch {
            // Fallback: Split by comma, behalte Reihenfolge
            return product.images.split(',').filter(Boolean)
          }
        })()
      : Array.isArray(product.images) ? product.images : []

  // DEBUG: Log wenn keine Bilder vorhanden
  if (images.length === 0 && product.id) {
    console.warn(`[ProductCard] Product ${product.id} (${product.title}) has NO images. product.images:`, product.images)
  }

  // WICHTIG: Immer das erste Bild (Titelbild) verwenden, NIEMALS ein anderes
  const mainImage = images.length > 0 ? images[0] : null

  // OPTIMIERT: Preload image when it becomes available for instant display
  useEffect(() => {
    if (mainImage && typeof window !== 'undefined' && !mainImage.startsWith('data:') && !mainImage.startsWith('blob:')) {
      // Preload URL images for instant display
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = mainImage
      link.setAttribute('fetchpriority', 'high')
      document.head.appendChild(link)

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      }
    }
  }, [mainImage])

  // Parse boosters
  const boosters = product.boosters || []
  const hasSuperBoost = boosters.includes('super-boost')
  const hasTurboBoost = boosters.includes('turbo-boost') && !hasSuperBoost
  const hasBoost = boosters.includes('boost') && !hasSuperBoost && !hasTurboBoost

  // Format price
  // WICHTIG: Immer 2 Dezimalstellen anzeigen, damit Preise wie CHF 1.80 korrekt angezeigt werden
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
      minute: '2-digit',
    })
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      // Redirect to login if not authenticated
      const currentUrl =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
      return
    }

    if (isLoadingFavorite) return

    setIsLoadingFavorite(true)
    const newFavoriteState = !isFavorite

    // OPTIMISTIC UI UPDATE: Update UI immediately before API call
    setIsFavorite(newFavoriteState)
    onFavoriteToggle?.(product.id, newFavoriteState)

    try {
      if (isFavorite) {
        // Entfernen: DELETE /api/favorites/${watchId}
        const response = await fetch(`/api/favorites/${product.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          // Revert on error
          setIsFavorite(!newFavoriteState)
          onFavoriteToggle?.(product.id, !newFavoriteState)
          const errorData = await response.json()
          console.error('Error removing favorite:', errorData.message)
        }
      } else {
        // Hinzufügen: POST /api/favorites mit watchId im Body
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchId: product.id }),
        })

        if (!response.ok) {
          // Revert on error
          setIsFavorite(!newFavoriteState)
          onFavoriteToggle?.(product.id, !newFavoriteState)
          const errorData = await response.json()
          console.error('Error adding favorite:', errorData.message)
        }
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(!newFavoriteState)
      onFavoriteToggle?.(product.id, !newFavoriteState)
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
        prefetch={true}
        className={`group overflow-hidden rounded-[20px] bg-white transition-all duration-300 ${className}`}
        style={{
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0px 12px 40px rgba(0, 0, 0, 0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow =
            '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
      <div className="relative aspect-[5/4] overflow-hidden bg-gray-100">
        {mainImage ? (
          mainImage.startsWith('data:image/') || mainImage.startsWith('blob:') || mainImage.length > 1000 ? (
            <img
              src={mainImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="eager"
              onError={() => {
                setImageError(true)
              }}
              onLoad={() => {
                setImageError(false)
              }}
            />
          ) : (
            <Image
              src={mainImage}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="eager"
              priority
              quality={85}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onError={() => {
                setImageError(true)
              }}
              onLoad={() => {
                setImageError(false)
              }}
              unoptimized={mainImage.startsWith('data:') || mainImage.startsWith('blob:')}
            />
          )
        ) : imageError ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xs text-gray-400">
            <Sparkles className="h-6 w-6 opacity-50" />
            <span className="ml-2 text-xs">Kein Bild</span>
          </div>
        ) : (
          // OPTIMIERT: Zeige subtilen Placeholder statt Spinner (wie Ricardo)
          <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100" />
        )}

          {/* Favorite Button - Größer auf Mobile */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute right-1.5 top-1.5 z-10 rounded-full p-1.5 shadow-md transition-all md:p-1 ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            } ${isLoadingFavorite ? 'cursor-wait opacity-50' : ''}`}
            aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Heart className={`h-4 w-4 md:h-3 md:w-3 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Booster Badges */}
          {hasSuperBoost && (
            <div className="absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-1 text-white shadow-md">
              <Sparkles className="h-3 w-3" />
            </div>
          )}
          {hasTurboBoost && (
            <div className="absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 text-white shadow-md">
              <Zap className="h-3 w-3" />
            </div>
          )}
          {hasBoost && (
            <div className="absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-full bg-primary-600 p-1 text-white shadow-md">
              <Flame className="h-3 w-3" />
            </div>
          )}
        </div>

        <div className="p-2 md:p-2">
          {product.brand && (
            <div className="mb-1 truncate text-xs font-medium text-primary-600 md:text-xs">
              {product.brand}
            </div>
          )}
          <div className="mb-1 flex items-center justify-between">
            <div className="text-base font-bold text-gray-900 md:text-sm">
              {formatPrice(product.currentBid || product.price)}
            </div>
            {product.buyNowPrice && (
              <div className="text-xs text-gray-500 md:text-xs">
                Sofort: {formatPrice(product.buyNowPrice)}
              </div>
            )}
          </div>
          {product.isAuction && (
            <div className="mb-1 flex items-center gap-1">
              <Gavel className="h-3 w-3 text-orange-600" />
              <span className="text-xs font-medium text-orange-600">Auktion</span>
            </div>
          )}
          <div className="mb-1 line-clamp-2 min-h-[44px] text-sm font-medium leading-tight text-gray-900 md:min-h-[40px] md:text-sm">
            {product.title}
          </div>
          {/* Location - IMMER sichtbar, sehr prominent - AUSSERHALB des flex-wrap Containers */}
          {(product.city || product.postalCode) && (
            <div className="mb-2 flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1.5 text-[12px] font-bold text-gray-800">
              <MapPin className="h-4 w-4 flex-shrink-0 text-primary-600" />
              <span className="truncate font-semibold">
                {product.postalCode && product.city
                  ? `${product.postalCode} ${product.city}`
                  : product.postalCode || product.city || ''}
              </span>
            </div>
          )}
          <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
            {/* Condition - IMMER sichtbar (nicht mehr nur wenn showCondition) */}
            {product.condition && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                {product.condition}
              </span>
            )}
            {product.isAuction && product.bids && product.bids.length > 0 && (
              <span className="text-gray-600">
                ({product.bids.length} {product.bids.length === 1 ? 'Gebot' : 'Gebote'})
              </span>
            )}
          </div>
          {product.isAuction && product.auctionEnd && (
            <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
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
        prefetch={true}
        className={`group flex overflow-hidden rounded-[20px] bg-white transition-all duration-300 ${className}`}
        style={{
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0px 12px 40px rgba(0, 0, 0, 0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow =
            '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="relative w-64 flex-shrink-0 bg-gray-100">
          <div className="relative aspect-[5/4]">
            {mainImage ? (
              mainImage.startsWith('data:image/') || mainImage.startsWith('blob:') || mainImage.length > 1000 ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                  loading="lazy"
                />
              ) : (
                <Image
                  src={mainImage}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                  sizes="256px"
                  loading="lazy"
                  unoptimized={mainImage.startsWith('data:') || mainImage.startsWith('blob:')}
                />
              )
            ) : imageError ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                <Sparkles className="mb-2 h-8 w-8 opacity-50" />
                <span className="text-xs">Kein Bild</span>
              </div>
            ) : null}
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`absolute right-2 top-2 z-10 rounded-full p-1.5 shadow-md transition-all ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          {hasSuperBoost && (
            <div className="absolute left-2 top-2 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-1.5 text-white shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          )}
          {hasTurboBoost && (
            <div className="absolute left-2 top-2 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 text-white shadow-md">
              <Zap className="h-3.5 w-3.5" />
            </div>
          )}
          {hasBoost && (
            <div className="absolute left-2 top-2 z-10 flex items-center justify-center rounded-full bg-primary-600 p-1.5 text-white shadow-md">
              <Flame className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            {product.brand && (
              <div className="mb-1 text-base font-semibold text-primary-600">{product.brand}</div>
            )}
            <div
              className="group/title relative mb-2 text-lg font-semibold text-gray-900"
              title={product.title}
            >
              {product.title}
              {/* Tooltip für vollständigen Titel */}
              {product.title.length > 60 && (
                <div className="invisible absolute bottom-full left-0 z-20 mb-2 w-72 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/title:visible group-hover/title:opacity-100">
                  {product.title}
                  <div className="absolute left-4 top-full h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
            {product.isAuction && (
              <div className="mb-2 flex items-center gap-1">
                <Gavel className="h-3 w-3 text-orange-600" />
                <span className="text-xs font-medium text-orange-600">Auktion</span>
              </div>
            )}
            {/* Location - IMMER sichtbar, sehr prominent */}
            {(product.city || product.postalCode) && (
              <div className="mb-2 flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1.5 text-[12px] font-bold text-gray-800">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary-600" />
                <span className="truncate font-semibold">
                  {product.postalCode && product.city
                    ? `${product.postalCode} ${product.city}`
                    : product.postalCode || product.city || ''}
                </span>
              </div>
            )}
            <div className="mb-2 flex items-center gap-3 text-sm text-gray-600">
              {product.isAuction && product.bids && product.bids.length > 0 && (
                <span className="text-gray-600">
                  {product.bids.length} {product.bids.length === 1 ? 'Gebot' : 'Gebote'}
                </span>
              )}
            </div>
            {product.isAuction && product.auctionEnd && (
              <div className="mb-2 flex items-center gap-1 text-sm font-medium text-orange-600">
                <Clock className="h-4 w-4" />
                <span>Endet: {formatAuctionEnd(product.auctionEnd)}</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(product.currentBid || product.price)}
              </div>
              {product.buyNowPrice && (
                <div className="mt-1 text-sm text-gray-500">
                  Sofort: {formatPrice(product.buyNowPrice)}
                </div>
              )}
            </div>
            {showBuyNowButton && (
              <button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
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
      prefetch={true}
      className={`group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[20px] bg-white transition-all duration-300 ${className}`}
      style={{
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
        e.currentTarget.style.boxShadow = '0px 12px 40px rgba(0, 0, 0, 0.15)'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow =
          '0px 4px 20px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {mainImage ? (
          mainImage.startsWith('data:image/') || mainImage.startsWith('blob:') || mainImage.length > 1000 ? (
            <img
              src={mainImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
              loading="lazy"
            />
          ) : (
            <Image
              src={mainImage}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              unoptimized={mainImage.startsWith('data:') || mainImage.startsWith('blob:')}
            />
          )
        ) : imageError ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
            <Sparkles className="mb-2 h-8 w-8 opacity-50" />
            <span className="text-xs">Kein Bild</span>
          </div>
        ) : null}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute right-1.5 top-1.5 z-10 rounded-full p-1 shadow-md transition-all ${
            isFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          } ${isLoadingFavorite ? 'cursor-wait opacity-50' : ''}`}
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Booster Badges */}
        {hasSuperBoost && (
          <div className="absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-1 text-white shadow-md">
            <Sparkles className="h-3 w-3" />
          </div>
        )}
        {hasTurboBoost && (
          <div className="absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 text-white shadow-md">
            <Zap className="h-3 w-3" />
          </div>
        )}
        {hasBoost && (
          <div className="absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-full bg-primary-600 p-1 text-white shadow-md">
            <Flame className="h-3 w-3" />
          </div>
        )}

        {/* Auction Badge - Immer sichtbar wenn Auktion (auch mit Boostern) - Subtiler */}
        {product.isAuction && (
          <div className={`absolute left-1.5 z-10 flex items-center gap-1 rounded-md bg-gray-800/70 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white ${
            hasSuperBoost || hasTurboBoost || hasBoost ? 'top-10' : 'top-1.5'
          }`}>
            <Gavel className="h-2.5 w-2.5" />
            <span>Auktion</span>
          </div>
        )}
      </div>

      <div className="relative p-2">
        {/* Title - Immer sichtbar, 1 Zeile */}
        <div
          className="group/title relative mb-1 line-clamp-1 text-sm font-medium leading-tight text-gray-900"
          title={product.title}
        >
          {product.title}
        </div>

        {/* Price - Immer sichtbar */}
        <div className="mb-1 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">
            {formatPrice(product.currentBid || product.price)}
          </div>
        </div>

        {/* Buy Now Price - IMMER sichtbar bei normalen Angeboten */}
        {!product.isAuction && product.buyNowPrice && (
          <div className="mb-1.5 text-xs font-semibold text-primary-600">
            Sofort: {formatPrice(product.buyNowPrice)}
          </div>
        )}

        {/* Auktion Info - Prominent wenn Auktion */}
        {product.isAuction && product.auctionEnd && (
          <div className="mb-1.5 flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-1">
            <Clock className="h-3 w-3 flex-shrink-0 text-orange-600" />
            <span className="text-[10px] font-semibold text-orange-700">
              {formatAuctionEnd(product.auctionEnd)}
            </span>
            {product.bids && product.bids.length > 0 && (
              <span className="ml-auto text-[10px] text-orange-600">
                {product.bids.length} {product.bids.length === 1 ? 'Gebot' : 'Gebote'}
              </span>
            )}
          </div>
        )}

        {/* Location - IMMER sichtbar, sehr prominent */}
        {(product.city || product.postalCode) && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1.5 text-[12px] font-bold text-gray-800">
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary-600" />
            <span className="truncate font-semibold">
              {product.postalCode && product.city
                ? `${product.postalCode} ${product.city}`
                : product.postalCode || product.city || ''}
            </span>
          </div>
        )}

        {/* Zusätzliche Details - Brand IMMER sichtbar, Condition immer sichtbar */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
          {/* Brand - IMMER sichtbar */}
          {product.brand && (
            <span className="text-primary-600 font-medium">
              {product.brand}
            </span>
          )}

          {/* Condition - IMMER sichtbar */}
          {product.condition && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
              {product.condition}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
