'use client'

import { memo } from 'react'
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
}

export const ProductCard = memo(function ProductCard(props: ProductCardProps) {
  const {
    favorites,
    onFavoriteToggle,
    showCondition,
    showBuyNowButton,
    showViewButton,
    viewButtonText,
    variant,
    className,
    ...productProps
  } = props

  // Ensure required fields have defaults
  const product: ProductCardData = {
    id: productProps.id || '',
    title: productProps.title || '',
    price: productProps.price || 0,
    images: productProps.images || [],
    brand: productProps.brand,
    model: productProps.model,
    condition: productProps.condition,
    city: productProps.city,
    postalCode: productProps.postalCode,
    auctionEnd: productProps.auctionEnd,
    buyNowPrice: productProps.buyNowPrice,
    isAuction: productProps.isAuction,
    bids: productProps.bids,
    boosters: productProps.boosters,
    currentBid: productProps.currentBid,
    href: productProps.href,
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
})
