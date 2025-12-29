'use client'

import { ProductCard as BaseProductCard, ProductCardData } from '@/components/product/ProductCard'

interface ProductCardProps extends Partial<ProductCardData> {
  favorites?: Set<string>
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void
  showCondition?: boolean
  showBuyNowButton?: boolean
  showViewButton?: boolean
  viewButtonText?: string
  variant?: 'default' | 'compact' | 'list'
  className?: string
  // Support both old API (spread props) and new API (product prop)
  product?: ProductCardData
}

export const ProductCard = function ProductCard(props: ProductCardProps) {
  const {
    product: productProp,
    favorites,
    onFavoriteToggle,
    showCondition,
    showBuyNowButton,
    showViewButton,
    viewButtonText,
    variant,
    className,
    ...restProps
  } = props

  // If product prop is provided, use it directly
  // Otherwise, construct from individual props (backward compatibility)
  const product: ProductCardData = productProp || {
    id: restProps.id || '',
    title: restProps.title || '',
    price: restProps.price || 0,
    images: restProps.images || [],
    brand: restProps.brand,
    model: restProps.model,
    condition: restProps.condition,
    city: restProps.city,
    postalCode: restProps.postalCode,
    auctionEnd: restProps.auctionEnd,
    buyNowPrice: restProps.buyNowPrice,
    isAuction: restProps.isAuction,
    bids: restProps.bids,
    boosters: restProps.boosters, // Visibility boost, NOT sponsorship
    isSponsored: restProps.isSponsored, // TRUE paid placement
    currentBid: restProps.currentBid,
    href: restProps.href,
    paymentProtectionEnabled: restProps.paymentProtectionEnabled,
    createdAt: restProps.createdAt,
    shippingMethods: restProps.shippingMethods,
    // Enhanced fields
    shippingMinCost: restProps.shippingMinCost,
    sellerVerified: restProps.sellerVerified,
  }

  return (
    <BaseProductCard
      product={product}
      variant={variant}
      showCondition={showCondition}
      showBuyNowButton={showBuyNowButton}
      onFavoriteToggle={onFavoriteToggle}
      className={className}
    />
  )
}
