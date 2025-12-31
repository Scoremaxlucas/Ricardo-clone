'use client'

import {
  checkIsNewListing,
  formatCHF,
  formatCHFCompact,
  formatTimeLeft,
  getBoostType,
  getDeliveryInfo,
  getListingBadges,
  getTimeSinceCreated,
  hasVisibilityBoost,
  type ListingData,
} from '@/lib/product-utils'
import {
  Award,
  BadgeCheck,
  Clock,
  Gavel,
  Heart,
  MapPin,
  Medal,
  Package,
  Shield,
  Star,
  Truck,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export interface ProductCardData extends ListingData {
  images: string[] | string
  city?: string
  postalCode?: string
  href?: string
  brand?: string
  model?: string
  boosters?: string[] // Visibility boost, NOT sponsorship
  isSponsored?: boolean // TRUE paid placement
  // Enhanced fields
  shippingMinCost?: number | null
  sellerVerified?: boolean
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

  // Get overlay badges (condition, sponsored only if isSponsored=true)
  const overlayBadges = getListingBadges(product)

  // Get delivery info (shipping cost, pickup availability)
  const deliveryInfo = getDeliveryInfo(product)

  // Check if listing has visibility boost (for subtle styling, NOT "Gesponsert" badge)
  const boostType = getBoostType(product)
  const isBoosted = hasVisibilityBoost(product)

  // Check if new listing (for "Neu eingestellt" meta label)
  const isNewListing = checkIsNewListing(product)
  const timeSinceCreated = isNewListing ? getTimeSinceCreated(product) : ''

  // Determine price display
  const isAuction = product.isAuction === true
  // Calculate currentBid from bids if not provided
  const currentBid =
    product.currentBid ??
    (product.bids && product.bids.length > 0
      ? Math.max(...product.bids.map((b: any) => (typeof b === 'object' ? b.amount : b)))
      : undefined)
  const mainPrice = isAuction ? (currentBid ?? product.price) : product.price
  const hasBuyNowPrice = product.buyNowPrice && product.buyNowPrice > 0

  // Format bid count and time left for auctions
  const bidCount = product.bids?.length || 0
  const timeLeft = product.auctionEnd ? formatTimeLeft(product.auctionEnd) : ''

  // Default variant - Ricardo-level implementation
  return (
    <Link
      href={productHref}
      prefetch={true}
      className={`group w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${className}`}
    >
      {/* Media Container - Fixed 4:3 ratio */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
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
          /* Empty neutral background - no placeholder text */
          <div className="h-full w-full bg-gray-50" />
        )}

        {/* Top-left: Badges - MAX 2 BADGES, strict hierarchy */}
        {/* Priority: 1) Auction/Sofortkauf 2) Condition (Wie neu) 3) Gold/Silber/Bronze (only if no auction) */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {(() => {
            const badges: React.ReactNode[] = []
            const MAX_BADGES = 2

            // Priority 1: Auction badge (highest priority for offer type)
            if (isAuction && badges.length < MAX_BADGES) {
              badges.push(
                <span
                  key="auction"
                  className="inline-flex items-center rounded-full bg-orange-100/95 px-2 py-0.5 text-[11px] font-semibold text-orange-800 shadow-sm backdrop-blur"
                >
                  <Gavel className="mr-1 h-3 w-3" />
                  Auktion
                </span>
              )
            }

            // Priority 2: Gold boost (only if NOT auction, to avoid clutter)
            if (!isAuction && isBoosted && boostType === 'gold' && badges.length < MAX_BADGES) {
              badges.push(
                <span
                  key="gold"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[11px] font-semibold text-amber-900 shadow-sm"
                  title="Premium-Platzierung"
                >
                  <Award className="mr-1 h-3 w-3" />
                  Gold
                </span>
              )
            }

            // Priority 3: Silber boost (only if NOT auction)
            if (!isAuction && isBoosted && boostType === 'silber' && badges.length < MAX_BADGES) {
              badges.push(
                <span
                  key="silber"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-slate-300 to-slate-400 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-sm"
                  title="Hervorgehobene Platzierung"
                >
                  <Medal className="mr-1 h-3 w-3" />
                  Silber
                </span>
              )
            }

            // Priority 4: Condition badge (Wie neu, Neu, etc.) - always try to show if space
            const conditionBadge = overlayBadges.find(
              b => b === 'Neu' || b === 'Wie neu' || b === 'Sehr gut'
            )
            if (conditionBadge && badges.length < MAX_BADGES) {
              badges.push(
                <span
                  key="condition"
                  className="inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-gray-800 shadow-sm backdrop-blur"
                >
                  {conditionBadge}
                </span>
              )
            }

            // Priority 5: Bronze boost (lowest priority, only if space and not auction)
            if (!isAuction && isBoosted && boostType === 'bronze' && badges.length < MAX_BADGES) {
              badges.push(
                <span
                  key="bronze"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-200 to-amber-300 px-2 py-0.5 text-[11px] font-medium text-orange-900 shadow-sm"
                  title="Hervorgehobene Platzierung"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Bronze
                </span>
              )
            }

            // Priority 6: Sponsored badge (only if isSponsored === true)
            if (product.isSponsored === true && badges.length < MAX_BADGES) {
              badges.push(
                <span
                  key="sponsored"
                  className="inline-flex items-center rounded-full bg-gray-100/90 px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm backdrop-blur"
                >
                  Gesponsert
                </span>
              )
            }

            return badges
          })()}
        </div>

        {/* Bottom-left: Auction timer (subtle, not aggressive) */}
        {isAuction && timeLeft && timeLeft !== 'Beendet' && (
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            <Clock className="h-2.5 w-2.5" />
            <span>endet in {timeLeft}</span>
          </div>
        )}

        {/* Top-right Heart Button - Min 44x44px for touch */}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>
      </div>

      {/* Content Wrapper */}
      <div className="p-2.5">
        {/* Title - 2 lines max with ellipsis, with fallback */}
        <h3 className="line-clamp-2 min-h-[32px] text-[13px] font-medium leading-4 text-gray-900">
          {product.title && product.title.trim().length > 2
            ? product.title
            : product.brand
              ? `${product.brand} – Artikel`
              : 'Artikel ohne Titel'}
        </h3>

        {/* Helvenda Schutz Badge + Brand (like Ricardo's ® | Brand) */}
        {(product.paymentProtectionEnabled || product.brand) && (
          <div className="mt-1 flex items-center gap-1 text-[11px]">
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

        {/* Price Block - Different for Auction vs Fixed */}
        {isAuction ? (
          <div className="mt-1.5">
            {/* Current Bid Label */}
            <div className="text-[11px] font-medium text-orange-600">Aktuelles Gebot</div>
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-medium text-gray-600">CHF</span>
              <span className="text-[20px] font-semibold leading-6 text-gray-900">
                {formatCHFCompact(mainPrice)}
              </span>
            </div>
            {/* Bid count + Sofort-Kaufen option */}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
              <span>
                {bidCount} {bidCount === 1 ? 'Gebot' : 'Gebote'}
              </span>
              {hasBuyNowPrice && (
                <>
                  <span>•</span>
                  <span className="text-primary-600">
                    Sofort: {formatCHF(product.buyNowPrice!)}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[12px] font-medium text-gray-600">CHF</span>
            <span className="text-[20px] font-semibold leading-6 text-gray-900">
              {formatCHFCompact(mainPrice)}
            </span>
          </div>
        )}

        {/* Meta Row - "Neu eingestellt" + Location + Delivery */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-gray-500">
          {/* "Neu eingestellt" label (subtle, only for new listings) */}
          {isNewListing && (
            <>
              <span className="font-medium text-primary-600">
                Neu eingestellt{timeSinceCreated ? ` · ${timeSinceCreated}` : ''}
              </span>
              <span className="text-gray-300">•</span>
            </>
          )}

          {/* Location */}
          {(product.city || product.postalCode) && (
            <>
              <span className="inline-flex items-center gap-0.5 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {product.postalCode && product.city
                    ? `${product.postalCode} ${product.city}`
                    : product.postalCode || product.city || ''}
                </span>
              </span>
              <span className="text-gray-300">•</span>
            </>
          )}

          {/* Delivery Info with Cost */}
          <span className="inline-flex shrink-0 items-center gap-0.5">
            {deliveryInfo.pickupOnly ? (
              <>
                <Package className="h-3 w-3" />
                <span>Nur Abholung</span>
              </>
            ) : (
              <>
                <Truck className="h-3 w-3" />
                {deliveryInfo.costLabel ? (
                  <span className={deliveryInfo.costLabel === 'Gratis' ? 'text-green-600' : ''}>
                    {deliveryInfo.costLabel === 'Gratis'
                      ? 'Gratis Versand'
                      : `Versand ${deliveryInfo.costLabel}`}
                  </span>
                ) : (
                  <span>Versand</span>
                )}
              </>
            )}
          </span>
        </div>

        {/* Trust Row - Seller Verified only (Payment Protection shown as Ⓗ badge above) */}
        {product.sellerVerified && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-500">
            <span className="inline-flex items-center gap-0.5 text-blue-600">
              <BadgeCheck className="h-3 w-3" />
              <span className="hidden sm:inline">Verifiziert</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
