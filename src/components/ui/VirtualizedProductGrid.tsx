'use client'

import React from 'react'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductItem } from '@/lib/products'

interface VirtualizedProductGridProps {
  products: ProductItem[]
  favorites?: Set<string>
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void
  columnCount?: number
  itemHeight?: number
  containerHeight?: number
  className?: string
}

/**
 * Virtualized Product Grid Component
 * 
 * Optimized grid layout for product lists with responsive columns.
 * Virtual scrolling can be added later if needed for 1000+ items.
 */
export function VirtualizedProductGrid({
  products,
  favorites,
  onFavoriteToggle,
  columnCount = 5,
  itemHeight = 400,
  containerHeight = 800,
  className = '',
}: VirtualizedProductGridProps) {
  // Calculate responsive column count based on container width
  const [actualColumnCount, setActualColumnCount] = React.useState(columnCount)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateColumnCount = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        if (width < 640) {
          setActualColumnCount(2) // Mobile: 2 columns
        } else if (width < 1024) {
          setActualColumnCount(3) // Tablet: 3 columns
        } else if (width < 1280) {
          setActualColumnCount(4) // Desktop: 4 columns
        } else {
          setActualColumnCount(5) // Large: 5 columns
        }
      }
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  if (products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Keine Produkte gefunden
      </div>
    )
  }

  // Optimized grid layout - virtual scrolling can be added later if needed for 1000+ items
  return (
    <div ref={containerRef} className={`grid gap-4 ${className}`} style={{
      gridTemplateColumns: `repeat(${actualColumnCount}, minmax(0, 1fr))`,
    }}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          brand={product.brand}
          model={product.model}
          price={product.price}
          buyNowPrice={product.buyNowPrice ?? undefined}
          isAuction={product.isAuction}
          auctionEnd={product.auctionEnd ?? undefined}
          images={product.images || []}
          condition={product.condition}
          city={product.city ?? undefined}
          postalCode={product.postalCode ?? undefined}
          boosters={product.boosters}
          href={product.href}
          showCondition={true}
          favorites={favorites}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  )
}
