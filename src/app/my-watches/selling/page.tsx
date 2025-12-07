import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArticleList } from './ArticleList'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'

// OPTIMIERT: Force dynamic rendering für sofortiges Laden
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Kein Caching für sofortige Updates

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

async function loadItems(userId: string): Promise<Item[]> {
  // ULTRA-OPTIMIERT: Lade nur Basis-Daten, alles andere separat für maximale Performance
  const watches = await prisma.watch.findMany({
    where: { sellerId: userId },
    select: {
      id: true,
      title: true,
      brand: true,
      model: true,
      price: true,
      images: true,
      createdAt: true,
      isAuction: true,
      auctionEnd: true,
      articleNumber: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (watches.length === 0) {
    return []
  }

  const watchIds = watches.map(w => w.id)

  // OPTIMIERT: Lade Purchases und Bids parallel für alle Watches auf einmal
  const [purchases, bids, bidCounts] = await Promise.all([
    // Nur nicht-stornierte Purchases für isSold-Check
    prisma.purchase.findMany({
      where: {
        watchId: { in: watchIds },
        status: { not: 'cancelled' },
      },
      select: {
        watchId: true,
        price: true,
      },
    }),
    // Höchste Gebote pro Watch
    prisma.bid.findMany({
      where: {
        watchId: { in: watchIds },
      },
      select: {
        watchId: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { amount: 'desc' },
      // Verwende distinct in der Verarbeitung statt in der Query
    }),
    // Bid-Counts
    prisma.bid.groupBy({
      by: ['watchId'],
      where: {
        watchId: { in: watchIds },
      },
      _count: true,
    }),
  ])

  // Erstelle Lookup-Maps für O(1) Zugriff
  const purchaseMap = new Map<string, { price: number }>()
  purchases.forEach(p => {
    if (!purchaseMap.has(p.watchId)) {
      purchaseMap.set(p.watchId, { price: p.price || 0 })
    }
  })

  const highestBidMap = new Map<string, { amount: number; createdAt: Date }>()
  bids.forEach(b => {
    if (!highestBidMap.has(b.watchId) || highestBidMap.get(b.watchId)!.amount < b.amount) {
      highestBidMap.set(b.watchId, { amount: b.amount, createdAt: b.createdAt })
    }
  })

  const bidCountMap = new Map(bidCounts.map(b => [b.watchId, b._count]))

  // ULTRA-OPTIMIERT: Schnelle Verarbeitung mit Lookup-Maps
  const now = new Date()
  const watchesWithImages = watches.map(w => {
    // Parse images schnell
    let images: string[] = []
    try {
      images = w.images ? JSON.parse(w.images) : []
    } catch {
      images = []
    }

    // Schnelle Prüfung ob verkauft aus Map
    const purchase = purchaseMap.get(w.id)
    const isSold = !!purchase
    const bidCount = bidCountMap.get(w.id) || 0
    const highestBidData = highestBidMap.get(w.id)

    // Berechne finalPrice schnell
    let finalPrice = w.price
    if (isSold && purchase) {
      finalPrice = highestBidData?.amount || purchase.price || w.price
    } else if (highestBidData) {
      finalPrice = highestBidData.amount
    }

    // Berechne isActive schnell
    const auctionEndDate = w.auctionEnd ? new Date(w.auctionEnd) : null
    const isExpired = auctionEndDate ? auctionEndDate <= now : false
    const isActive = !isSold && (!auctionEndDate || !isExpired)

    return {
      id: w.id,
      articleNumber: w.articleNumber,
      title: w.title,
      brand: w.brand,
      model: w.model,
      price: w.price,
      images,
      createdAt: w.createdAt.toISOString(),
      isSold,
      isAuction: w.isAuction || !!w.auctionEnd,
      auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
      highestBid: highestBidData
        ? {
            amount: highestBidData.amount,
            createdAt: highestBidData.createdAt.toISOString(),
          }
        : null,
      bidCount,
      finalPrice,
      isActive,
    }
  })

  return watchesWithImages
}

// isItemActive wird jetzt in ArticleListContent berechnet

export default async function MySellingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-watches/selling')
  }

  // OPTIMIERT: Starte Daten-Laden als Promise für Streaming
  // Die Seite wird sofort gerendert, während Daten im Hintergrund geladen werden
  const itemsPromise = loadItems(session.user.id)

  // Prüfe abgelaufene Auktionen im Hintergrund (nicht-blockierend)
  if (typeof fetch !== 'undefined') {
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/auctions/check-expired`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Ignoriere Fehler, da dies nicht kritisch ist
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4 text-sm text-gray-600">
            <Link href="/my-watches" className="text-primary-600 hover:text-primary-700">
              Mein Verkaufen
            </Link>
            <span className="mx-2">›</span>
            <span>Mein Verkaufen</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mein Verkaufen</h1>
                <p className="mt-1 text-gray-600">Verwalten Sie Ihre Verkaufsanzeigen</p>
              </div>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Artikel anbieten
            </Link>
          </div>

          {/* Streaming: Artikel werden geladen während Seite bereits gerendert wird */}
          <ArticleList itemsPromise={itemsPromise} />
        </div>
      </div>
      <Footer />
    </div>
  )
}
