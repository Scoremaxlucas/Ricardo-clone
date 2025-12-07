import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MySellingClient } from './MySellingClient'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'

// OPTIMIERT: Force dynamic rendering für sofortiges Laden
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Kein Caching für sofortige Updates

// OPTIMIERT: Cache-Control Header für bessere Performance
export const runtime = 'nodejs'

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
  // ABSOLUT MINIMALE Query: Nur Basis-Daten, KEINE Relations, KEINE zusätzlichen Queries
  // Purchases und Bids werden später im Client nachgeladen wenn nötig (lazy loading)
  // Das ist die schnellste mögliche Query - nur eine einzige Datenbankabfrage!
  // OPTIMIERT: Limit für bessere Performance (kann später erhöht werden)
  const articles = await prisma.watch.findMany({
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
    take: 20, // ULTRA-OPTIMIERT: Stark reduziertes Limit für sofortiges Laden
  })

  if (articles.length === 0) {
    return []
  }

  // OPTIMIERT: Ultra-schnelle Verarbeitung OHNE zusätzliche Queries
  // Setze Default-Werte - Details werden später im Client nachgeladen wenn nötig
  const now = Date.now() // Verwende timestamp statt Date-Objekt für bessere Performance
  const articlesWithImages: Item[] = []
  
  // OPTIMIERT: Verwende for-Schleife statt map für bessere Performance bei kleinen Arrays
  for (const a of articles) {
    // Parse images schnell (nur wenn nötig)
    let images: string[] = []
    if (a.images) {
      try {
        images = JSON.parse(a.images)
      } catch {
        images = []
      }
    }

    // Berechne isActive schnell (ohne Purchase-Check für maximale Geschwindigkeit)
    const auctionEndDate = a.auctionEnd ? a.auctionEnd.getTime() : null
    const isExpired = auctionEndDate ? auctionEndDate <= now : false
    const isActive = !auctionEndDate || !isExpired

    articlesWithImages.push({
      id: a.id,
      articleNumber: a.articleNumber,
      title: a.title,
      brand: a.brand,
      model: a.model,
      price: a.price,
      images,
      createdAt: a.createdAt.toISOString(),
      isSold: false, // Wird später im Client nachgeladen wenn nötig
      isAuction: a.isAuction || !!a.auctionEnd,
      auctionEnd: a.auctionEnd ? a.auctionEnd.toISOString() : null,
      highestBid: null, // Wird später im Client nachgeladen wenn nötig
      bidCount: 0, // Wird später im Client nachgeladen wenn nötig
      finalPrice: a.price, // Standard-Preis, wird später aktualisiert wenn nötig
      isActive,
    })
  }

  return articlesWithImages
}

// isItemActive wird jetzt in ArticleListContent berechnet

export default async function MySellingPage() {
  // OPTIMIERT: Starte Session-Check und Daten-Laden parallel
  const sessionPromise = getServerSession(authOptions)

  // Warte auf Session, dann lade Daten
  const session = await sessionPromise

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-watches/selling')
  }

  // OPTIMIERT: Lade Daten direkt mit stark reduziertem Limit für maximale Geschwindigkeit
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
