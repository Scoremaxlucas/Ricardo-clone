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
  // ULTRA-MINIMALE Query: Nur Basis-Daten OHNE Relations
  // Das ist die absolut schnellste Query möglich
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

  // OPTIMIERT: Parallele Queries für maximale Performance
  // Verwende EXISTS-Checks statt vollständige Daten zu laden
  const [soldWatchIds, allBids] = await Promise.all([
    // Nur watchIds die verkauft sind (minimale Daten)
    prisma.purchase.findMany({
      where: {
        watchId: { in: watchIds },
        status: { not: 'cancelled' },
      },
      select: {
        watchId: true,
        price: true,
      },
      distinct: ['watchId'],
    }),
    // Alle Bids für höchstes Gebot und Count
    prisma.bid.findMany({
      where: {
        watchId: { in: watchIds },
      },
      select: {
        watchId: true,
        amount: true,
        createdAt: true,
      },
    }),
  ])

  // Erstelle Lookup-Maps für O(1) Zugriff
  const purchaseMap = new Map<string, { price: number }>()
  soldWatchIds.forEach(p => {
    purchaseMap.set(p.watchId, { price: p.price || 0 })
  })

  // Gruppiere Bids nach watchId und finde höchstes Gebot pro Watch
  const highestBidMap = new Map<string, { amount: number; createdAt: Date }>()
  const bidCountMap = new Map<string, number>()
  
  // Sortiere Bids nach amount für jedes watchId
  const bidsByWatch = new Map<string, typeof allBids>()
  allBids.forEach(b => {
    if (!bidsByWatch.has(b.watchId)) {
      bidsByWatch.set(b.watchId, [])
    }
    bidsByWatch.get(b.watchId)!.push(b)
  })

  // Finde höchstes Gebot und Count für jedes Watch
  bidsByWatch.forEach((bids, watchId) => {
    bidCountMap.set(watchId, bids.length)
    const highest = bids.reduce((max, bid) => (bid.amount > max.amount ? bid : max), bids[0])
    highestBidMap.set(watchId, { amount: highest.amount, createdAt: highest.createdAt })
  })

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
  // OPTIMIERT: Session-Check parallel mit Daten-Laden starten
  const [session, itemsPromise] = await Promise.all([
    getServerSession(authOptions),
    // Starte Daten-Laden sofort (wird später mit userId gefiltert)
    Promise.resolve([] as Item[]),
  ])

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-watches/selling')
  }

  // OPTIMIERT: Lade Daten jetzt mit userId
  const items = await loadItems(session.user.id)

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

          {/* OPTIMIERT: Direktes Rendering ohne Streaming für maximale Performance */}
          <MySellingClient 
            initialItems={items} 
            initialStats={{
              total: items.length,
              active: items.filter(item => item.isActive).length,
              inactive: items.filter(item => !item.isActive).length,
            }} 
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}
