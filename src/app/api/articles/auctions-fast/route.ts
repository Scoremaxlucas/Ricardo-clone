import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// FAST AUCTIONS API: Optimierte Route für schnelles Laden von Auktionen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const now = new Date()

    // OPTIMIERT: Versuche Raw SQL, fallback zu Prisma bei Fehler
    let watches: any[] = []

    try {
      // Versuche Raw SQL Query (schneller)
      watches = await prisma.$queryRaw<
        Array<{
          id: string
          title: string | null
          brand: string | null
          model: string | null
          price: number
          images: string | null
          createdAt: Date
          auctionEnd: Date | null
          articleNumber: number | null
          boosters: string | null
          city: string | null
          postalCode: string | null
          condition: string | null
          bidCount: bigint
          highestBid: number | null
        }>
      >`
      SELECT
        w.id,
        w.title,
        w.brand,
        w.model,
        w.price,
        w.images,
        w."createdAt",
        w."auctionEnd",
        w."articleNumber",
        w.boosters,
        u.city,
        u."postalCode",
        w.condition,
        COUNT(b.id)::bigint as "bidCount",
        MAX(b.amount) as "highestBid"
      FROM watches w
      INNER JOIN users u ON w."sellerId" = u.id
      LEFT JOIN bids b ON b."watchId" = w.id
      WHERE
        w."isAuction" = true
        AND (w."moderationStatus" IS NULL OR w."moderationStatus" NOT IN ('rejected', 'blocked', 'removed', 'ended'))
        AND NOT EXISTS (
          SELECT 1 FROM purchases p
          WHERE p."watchId" = w.id
          AND p.status != 'cancelled'
        )
        AND (w."auctionEnd" IS NULL OR w."auctionEnd" > ${now})
      GROUP BY w.id, u.city, u."postalCode"
      ORDER BY
        CASE
          WHEN w.boosters LIKE '%super-boost%' THEN 4
          WHEN w.boosters LIKE '%turbo-boost%' THEN 3
          WHEN w.boosters LIKE '%boost%' THEN 2
          ELSE 1
        END DESC,
        w."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `
    } catch (sqlError) {
      // Fallback zu Prisma Query falls Raw SQL fehlschlägt
      console.warn('Raw SQL failed in auctions-fast, using Prisma fallback:', sqlError)
      const nowDate = new Date()
      // RICARDO-STYLE fallback query
      watches = (await prisma.watch.findMany({
        where: {
          AND: [
            { isAuction: true },
            {
              OR: [
                { moderationStatus: null },
                { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
              ],
            },
            {
              OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }],
            },
            {
              OR: [{ auctionEnd: null }, { auctionEnd: { gt: nowDate } }],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          price: true,
          images: true,
          createdAt: true,
          auctionEnd: true,
          articleNumber: true,
          boosters: true,
          condition: true,
          seller: {
            select: {
              city: true,
              postalCode: true,
            },
          },
          bids: {
            select: {
              id: true,
              amount: true,
            },
            orderBy: { amount: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      })) as any[]

      // Transformiere Prisma-Format zu Raw SQL-Format
      watches = watches.map(w => ({
        ...w,
        city: (w as any).seller?.city || null,
        postalCode: (w as any).seller?.postalCode || null,
        bidCount: BigInt((w as any).bids?.length || 0),
        highestBid: (w as any).bids?.[0]?.amount || null,
      }))
    }

    // OPTIMIERT: Minimale Verarbeitung
    const watchesWithImages = watches.map(w => {
      let firstImage = ''
      if (w.images) {
        try {
          const parsed = typeof w.images === 'string' ? JSON.parse(w.images) : w.images
          firstImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
        } catch {
          firstImage = ''
        }
      }

      let boosters: string[] = []
      if (w.boosters) {
        try {
          boosters = typeof w.boosters === 'string' ? JSON.parse(w.boosters) : w.boosters
        } catch {
          boosters = []
        }
      }

      return {
        id: w.id,
        title: w.title || '',
        brand: w.brand || '',
        model: w.model || '',
        price: w.highestBid || w.price,
        images: firstImage ? [firstImage] : [],
        createdAt:
          w.createdAt instanceof Date
            ? w.createdAt.toISOString()
            : new Date(w.createdAt).toISOString(),
        isAuction: true,
        auctionEnd: w.auctionEnd
          ? w.auctionEnd instanceof Date
            ? w.auctionEnd.toISOString()
            : new Date(w.auctionEnd).toISOString()
          : null,
        articleNumber: w.articleNumber,
        boosters,
        city: w.city,
        postalCode: w.postalCode,
        condition: w.condition || '',
        bidCount: Number(w.bidCount),
        highestBid: w.highestBid,
      }
    })

    return NextResponse.json(
      { watches: watchesWithImages },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching auctions:', error)
    return NextResponse.json({ watches: [] }, { status: 200 })
  }
}
