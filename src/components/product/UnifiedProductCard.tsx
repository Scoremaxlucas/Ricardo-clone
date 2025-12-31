'use client'

import {
  Award,
  Clock,
  Gavel,
  Heart,
  MapPin,
  Medal,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { memo, useCallback, useEffect, useState } from 'react'

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
  paymentProtectionEnabled?: boolean
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
 * Verbesserungen:
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
  priority = false,
}: UnifiedProductCardProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Parse images
  const images =
    typeof product.images === 'string'
      ? (() => {
          try {
            return JSON.parse(product.images)
          } catch {
            return product.images.split(',').filter(Boolean)
          }
        })()
      : product.images || []

  const mainImage = images[0] || null

  // Parse boosters (support both old and new naming: gold/silber/bronze and super-boost/turbo-boost/boost)
  const boosters = product.boosters || []
  const hasGold = boosters.includes('gold') || boosters.includes('super-boost')
  const hasSilber = (boosters.includes('silber') || boosters.includes('turbo-boost')) && !hasGold
  const hasBronze =
    (boosters.includes('bronze') || boosters.includes('boost')) && !hasGold && !hasSilber

  // Check if product is new (less than 7 days old)
  const isNew = product.createdAt
    ? Date.now() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : false

  // Format price
  // WICHTIG: Immer 2 Dezimalstellen anzeigen, damit Preise wie CHF 1.80 korrekt angezeigt werden
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
      minute: '2-digit',
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
        className={`group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${product.title} - ${formatPrice(displayPrice)}`}
      >
        <div className="relative aspect-[5/4] overflow-hidden bg-gray-100">
          {mainImage && !imageError ? (
            mainImage.startsWith('data:') ||
            mainImage.startsWith('blob:') ||
            mainImage.includes('blob.vercel-storage.com') ? (
              <img
                src={mainImage}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-300"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <Image
                src={mainImage}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300"
                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                loading="lazy"
              />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
              <Sparkles className="mb-2 h-6 w-6 opacity-50" />
              <span className="text-xs">Kein Bild</span>
            </div>
          )}

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
            <Heart
              className={`h-3 w-3 transition-all ${isFavorite ? 'scale-110 fill-current' : ''}`}
            />
          </button>

          {/* Badges - Ricardo-style: Gold > Silber > Bronze */}
          <div className="absolute left-1.5 top-1.5 z-10 flex flex-col gap-1">
            {hasGold && (
              <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 p-1.5 text-amber-900 shadow-md">
                <Award className="h-3 w-3" />
              </div>
            )}
            {hasSilber && (
              <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-slate-300 to-slate-400 p-1.5 text-slate-800 shadow-md">
                <Medal className="h-3 w-3" />
              </div>
            )}
            {hasBronze && (
              <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-orange-300 to-amber-400 p-1.5 text-orange-900 shadow-md">
                <Star className="h-3 w-3" />
              </div>
            )}
            {isNew && !product.isAuction && (
              <div className="flex items-center gap-0.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-md">
                <TrendingUp className="h-2.5 w-2.5" />
                Neu
              </div>
            )}
            {/* Auction Badge - Immer sichtbar wenn Auktion (auch mit Boostern) - Subtiler */}
            {product.isAuction && (
              <div
                className={`absolute left-1.5 z-10 flex items-center gap-1 rounded-md bg-gray-800/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm ${
                  hasGold || hasSilber || hasBronze ? 'top-8' : 'top-1.5'
                }`}
              >
                <Gavel className="h-2.5 w-2.5" />
                <span>Auktion</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative p-2">
          {/* Title - Immer sichtbar, 1 Zeile */}
          <div
            className="group/title relative mb-1 line-clamp-1 text-sm font-medium leading-tight text-gray-900"
            title={product.title}
          >
            {product.title}
          </div>

          {/* Helvenda Schutz Badge + Brand (like Ricardo's ® | Brand) */}
          {(product.paymentProtectionEnabled || product.brand) && (
            <div className="mb-1 flex items-center gap-1 text-[11px]">
              {product.paymentProtectionEnabled && (
                <span
                  className="relative inline-flex h-5 w-5 items-center justify-center"
                  title="Helvenda Zahlungsschutz"
                >
                  <Shield className="h-5 w-5 fill-green-100 stroke-green-600 stroke-[2]" />
                  <span 
                    className="absolute text-[10px] font-extrabold leading-none text-green-700"
                    style={{ 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      lineHeight: '1'
                    }}
                  >
                    H
                  </span>
                </span>
              )}
              {product.brand && (
                <>
                  {product.paymentProtectionEnabled && <span className="text-gray-400">|</span>}
                  <span className="font-medium text-primary-600">{product.brand}</span>
                </>
              )}
            </div>
          )}

          {/* Price - Immer sichtbar */}
          <div className="mb-1 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">{formatPrice(displayPrice)}</div>
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
            <div className="mb-1 flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-1 text-[11px] font-bold text-gray-800">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary-600" />
              <span className="truncate">
                {product.postalCode && product.city
                  ? `${product.postalCode} ${product.city}`
                  : product.postalCode || product.city || ''}
              </span>
            </div>
          )}

          {/* Zusätzliche Details - Nur beim Hover */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {/* Brand */}
            {product.brand && <span className="font-medium text-primary-600">{product.brand}</span>}

            {/* Condition */}
            {showCondition && product.condition && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                {product.condition}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // List variant (horizontal layout)
  if (variant === 'list') {
    return (
      <Link
        href={productHref}
        className={`group flex overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${product.title} - ${formatPrice(displayPrice)}`}
      >
        <div className="relative w-64 flex-shrink-0 bg-gray-100">
          <div className="relative aspect-[5/4]">
            {mainImage && !imageError ? (
              mainImage.startsWith('data:') ||
              mainImage.startsWith('blob:') ||
              mainImage.includes('blob.vercel-storage.com') ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-300"
                  style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <Image
                  src={mainImage}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-300"
                  style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                  onError={() => setImageError(true)}
                  sizes="256px"
                  loading="lazy"
                />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                <Sparkles className="mb-2 h-8 w-8 opacity-50" />
                <span className="text-xs">Kein Bild</span>
              </div>
            )}
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`absolute right-2 top-2 z-10 rounded-full p-1.5 shadow-md transition-all ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
            aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Heart
              className={`h-4 w-4 transition-all ${isFavorite ? 'scale-110 fill-current' : ''}`}
            />
          </button>
          {/* Badges - Ricardo-style: Gold > Silber > Bronze */}
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            {hasGold && (
              <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 p-1.5 text-amber-900 shadow-md">
                <Award className="h-3.5 w-3.5" />
              </div>
            )}
            {hasSilber && (
              <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-slate-300 to-slate-400 p-1.5 text-slate-800 shadow-md">
                <Medal className="h-3.5 w-3.5" />
              </div>
            )}
            {hasBronze && (
              <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-orange-300 to-amber-400 p-1.5 text-orange-900 shadow-md">
                <Star className="h-3.5 w-3.5" />
              </div>
            )}
            {isNew && !product.isAuction && (
              <div className="flex items-center gap-0.5 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-md">
                <TrendingUp className="h-3 w-3" />
                Neu
              </div>
            )}
            {/* Auction Badge - Immer sichtbar wenn Auktion (falls kein Booster) - Subtiler */}
            {product.isAuction && !hasGold && !hasSilber && !hasBronze && (
              <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-md bg-gray-800/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                <Gavel className="h-2.5 w-2.5" />
                <span>Auktion</span>
              </div>
            )}
          </div>
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
            <div className="mb-2 flex items-center gap-3 text-sm text-gray-600">
              {(product.city || product.postalCode) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {product.postalCode && product.city
                    ? `${product.postalCode} ${product.city}`
                    : product.postalCode || product.city}
                </span>
              )}
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
              <div className="text-xl font-bold text-gray-900">{formatPrice(displayPrice)}</div>
              {product.isAuction && (
                <div className="mt-1 flex items-center gap-1">
                  <Gavel className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-600">Auktion</span>
                </div>
              )}
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
      className={`group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${product.title} - ${formatPrice(displayPrice)}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-gray-100">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <Sparkles className="h-8 w-8" />
          </div>
        )}

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
          <Heart
            className={`h-3 w-3 transition-all ${isFavorite ? 'scale-110 fill-current' : ''}`}
          />
        </button>

        {/* Badges - Ricardo-style: Gold > Silber > Bronze */}
        <div className="absolute left-1.5 top-1.5 z-10 flex flex-col gap-1">
          {hasGold && (
            <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 p-1 text-amber-900 shadow-md">
              <Award className="h-3 w-3" />
            </div>
          )}
          {hasSilber && (
            <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-slate-300 to-slate-400 p-1 text-slate-800 shadow-md">
              <Medal className="h-3 w-3" />
            </div>
          )}
          {hasBronze && (
            <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-orange-300 to-amber-400 p-1 text-orange-900 shadow-md">
              <Star className="h-3 w-3" />
            </div>
          )}
          {isNew && !product.isAuction && (
            <div className="flex items-center gap-0.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-md">
              <TrendingUp className="h-2.5 w-2.5" />
              Neu
            </div>
          )}
          {/* Auction Badge - Immer sichtbar wenn Auktion (falls kein Booster) - Subtiler */}
          {product.isAuction && !hasGold && !hasSilber && !hasBronze && (
            <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-md bg-gray-800/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
              <Gavel className="h-2.5 w-2.5" />
              <span>Auktion</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-2">
        {product.brand && (
          <div className="mb-1 truncate text-xs font-medium text-primary-600">{product.brand}</div>
        )}
        <div className="mb-1 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">{formatPrice(displayPrice)}</div>
          {product.buyNowPrice && (
            <div className="text-xs text-gray-500">Sofort: {formatPrice(product.buyNowPrice)}</div>
          )}
        </div>
        {product.isAuction && (
          <div className="mb-1 flex items-center gap-1">
            <Gavel className="h-3 w-3 text-orange-600" />
            <span className="text-xs font-medium text-orange-600">Auktion</span>
          </div>
        )}
        <div className="mb-1 line-clamp-2 min-h-[40px] text-sm font-medium leading-tight text-gray-900">
          {product.title}
        </div>
        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
          {showCondition && product.condition && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
              {product.condition}
            </span>
          )}
          {(product.city || product.postalCode) && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {product.postalCode && product.city
                ? `${product.postalCode} ${product.city}`
                : product.postalCode || product.city}
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
})
