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
  // ULTRA-OPTIMIERT: Eine einzige optimierte Query mit minimalen Daten
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
      // Nur erste nicht-stornierte Purchase für isSold-Check
      purchases: {
        where: {
          status: { not: 'cancelled' },
        },
        select: {
          id: true,
          price: true,
        },
        take: 1,
      },
      // Nur höchstes Gebot
      bids: {
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { amount: 'desc' },
        take: 1,
      },
      // Counts für Statistiken
      _count: {
        select: {
          purchases: true,
          bids: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // ULTRA-OPTIMIERT: Schnelle Verarbeitung
  const now = new Date()
  const watchesWithImages = watches.map(w => {
    // Parse images schnell
    let images: string[] = []
    try {
      images = w.images ? JSON.parse(w.images) : []
    } catch {
      images = []
    }

    // Schnelle Prüfung ob verkauft
    const isSold = w.purchases.length > 0
    const bidCount = w._count?.bids || 0
    const highestBid = w.bids?.[0] || null

    // Berechne finalPrice schnell
    let finalPrice = w.price
    if (isSold && w.purchases[0]) {
      finalPrice = highestBid?.amount || w.purchases[0].price || w.price
    } else if (highestBid) {
      finalPrice = highestBid.amount
    }

    // Berechne isActive schnell
    const auctionEndDate = w.auctionEnd ? new Date(w.auctionEnd) : null
    const isExpired = auctionEndDate ? auctionEndDate <= now : false
    const hasAnyPurchases = (w._count?.purchases || 0) > 0
    const isActive = !isSold && (!auctionEndDate || !isExpired || hasAnyPurchases)

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
      highestBid: highestBid
        ? {
            amount: highestBid.amount,
            createdAt: highestBid.createdAt.toISOString(),
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
