import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// FAST API: Optimierte Route für schnelles Laden von Artikeln
// Verwendet Raw SQL für maximale Performance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const now = new Date()

    // OPTIMIERT: Raw SQL Query für maximale Geschwindigkeit
    // Lädt nur die wichtigsten Felder ohne Relations
    const watches = await prisma.$queryRaw<Array<{
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
    }>>`
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
      WHERE 
        (w."moderationStatus" IS NULL OR w."moderationStatus" != 'rejected')
        AND NOT EXISTS (
          SELECT 1 FROM purchases p 
          WHERE p."watchId" = w.id 
          AND p.status != 'cancelled'
        )
        AND (
          w."auctionEnd" IS NULL 
          OR w."auctionEnd" > ${now}
          OR EXISTS (
            SELECT 1 FROM purchases p2 
            WHERE p2."watchId" = w.id 
            AND p2.status != 'cancelled'
          )
        )
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
        createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : new Date(w.createdAt).toISOString(),
        isAuction: !!w.isAuction || !!w.auctionEnd,
        auctionEnd: w.auctionEnd ? (w.auctionEnd instanceof Date ? w.auctionEnd.toISOString() : new Date(w.auctionEnd).toISOString()) : null,
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
    console.error('Error fetching articles:', error)
    return NextResponse.json({ watches: [] }, { status: 200 })
  }
}

