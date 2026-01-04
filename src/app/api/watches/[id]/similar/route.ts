import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * RICARDO-LEVEL: Similar Articles API
 *
 * Returns similar listings based on:
 * 1. Same category/subcategory
 * 2. Same or similar brand
 * 3. Similar price range (±30%)
 * 4. Similar condition
 * 5. Full-text similarity with title/description
 */

export const dynamic = 'force-dynamic'

interface SimilarWatch {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice: number | null
  images: string
  condition: string
  isAuction: boolean
  auctionEnd: Date | null
  createdAt: Date
  sellerId: string
  seller: {
    city: string | null
    postalCode: string | null
  } | null
  similarityScore: number
  similarityReason: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10), 20)

    // Get the source watch
    const sourceWatch = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        condition: true,
        sellerId: true,
        categories: {
          select: {
            category: {
              select: { slug: true },
            },
          },
        },
      },
    })

    if (!sourceWatch) {
      return NextResponse.json({ error: 'Watch not found', similar: [] }, { status: 404 })
    }

    // Get category slugs
    const categorySlugs = sourceWatch.categories
      .map(c => c.category?.slug)
      .filter(Boolean) as string[]
    const subcategorySlugs: string[] = [] // WatchCategory doesn't have subcategory, removed

    // Calculate price range (±30%)
    const minPrice = sourceWatch.price * 0.7
    const maxPrice = sourceWatch.price * 1.3

    // Build similarity query using PostgreSQL
    const similarWatches = await prisma.$queryRaw<SimilarWatch[]>`
      WITH source AS (
        SELECT
          ${sourceWatch.id} as id,
          ${sourceWatch.title || ''} as title,
          ${sourceWatch.brand || ''} as brand,
          ${sourceWatch.price} as price
      ),
      candidates AS (
        SELECT
          w.id,
          w.title,
          w.brand,
          w.model,
          w.price,
          w."buyNowPrice",
          w.images,
          w.condition,
          w."isAuction",
          w."auctionEnd",
          w."createdAt",
          w."sellerId",
          -- Calculate similarity score based on multiple factors
          (
            -- Same brand: +40 points
            CASE WHEN lower(w.brand) = lower(${sourceWatch.brand || ''}) THEN 40 ELSE 0 END
            +
            -- Similar price (within 20%): +30 points
            CASE
              WHEN w.price BETWEEN ${sourceWatch.price * 0.8} AND ${sourceWatch.price * 1.2} THEN 30
              WHEN w.price BETWEEN ${minPrice} AND ${maxPrice} THEN 15
              ELSE 0
            END
            +
            -- Same condition: +15 points
            CASE WHEN w.condition = ${sourceWatch.condition || ''} THEN 15 ELSE 0 END
            +
            -- Title similarity using trigram
            COALESCE(similarity(lower(w.title), lower(${sourceWatch.title || ''})) * 15, 0)
          ) as similarity_score,
          -- Determine primary similarity reason
          CASE
            WHEN lower(w.brand) = lower(${sourceWatch.brand || ''}) THEN 'Gleiche Marke'
            WHEN w.price BETWEEN ${sourceWatch.price * 0.8} AND ${sourceWatch.price * 1.2} THEN 'Ähnlicher Preis'
            WHEN w.condition = ${sourceWatch.condition || ''} THEN 'Gleicher Zustand'
            ELSE 'Ähnliches Produkt'
          END as similarity_reason
        FROM watches w
        WHERE
          -- Exclude the source watch
          w.id != ${sourceWatch.id}
          -- Exclude same seller
          AND w."sellerId" != ${sourceWatch.sellerId}
          -- Only approved/visible items
          AND (w."moderationStatus" IS NULL OR w."moderationStatus" NOT IN ('rejected', 'blocked', 'removed', 'ended'))
          -- Not sold
          AND NOT EXISTS (
            SELECT 1 FROM purchases p
            WHERE p."watchId" = w.id AND p.status != 'cancelled'
          )
          -- Auction not expired (if applicable)
          AND (
            w."auctionEnd" IS NULL
            OR w."auctionEnd" > NOW()
          )
          -- At least some relevance: same brand OR similar price OR in same category
          AND (
            lower(w.brand) = lower(${sourceWatch.brand || ''})
            OR w.price BETWEEN ${minPrice} AND ${maxPrice}
            OR EXISTS (
              SELECT 1 FROM watch_categories wc
              JOIN categories c ON c.id = wc."categoryId"
              WHERE wc."watchId" = w.id
              AND c.slug = ANY(${categorySlugs}::text[])
            )
          )
      )
      SELECT
        c.id,
        c.title,
        c.brand,
        c.model,
        c.price,
        c."buyNowPrice",
        c.images,
        c.condition,
        c."isAuction",
        c."auctionEnd",
        c."createdAt",
        c."sellerId",
        c.similarity_score as "similarityScore",
        c.similarity_reason as "similarityReason"
      FROM candidates c
      WHERE c.similarity_score > 10  -- Minimum relevance threshold
      ORDER BY c.similarity_score DESC, c."createdAt" DESC
      LIMIT ${limit}
    `

    // Get seller info
    const sellerIds = Array.from(new Set(similarWatches.map(w => w.sellerId)))
    const sellers = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: {
        id: true,
        city: true,
        postalCode: true,
      },
    })
    const sellerMap = new Map(sellers.map(s => [s.id, s]))

    // Format response
    const formattedSimilar = similarWatches.map(w => {
      const seller = sellerMap.get(w.sellerId)
      let images: string[] = []
      try {
        images = typeof w.images === 'string' ? JSON.parse(w.images) : w.images || []
      } catch {
        images = []
      }

      return {
        id: w.id,
        title: w.title,
        brand: w.brand,
        model: w.model,
        price: Number(w.price),
        buyNowPrice: w.buyNowPrice ? Number(w.buyNowPrice) : null,
        images,
        condition: w.condition,
        isAuction: w.isAuction,
        auctionEnd: w.auctionEnd,
        createdAt: w.createdAt,
        sellerId: w.sellerId,
        seller: seller
          ? {
              city: seller.city,
              postalCode: seller.postalCode,
            }
          : null,
        similarityScore: Number(w.similarityScore),
        similarityReason: w.similarityReason,
      }
    })

    return NextResponse.json({
      similar: formattedSimilar,
      sourceWatch: {
        id: sourceWatch.id,
        title: sourceWatch.title,
        brand: sourceWatch.brand,
        price: sourceWatch.price,
      },
    })
  } catch (error) {
    console.error('[SIMILAR] Error finding similar watches:', error)
    return NextResponse.json(
      { error: 'Failed to find similar watches', similar: [] },
      { status: 500 }
    )
  }
}
