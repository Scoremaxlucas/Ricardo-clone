import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/export-data
 *
 * Exportiert alle persönlichen Daten eines Nutzers (DSGVO Art. 20)
 * - Profildaten
 * - Käufe
 * - Verkäufe
 * - Nachrichten
 * - Favoriten
 * - Bewertungen
 * - Suchaufträge
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Hole alle Nutzerdaten
    const [
      user,
      addresses,
      purchases,
      sales,
      watches,
      favorites,
      reviewsGiven,
      reviewsReceived,
      searchSubscriptions,
      messages,
      bids,
      priceOffers,
    ] = await Promise.all([
      // Profildaten
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          nickname: true,
          bio: true,
          phone: true,
          dateOfBirth: true,
          nationality: true,
          companyName: true,
          accountType: true,
          verified: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
        },
      }),

      // Adressen
      prisma.userAddress.findMany({
        where: { userId },
        select: {
          type: true,
          street: true,
          streetNumber: true,
          postalCode: true,
          city: true,
          country: true,
          addresszusatz: true,
          kanton: true,
          isDefault: true,
          createdAt: true,
        },
      }),

      // Käufe
      prisma.purchase.findMany({
        where: { buyerId: userId },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          shippingCost: true,
          createdAt: true,
          updatedAt: true,
          watch: {
            select: {
              title: true,
              brand: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Verkäufe
      prisma.sale.findMany({
        where: { sellerId: userId },
        select: {
          id: true,
          price: true,
          status: true,
          createdAt: true,
          watch: {
            select: {
              title: true,
              brand: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Eigene Angebote
      prisma.watch.findMany({
        where: { sellerId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          brand: true,
          model: true,
          price: true,
          status: true,
          condition: true,
          isAuction: true,
          startPrice: true,
          buyNowPrice: true,
          auctionEnd: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Favoriten
      prisma.favorite.findMany({
        where: { userId },
        select: {
          createdAt: true,
          watch: {
            select: {
              title: true,
              brand: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Gegebene Bewertungen
      prisma.review.findMany({
        where: { reviewerId: userId },
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          reviewedUser: {
            select: {
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Erhaltene Bewertungen
      prisma.review.findMany({
        where: { reviewedUserId: userId },
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: {
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Suchaufträge
      prisma.searchSubscription.findMany({
        where: { userId },
        select: {
          name: true,
          query: true,
          filters: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Nachrichten
      prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: {
          content: true,
          createdAt: true,
          sender: {
            select: { nickname: true },
          },
          receiver: {
            select: { nickname: true },
          },
          watch: {
            select: { title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit für Performance
      }),

      // Gebote
      prisma.bid.findMany({
        where: { userId },
        select: {
          amount: true,
          createdAt: true,
          watch: {
            select: {
              title: true,
              brand: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Preisvorschläge
      prisma.priceOffer.findMany({
        where: { buyerId: userId },
        select: {
          price: true,
          status: true,
          message: true,
          createdAt: true,
          watch: {
            select: {
              title: true,
              brand: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Strukturiere Export-Daten
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      platform: 'Helvenda.ch',

      profile: {
        ...user,
        // Entferne sensible interne Felder
        password: undefined,
      },

      addresses: addresses.map((addr) => ({
        type: addr.type,
        street: addr.street,
        streetNumber: addr.streetNumber,
        postalCode: addr.postalCode,
        city: addr.city,
        country: addr.country,
        additionalInfo: addr.addresszusatz,
        canton: addr.kanton,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
      })),

      purchases: purchases.map((p) => ({
        id: p.id,
        item: p.watch?.title || 'Unbekannt',
        brand: p.watch?.brand,
        totalPrice: p.totalPrice,
        shippingCost: p.shippingCost,
        status: p.status,
        createdAt: p.createdAt,
      })),

      sales: sales.map((s) => ({
        id: s.id,
        item: s.watch?.title || 'Unbekannt',
        brand: s.watch?.brand,
        price: s.price,
        status: s.status,
        createdAt: s.createdAt,
      })),

      listings: watches.map((w) => ({
        id: w.id,
        title: w.title,
        description: w.description,
        brand: w.brand,
        model: w.model,
        price: w.price,
        condition: w.condition,
        isAuction: w.isAuction,
        startPrice: w.startPrice,
        buyNowPrice: w.buyNowPrice,
        auctionEnd: w.auctionEnd,
        status: w.status,
        createdAt: w.createdAt,
      })),

      favorites: favorites.map((f) => ({
        item: f.watch?.title || 'Unbekannt',
        brand: f.watch?.brand,
        addedAt: f.createdAt,
      })),

      reviewsGiven: reviewsGiven.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        forUser: r.reviewedUser?.nickname,
        createdAt: r.createdAt,
      })),

      reviewsReceived: reviewsReceived.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        fromUser: r.reviewer?.nickname,
        createdAt: r.createdAt,
      })),

      searchSubscriptions: searchSubscriptions.map((s) => ({
        name: s.name,
        query: s.query,
        filters: s.filters,
        isActive: s.isActive,
        createdAt: s.createdAt,
      })),

      messages: messages.map((m) => ({
        content: m.content,
        from: m.sender?.nickname,
        to: m.receiver?.nickname,
        regarding: m.watch?.title,
        sentAt: m.createdAt,
      })),

      bids: bids.map((b) => ({
        amount: b.amount,
        item: b.watch?.title,
        brand: b.watch?.brand,
        createdAt: b.createdAt,
      })),

      priceOffers: priceOffers.map((o) => ({
        price: o.price,
        status: o.status,
        message: o.message,
        item: o.watch?.title,
        brand: o.watch?.brand,
        createdAt: o.createdAt,
      })),
    }

    // Generiere Dateiname
    const date = new Date().toISOString().split('T')[0]
    const filename = `helvenda-datenexport-${date}.json`

    // Sende als Download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[export-data] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Exportieren Ihrer Daten' },
      { status: 500 }
    )
  }
}
