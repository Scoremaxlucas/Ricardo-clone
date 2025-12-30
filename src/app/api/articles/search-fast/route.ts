import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// FAST SEARCH API: Optimierte Such-Route für schnelles Laden
// Verwendet Raw SQL für maximale Performance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const isAuction = searchParams.get('isAuction')

    const now = new Date()

    // OPTIMIERT: Baue WHERE-Klausel dynamisch mit serverseitiger Filterung
    // RICARDO-STYLE: Exclude blocked, removed, ended (not just rejected)
    let whereConditions = [
      `(w."moderationStatus" IS NULL OR w."moderationStatus" NOT IN ('rejected', 'blocked', 'removed', 'ended'))`,
      `NOT EXISTS (SELECT 1 FROM purchases p WHERE p."watchId" = w.id AND p.status != 'cancelled')`,
      `(w."auctionEnd" IS NULL OR w."auctionEnd" > $1 OR EXISTS (SELECT 1 FROM purchases p2 WHERE p2."watchId" = w.id AND p2.status != 'cancelled'))`,
    ]

    const params: any[] = [now]

    // OPTIMIERT: Preis-Filter serverseitig
    if (minPrice) {
      whereConditions.push(`w.price >= $${params.length + 1}`)
      params.push(parseFloat(minPrice))
    }

    if (maxPrice) {
      whereConditions.push(`w.price <= $${params.length + 1}`)
      params.push(parseFloat(maxPrice))
    }

    if (query) {
      // OPTIMIERT: Suche auch in description für bessere Trefferquote
      whereConditions.push(
        `(w.title ILIKE $${params.length + 1} OR w.brand ILIKE $${params.length + 1} OR w.model ILIKE $${params.length + 1} OR w.description ILIKE $${params.length + 1})`
      )
      params.push(`%${query}%`)
    }

    if (category) {
      whereConditions.push(
        `EXISTS (SELECT 1 FROM watch_categories wc INNER JOIN categories c ON wc."categoryId" = c.id WHERE wc."watchId" = w.id AND (c.slug = $${params.length + 1} OR c.name = $${params.length + 1}))`
      )
      params.push(category)
    }

    if (minPrice) {
      whereConditions.push(`w.price >= $${params.length + 1}`)
      params.push(parseFloat(minPrice))
    }

    if (maxPrice) {
      whereConditions.push(`w.price <= $${params.length + 1}`)
      params.push(parseFloat(maxPrice))
    }

    if (isAuction === 'true') {
      whereConditions.push(`w."isAuction" = true`)
    } else if (isAuction === 'false') {
      whereConditions.push(`(w."isAuction" = false OR w."isAuction" IS NULL)`)
    }

    const whereClause = whereConditions.join(' AND ')

    // OPTIMIERT: Versuche Raw SQL, fallback zu Prisma bei Fehler
    let watches: any[] = []

    try {
      // Versuche Raw SQL Query (schneller)
      watches = await prisma.$queryRawUnsafe<
        Array<{
          id: string
          title: string | null
          brand: string | null
          model: string | null
          price: number
          buyNowPrice: number | null
          images: string | null
          createdAt: Date
          isAuction: boolean | null
          auctionEnd: Date | null
          articleNumber: number | null
          boosters: string | null
          city: string | null
          postalCode: string | null
          condition: string | null
        }>
      >(
        `
      SELECT
        w.id,
        w.title,
        w.brand,
        w.model,
        w.price,
        w."buyNowPrice",
        w.images,
        w."createdAt",
        w."isAuction",
        w."auctionEnd",
        w."articleNumber",
        w.boosters,
        u.city,
        u."postalCode",
        w.condition
      FROM watches w
      INNER JOIN users u ON w."sellerId" = u.id
      WHERE ${whereClause}
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
    `,
        ...params
      )
    } catch (sqlError) {
      // Fallback zu Prisma Query falls Raw SQL fehlschlägt
      console.warn('Raw SQL failed in search-fast, using Prisma fallback:', sqlError)
      // RICARDO-STYLE fallback query
      const nowDate = new Date()
      const where: any = {
        AND: [
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
            OR: [
              { auctionEnd: null },
              { auctionEnd: { gt: nowDate } },
              {
                AND: [
                  { auctionEnd: { lte: nowDate } },
                  { purchases: { some: { status: { not: 'cancelled' } } } },
                ],
              },
            ],
          },
        ],
      }

      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
        ]
      }

      if (category) {
        where.categories = {
          some: {
            category: {
              OR: [{ slug: category }, { name: category }],
            },
          },
        }
      }

      if (minPrice) {
        where.price = { ...where.price, gte: parseFloat(minPrice) }
      }

      if (maxPrice) {
        where.price = { ...where.price, lte: parseFloat(maxPrice) }
      }

      if (isAuction === 'true') {
        where.isAuction = true
      } else if (isAuction === 'false') {
        where.isAuction = false
      }

      watches = (await prisma.watch.findMany({
        where,
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          price: true,
          buyNowPrice: true,
          images: true,
          createdAt: true,
          isAuction: true,
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
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200), // OPTIMIERT: Max 200 Ergebnisse
        skip: skip,
      })) as any[]

      // Transformiere Prisma-Format zu Raw SQL-Format
      watches = watches.map(w => ({
        ...w,
        city: (w as any).seller?.city || null,
        postalCode: (w as any).seller?.postalCode || null,
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
        price: w.price,
        buyNowPrice: w.buyNowPrice,
        images: firstImage ? [firstImage] : [],
        createdAt:
          w.createdAt instanceof Date
            ? w.createdAt.toISOString()
            : new Date(w.createdAt).toISOString(),
        isAuction: !!w.isAuction || !!w.auctionEnd,
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
    console.error('Error searching articles:', error)
    return NextResponse.json({ watches: [] }, { status: 200 })
  }
}
