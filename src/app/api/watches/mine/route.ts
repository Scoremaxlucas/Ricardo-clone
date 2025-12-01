import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ watches: [] }, { status: 200 })
    }

    // Query-Parameter für Filterung
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const search = searchParams.get('search') || ''

    // Basis-Where-Klausel
    const whereClause: any = { sellerId: session.user.id }

    // Baue AND-Array für komplexe Filter
    const andConditions: any[] = []

    // Suche nach Artikelnummer, Titel, Marke oder Modell
    if (search.trim()) {
      const searchTerm = search.trim()

      // Prüfe ob es eine Artikelnummer ist (numerisch)
      const isNumericArticleNumber = /^\d{6,10}$/.test(searchTerm)

      if (isNumericArticleNumber) {
        // Suche nach Artikelnummer
        whereClause.articleNumber = parseInt(searchTerm)
      } else {
        // Suche nach Titel, Marke oder Modell
        // SQLite ist standardmäßig case-insensitive, daher kein 'mode: insensitive' nötig
        whereClause.OR = [
          { title: { contains: searchTerm } },
          { brand: { contains: searchTerm } },
          { model: { contains: searchTerm } },
        ]
      }
    }

    // Wenn activeOnly=true, filtere nur nicht-verkaufte Watches
    if (activeOnly) {
      const now = new Date()
      andConditions.push(
        {
          purchases: {
            none: {
              status: {
                not: 'cancelled',
              },
            },
          },
        },
        {
          OR: [
            // Keine Auktion (Sofortkauf)
            { auctionEnd: null },
            // Oder Auktion noch nicht abgelaufen
            { auctionEnd: { gt: now } },
            // Oder Auktion abgelaufen, aber bereits ein Purchase vorhanden
            {
              AND: [
                { auctionEnd: { lte: now } },
                {
                  purchases: {
                    some: {
                      status: {
                        not: 'cancelled',
                      },
                    },
                  },
                },
              ],
            },
          ],
        }
      )
    }

    // Füge AND-Bedingungen hinzu, wenn vorhanden
    if (andConditions.length > 0) {
      if (whereClause.AND) {
        whereClause.AND = [...whereClause.AND, ...andConditions]
      } else {
        whereClause.AND = andConditions
      }
    }

    const watches = await prisma.watch.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            city: true,
            postalCode: true,
          },
        },
        purchases: {
          // WICHTIG: Lade ALLE Purchases, um korrekt zu prüfen ob es nicht-stornierte gibt
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                street: true,
                streetNumber: true,
                postalCode: true,
                city: true,
                phone: true,
                paymentMethods: true,
              },
            },
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1, // Höchstes Gebot für finalPrice
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const watchesWithImages = watches.map(w => {
      const images = w.images ? JSON.parse(w.images) : []
      // Nur nicht-stornierte Purchases zählen als "verkauft"
      const activePurchases = w.purchases.filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0
      const buyer = isSold ? activePurchases[0].buyer : null

      // Parse boosters
      let boosters: string[] = []
      if (w.boosters) {
        try {
          boosters = JSON.parse(w.boosters)
        } catch (e) {
          if (w.boosters !== 'none' && w.boosters) {
            boosters = [w.boosters]
          }
        }
      }

      // Bestimme finalPrice: höchstes Gebot oder Purchase-Preis oder Startpreis
      let finalPrice = w.price // Fallback zum Startpreis
      const highestBid = w.bids?.[0] // Höchstes Gebot

      if (isSold) {
        finalPrice = highestBid?.amount || activePurchases[0].price || w.price
      } else if (highestBid) {
        // Wenn noch nicht verkauft, aber Gebote vorhanden: zeige höchstes Gebot
        finalPrice = highestBid.amount
      }

      // Bestimme ob Artikel aktiv ist
      // Artikel ist aktiv wenn:
      // 1. Nicht verkauft (keine nicht-stornierten Purchases) - isSold = false
      // 2. UND (keine Auktion ODER Auktion noch nicht abgelaufen ODER alle Purchases wurden storniert)
      // WICHTIG: Wenn alle Purchases storniert wurden (isSold = false), ist der Artikel wieder aktiv!
      const now = new Date()
      const auctionEndDate = w.auctionEnd ? new Date(w.auctionEnd) : null
      const isExpired = auctionEndDate ? auctionEndDate <= now : false

      // Prüfe ob es überhaupt Purchases gibt (auch stornierte)
      const hasAnyPurchases = w.purchases.length > 0

      // Artikel ist aktiv wenn:
      // - Nicht verkauft (isSold = false bedeutet alle Purchases sind storniert oder es gibt keine)
      // - UND (keine Auktion ODER Auktion noch nicht abgelaufen ODER alle Purchases wurden storniert)
      //
      // Vereinfachte Logik:
      // 1. Wenn verkauft (isSold = true) -> inaktiv
      // 2. Wenn nicht verkauft UND keine Auktion -> aktiv
      // 3. Wenn nicht verkauft UND Auktion noch nicht abgelaufen -> aktiv
      // 4. Wenn nicht verkauft UND Auktion abgelaufen UND alle Purchases storniert -> aktiv
      // 5. Wenn nicht verkauft UND Auktion abgelaufen UND keine Purchases -> inaktiv
      //
      // Formel: !isSold && (!auctionEndDate || !isExpired || hasAnyPurchases)
      //
      // Logik:
      // - Wenn keine Auktion: !auctionEndDate = true → aktiv (wenn nicht verkauft)
      // - Wenn Auktion noch nicht abgelaufen: !isExpired = true → aktiv (wenn nicht verkauft)
      // - Wenn Auktion abgelaufen aber alle Purchases storniert: hasAnyPurchases = true → aktiv (wenn nicht verkauft)
      // - Wenn Auktion abgelaufen und keine Purchases: alle Bedingungen false → inaktiv
      const isActive = !isSold && (!auctionEndDate || !isExpired || hasAnyPurchases)

      return {
        ...w,
        images,
        isSold,
        buyer,
        finalPrice,
        highestBid: highestBid
          ? {
              amount: highestBid.amount,
              createdAt: highestBid.createdAt,
            }
          : null,
        bidCount: w.bids.length,
        boosters,
        articleNumber: w.articleNumber, // Stelle sicher dass articleNumber zurückgegeben wird
        isActive, // WICHTIG: Gib isActive zurück, damit Frontend es verwenden kann
        isAuction: w.isAuction || !!w.auctionEnd, // Stelle sicher dass isAuction zurückgegeben wird
        auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null, // Konvertiere zu ISO String für Frontend
        city: w.seller?.city || null, // Füge city vom Seller hinzu
        postalCode: w.seller?.postalCode || null, // Füge postalCode vom Seller hinzu
      }
    })

    return NextResponse.json({ watches: watchesWithImages })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Fehler beim Laden Ihrer Artikel: ' + error.message },
      { status: 500 }
    )
  }
}
