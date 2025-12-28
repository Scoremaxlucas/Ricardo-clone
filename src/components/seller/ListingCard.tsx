'use client'

import { Clock, Copy, Edit, Eye, Gavel, Package, ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'

export type ListingStatus = 'active' | 'ended' | 'sold'

export interface ListingCardProps {
  id: string
  articleNumber: number | null
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  auctionEnd: string | null
  isAuction: boolean
  status: ListingStatus
  bidCount: number
  highestBid: number | null
  purchaseId?: string | null // For sold items - links to sale details
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

const statusConfig = {
  active: {
    label: 'Aktiv',
    className: 'bg-green-100 text-green-700',
  },
  ended: {
    label: 'Beendet',
    className: 'bg-amber-100 text-amber-700',
  },
  sold: {
    label: 'Verkauft',
    className: 'bg-blue-100 text-blue-700',
  },
}

export function ListingCard({
  id,
  articleNumber,
  title,
  brand,
  model,
  price,
  images,
  createdAt,
  auctionEnd,
  isAuction,
  status,
  bidCount,
  highestBid,
  purchaseId,
  onDelete,
  onDuplicate,
}: ListingCardProps) {
  const mainImage = images[0] || null
  // Für interne Navigation: Verwende CUID (zuverlässiger als Artikelnummer)
  // Die Produktseite kann beides auflösen
  const articleUrl = `/products/${id}`
  const displayPrice = highestBid || price
  
  // For sold items, link to sale details page
  const saleUrl = purchaseId ? `/my-watches/selling/sold#${purchaseId}` : articleUrl

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  const getTimeRemaining = () => {
    if (!auctionEnd) return null
    const end = new Date(auctionEnd)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Beendet'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}T ${hours}h`
    if (hours > 0) return `${hours}h`
    return 'Endet bald'
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Image Container - 4:3 aspect ratio for compact look */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {mainImage ? (
          <Link href={status === 'sold' ? saleUrl : articleUrl}>
            <img
              src={mainImage}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </Link>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute left-1.5 top-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig[status].className}`}
          >
            {statusConfig[status].label}
          </span>
        </div>

        {/* Auction Badge */}
        {isAuction && status === 'active' && (
          <div className="absolute right-1.5 top-1.5">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Gavel className="h-2.5 w-2.5" />
              {getTimeRemaining()}
            </span>
          </div>
        )}

        {/* Quick Actions - Visible on hover */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {status === 'sold' ? (
            // Sold items: Show sale details
            <Link
              href={saleUrl}
              className="rounded-full bg-white p-2 text-gray-700 transition-colors hover:bg-gray-100"
              aria-label="Verkaufsdetails"
            >
              <ShoppingBag className="h-4 w-4" />
            </Link>
          ) : (
            // Active/Ended items: Show view and edit
            <>
              <Link
                href={articleUrl}
                className="rounded-full bg-white p-2 text-gray-700 transition-colors hover:bg-gray-100"
                aria-label="Ansehen"
              >
                <Eye className="h-4 w-4" />
              </Link>
              <Link
                href={`/my-watches/edit/${id}`}
                className="rounded-full bg-white p-2 text-gray-700 transition-colors hover:bg-gray-100"
                aria-label="Bearbeiten"
              >
                <Edit className="h-4 w-4" />
              </Link>
            </>
          )}
          {/* Delete button for non-sold items */}
          {status !== 'sold' && (
            <button
              onClick={() => onDelete(id)}
              className="rounded-full bg-white p-2 text-red-600 transition-colors hover:bg-red-50"
              aria-label="Löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {/* Duplicate button for ended items */}
          {status === 'ended' && (
            <button
              onClick={() => onDuplicate(id)}
              className="rounded-full bg-white p-2 text-primary-600 transition-colors hover:bg-primary-50"
              aria-label="Erneut anbieten"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content - Compact */}
      <div className="p-2">
        {/* Title */}
        <Link href={status === 'sold' ? saleUrl : articleUrl}>
          <h3 className="line-clamp-1 text-xs font-semibold text-gray-900 transition-colors hover:text-primary-600">
            {title}
          </h3>
        </Link>

        {/* Brand/Model */}
        <p className="line-clamp-1 text-[10px] text-gray-500">
          {brand} {model}
        </p>

        {/* Price */}
        <div className="mt-1">
          <p className="text-sm font-bold text-gray-900">
            CHF {displayPrice.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
          </p>
          {isAuction && bidCount > 0 && (
            <p className="text-[10px] text-gray-500">
              {bidCount} {bidCount === 1 ? 'Gebot' : 'Gebote'}
            </p>
          )}
        </div>

        {/* Footer - Date info */}
        <div className="mt-1.5 flex items-center gap-1 border-t border-gray-100 pt-1.5 text-[10px] text-gray-400">
          <Clock className="h-2.5 w-2.5" />
          <span>
            {articleNumber && `#${articleNumber} · `}
            {formatDate(createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
