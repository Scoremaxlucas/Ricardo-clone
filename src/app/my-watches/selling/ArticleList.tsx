import { Suspense } from 'react'
import { MySellingClient } from './MySellingClient'

interface Item {
  id: string
  articleNumber: number | null
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  isSold: boolean
  isAuction: boolean
  auctionEnd: string | null
  highestBid: {
    amount: number
    createdAt: string
  } | null
  bidCount: number
  finalPrice: number
  isActive?: boolean
}

interface ArticleListProps {
  itemsPromise: Promise<Item[]>
}

async function ArticleListContent({ itemsPromise }: ArticleListProps) {
  const items = await itemsPromise
  
  const isItemActive = (item: Item): boolean => {
    if (item.isActive !== undefined) {
      return item.isActive
    }
    if (item.isSold) return false
    if (item.isAuction && item.auctionEnd) {
      const auctionEndDate = new Date(item.auctionEnd)
      const now = new Date()
      if (auctionEndDate <= now) {
        return false
      }
    }
    return true
  }

  const activeCount = items.filter(item => isItemActive(item)).length
  const inactiveCount = items.length - activeCount

  const stats = {
    total: items.length,
    active: activeCount,
    inactive: inactiveCount,
  }

  return <MySellingClient initialItems={items} initialStats={stats} />
}

function ArticleListSkeleton() {
  return (
    <>
      {/* Statistik-Karten Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                <div className="h-8 w-16 animate-pulse rounded bg-gray-300"></div>
              </div>
              <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Artikel-Liste Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="flex flex-col md:flex-row">
              <div className="h-48 w-full animate-pulse bg-gray-200 md:w-48"></div>
              <div className="flex-1 p-6">
                <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-300"></div>
                <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                <div className="h-6 w-24 animate-pulse rounded bg-gray-300"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function ArticleList({ itemsPromise }: ArticleListProps) {
  return (
    <Suspense fallback={<ArticleListSkeleton />}>
      <ArticleListContent itemsPromise={itemsPromise} />
    </Suspense>
  )
}

