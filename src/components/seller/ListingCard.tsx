'use client'

import { getArticleUrl } from '@/lib/article-url'
import { Clock, Copy, Edit, Eye, Gavel, MoreVertical, Package, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

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
  onDelete,
  onDuplicate,
}: ListingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const mainImage = images[0] || null
  const articleUrl = getArticleUrl({ id, articleNumber })
  const displayPrice = highestBid || price

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
          <Link href={articleUrl}>
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
          <Link
            href={articleUrl}
            className="rounded-full bg-white p-2 text-gray-700 transition-colors hover:bg-gray-100"
            aria-label="Ansehen"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {status !== 'sold' && (
            <Link
              href={`/my-watches/edit/${id}`}
              className="rounded-full bg-white p-2 text-gray-700 transition-colors hover:bg-gray-100"
              aria-label="Bearbeiten"
            >
              <Edit className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Content - Compact */}
      <div className="p-2">
        {/* Title */}
        <Link href={articleUrl}>
          <h3 className="line-clamp-1 text-xs font-semibold text-gray-900 transition-colors hover:text-primary-600">
            {title}
          </h3>
        </Link>

        {/* Brand/Model - hidden on very small cards */}
        <p className="line-clamp-1 text-[10px] text-gray-500">
          {brand} {model}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">
              CHF {displayPrice.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
            </p>
            {isAuction && bidCount > 0 && (
              <p className="text-[10px] text-gray-500">
                {bidCount} {bidCount === 1 ? 'Gebot' : 'Gebote'}
              </p>
            )}
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Mehr Optionen"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <Link
                    href={articleUrl}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Eye className="h-4 w-4" />
                    Ansehen
                  </Link>

                  {status !== 'sold' && (
                    <Link
                      href={`/my-watches/edit/${id}`}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Edit className="h-4 w-4" />
                      Bearbeiten
                    </Link>
                  )}

                  {status === 'ended' && (
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        onDuplicate(id)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                      Erneut anbieten
                    </button>
                  )}

                  {status !== 'sold' && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          onDelete(id)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
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
