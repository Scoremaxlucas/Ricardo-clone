'use client'

import { ListingCard, ListingCardProps } from './ListingCard'
import { Package, Plus } from 'lucide-react'
import Link from 'next/link'
import { TabType } from './ListingsTabs'

interface ListingsGridProps {
  listings: Omit<ListingCardProps, 'onDelete' | 'onDuplicate'>[]
  loading: boolean
  activeTab: TabType
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

// Loading Skeleton for cards
function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="p-3">
        <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  )
}

// Empty state messages per tab
const emptyStates: Record<
  TabType,
  { title: string; description: string; showCTA: boolean; ctaText?: string }
> = {
  active: {
    title: 'Keine aktiven Angebote',
    description: 'Sie haben derzeit keine aktiven Verkaufsanzeigen.',
    showCTA: true,
    ctaText: 'Ersten Artikel anbieten',
  },
  drafts: {
    title: 'Keine Entwürfe',
    description: 'Sie haben keine gespeicherten Entwürfe.',
    showCTA: true,
    ctaText: 'Neue Anzeige erstellen',
  },
  archive: {
    title: 'Archiv ist leer',
    description: 'Hier erscheinen beendete Angebote, die nicht verkauft wurden.',
    showCTA: false,
  },
  sold: {
    title: 'Noch keine Verkäufe',
    description: 'Ihre verkauften Artikel werden hier angezeigt.',
    showCTA: true,
    ctaText: 'Artikel anbieten',
  },
}

export function ListingsGrid({
  listings,
  loading,
  activeTab,
  onDelete,
  onDuplicate,
}: ListingsGridProps) {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state
  if (listings.length === 0) {
    const empty = emptyStates[activeTab]
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16">
        <Package className="mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{empty.title}</h3>
        <p className="mb-6 max-w-sm text-center text-gray-500">{empty.description}</p>
        {empty.showCTA && (
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            {empty.ctaText}
          </Link>
        )}
      </div>
    )
  }

  // Grid of cards
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map(listing => (
        <ListingCard
          key={listing.id}
          {...listing}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  )
}
