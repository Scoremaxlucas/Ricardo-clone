/**
 * Advanced Listings Search Service
 *
 * Uses PostgreSQL Full-Text Search (FTS) + pg_trgm for:
 * - Fast, relevant search results
 * - Fuzzy matching for typos (bal -> ball)
 * - Synonym expansion (fussball -> soccer, football)
 * - Weighted ranking (title > category > description)
 *
 * ============================================================================
 * VISIBILITY FILTER DOCUMENTATION
 * ============================================================================
 *
 * A listing is visible in public search if ALL of these conditions are met:
 *
 * 1. moderationStatus IS NULL OR moderationStatus != 'rejected'
 *    - 'pending', 'approved', 'reviewing', or NULL are all visible
 *    - Only 'rejected' is hidden
 *
 * 2. NOT SOLD - No active (non-cancelled) purchase exists
 *    - purchases: { none: {} } OR purchases: { every: { status: 'cancelled' } }
 *    - Once a purchase is completed (status != 'cancelled'), listing is hidden
 *
 * 3. AUCTION NOT EXPIRED (for auction listings)
 *    - auctionEnd IS NULL (not an auction) OR auctionEnd > NOW
 *    - Expired auctions without a purchase are hidden
 *
 * IMPORTANT: There is NO "isActive" or "isPublished" flag check!
 * Listings become visible immediately upon creation if they meet the above.
 *
 * Compare with Seller Dashboard (/api/seller/listings):
 * - Shows ALL listings for sellerId regardless of sold/expired status
 * - Only excludes moderationStatus = 'rejected'
 *
 * ============================================================================
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { expandQuery, normalizeQuery } from './search-synonyms-enhanced'

// Types
export interface SearchFilters {
  category?: string
  subcategory?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  brand?: string
  isAuction?: boolean | null
  postalCode?: string
  sellerId?: string
}

export interface SearchSort {
  field: 'relevance' | 'price' | 'createdAt' | 'auctionEnd' | 'bids'
  direction: 'asc' | 'desc'
}

export interface SearchOptions {
  query?: string
  filters?: SearchFilters
  sort?: SearchSort
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: string
  title: string
  description: string | null
  brand: string
  model: string
  price: number
  buyNowPrice: number | null
  condition: string
  year: number | null
  images: string[]
  boosters: string[]
  isAuction: boolean
  auctionEnd: Date | null
  auctionStart: Date | null
  createdAt: Date
  sellerId: string
  seller: {
    city: string | null
    postalCode: string | null
  } | null
  bids: Array<{ id: string; amount: number }>
  categorySlugs: string[]
  // Search metadata
  score?: number
  ftsRank?: number
  trigramSimilarity?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  limit: number
  offset: number
}

/**
 * Main search function using PostgreSQL FTS + Trigram
 */
export async function searchListings(options: SearchOptions): Promise<SearchResponse> {
  const {
    query,
    filters = {},
    sort = { field: 'relevance', direction: 'desc' },
    limit = 20,
    offset = 0,
  } = options

  const now = new Date()

  // If no query, use simple Prisma query with filters
  if (!query || query.trim().length === 0) {
    return searchWithoutQuery(filters, sort, limit, offset, now)
  }

  // Expand query with synonyms
  const { ftsQuery, plainQuery, tokens } = expandQuery(query.trim())
  const normalizedQuery = normalizeQuery(query.trim())

  // Build the raw SQL query for FTS + Trigram
  const searchResults = await executeSearchQuery({
    ftsQuery,
    plainQuery,
    normalizedQuery,
    tokens,
    filters,
    sort,
    limit,
    offset,
    now,
  })

  return searchResults
}

/**
 * Execute the main search query with FTS and Trigram
 */
async function executeSearchQuery(params: {
  ftsQuery: string
  plainQuery: string
  normalizedQuery: string
  tokens: string[]
  filters: SearchFilters
  sort: SearchSort
  limit: number
  offset: number
  now: Date
}): Promise<SearchResponse> {
  const { ftsQuery, plainQuery, normalizedQuery, tokens, filters, sort, limit, offset, now } =
    params

  // Build WHERE conditions
  const conditions: string[] = []
  const parameters: any[] = []
  let paramIndex = 1

  // Base conditions: not rejected, not sold
  conditions.push(`(w."moderationStatus" IS NULL OR w."moderationStatus" != 'rejected')`)

  // Not sold condition (no purchases or all cancelled)
  conditions.push(`(
    NOT EXISTS (
      SELECT 1 FROM purchases p
      WHERE p."watchId" = w.id AND p.status != 'cancelled'
    )
  )`)

  // Exclude ended auctions without purchase
  conditions.push(`(
    w."auctionEnd" IS NULL
    OR w."auctionEnd" > $${paramIndex}
    OR EXISTS (
      SELECT 1 FROM purchases p
      WHERE p."watchId" = w.id AND p.status != 'cancelled'
    )
  )`)
  parameters.push(now)
  paramIndex++

  // Filter: Category
  if (filters.category) {
    conditions.push(`(
      EXISTS (
        SELECT 1 FROM watch_categories wc
        JOIN categories c ON c.id = wc."categoryId"
        WHERE wc."watchId" = w.id
        AND (lower(c.slug) = lower($${paramIndex}) OR lower(c.name) = lower($${paramIndex}))
      )
      OR lower(w.title) LIKE '%' || lower($${paramIndex}) || '%'
      OR lower(w.brand) LIKE '%' || lower($${paramIndex}) || '%'
    )`)
    parameters.push(filters.category)
    paramIndex++
  }

  // Filter: Price range
  if (filters.minPrice !== undefined) {
    conditions.push(`w.price >= $${paramIndex}`)
    parameters.push(filters.minPrice)
    paramIndex++
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`w.price <= $${paramIndex}`)
    parameters.push(filters.maxPrice)
    paramIndex++
  }

  // Filter: Condition
  if (filters.condition) {
    conditions.push(`w.condition = $${paramIndex}`)
    parameters.push(filters.condition)
    paramIndex++
  }

  // Filter: Brand
  if (filters.brand) {
    conditions.push(`lower(w.brand) = lower($${paramIndex})`)
    parameters.push(filters.brand)
    paramIndex++
  }

  // Filter: Auction
  if (filters.isAuction === true) {
    conditions.push(`w."isAuction" = true AND w."auctionEnd" > $${paramIndex}`)
    parameters.push(now)
    paramIndex++
  } else if (filters.isAuction === false) {
    conditions.push(`w."isAuction" = false`)
  }

  // Filter: Postal code
  if (filters.postalCode) {
    conditions.push(`(
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = w."sellerId"
        AND u."postalCode" LIKE $${paramIndex} || '%'
      )
    )`)
    parameters.push(filters.postalCode)
    paramIndex++
  }

  // Store the FTS and trigram query parameters
  const ftsQueryParamIndex = paramIndex
  parameters.push(ftsQuery)
  paramIndex++

  const plainQueryParamIndex = paramIndex
  parameters.push(plainQuery)
  paramIndex++

  const normalizedQueryParamIndex = paramIndex
  parameters.push(normalizedQuery)
  paramIndex++

  // Build the main search condition with FTS and Trigram
  // This is the core of the semantic search
  // Note: searchText column not yet deployed, using CONCAT of title, brand, model, description
  const searchableText = `CONCAT(coalesce(w.title, ''), ' ', coalesce(w.brand, ''), ' ', coalesce(w.model, ''), ' ', coalesce(w.description, ''))`
  const searchCondition = `(
    -- Full-text search match
    to_tsvector('german', unaccent(${searchableText})) @@
    websearch_to_tsquery('german', unaccent($${ftsQueryParamIndex}))

    OR

    -- Trigram similarity match (for typos)
    similarity(unaccent(lower(${searchableText})), unaccent(lower($${plainQueryParamIndex}))) > 0.15

    OR

    -- Direct contains match on key fields (fallback)
    lower(w.title) LIKE '%' || lower($${normalizedQueryParamIndex}) || '%'
    OR lower(w.brand) LIKE '%' || lower($${normalizedQueryParamIndex}) || '%'
    OR lower(w.model) LIKE '%' || lower($${normalizedQueryParamIndex}) || '%'
  )`

  conditions.push(searchCondition)

  // Build ORDER BY clause
  let orderByClause: string

  // Calculate relevance score
  const scoreExpression = `(
    -- FTS rank (weighted heavily)
    COALESCE(ts_rank_cd(
      to_tsvector('german', unaccent(${searchableText})),
      websearch_to_tsquery('german', unaccent($${ftsQueryParamIndex}))
    ), 0) * 10.0
    +
    -- Trigram similarity
    COALESCE(similarity(
      unaccent(lower(${searchableText})),
      unaccent(lower($${plainQueryParamIndex}))
    ), 0) * 2.0
    +
    -- Title match bonus
    CASE WHEN lower(w.title) LIKE '%' || lower($${normalizedQueryParamIndex}) || '%' THEN 5.0 ELSE 0 END
    +
    -- Brand match bonus
    CASE WHEN lower(w.brand) LIKE '%' || lower($${normalizedQueryParamIndex}) || '%' THEN 3.0 ELSE 0 END
    +
    -- Booster bonus (only after relevance is established)
    CASE
      WHEN w.boosters LIKE '%super-boost%' THEN 1000.0
      WHEN w.boosters LIKE '%turbo-boost%' THEN 500.0
      WHEN w.boosters LIKE '%boost%' THEN 200.0
      ELSE 0
    END
  )`

  switch (sort.field) {
    case 'relevance':
      orderByClause = `${scoreExpression} DESC, w."createdAt" DESC`
      break
    case 'price':
      orderByClause =
        sort.direction === 'asc'
          ? 'w.price ASC, w."createdAt" DESC'
          : 'w.price DESC, w."createdAt" DESC'
      break
    case 'createdAt':
      orderByClause = sort.direction === 'asc' ? 'w."createdAt" ASC' : 'w."createdAt" DESC'
      break
    case 'auctionEnd':
      orderByClause = 'w."auctionEnd" ASC NULLS LAST, w."createdAt" DESC'
      break
    case 'bids':
      orderByClause =
        '(SELECT COUNT(*) FROM bids b WHERE b."watchId" = w.id) DESC, w."createdAt" DESC'
      break
    default:
      orderByClause = `${scoreExpression} DESC, w."createdAt" DESC`
  }

  // Build the final query
  const whereClause = conditions.join(' AND ')

  // Add pagination parameters
  const limitParamIndex = paramIndex
  parameters.push(limit)
  paramIndex++

  const offsetParamIndex = paramIndex
  parameters.push(offset)
  paramIndex++

  const sqlQuery = `
    SELECT
      w.id,
      w.title,
      w.description,
      w.brand,
      w.model,
      w.price,
      w."buyNowPrice",
      w.condition,
      w.year,
      w.images,
      w.boosters,
      w."isAuction",
      w."auctionEnd",
      w."auctionStart",
      w."createdAt",
      w."sellerId",
      ${scoreExpression} as score,
      ts_rank_cd(
        to_tsvector('german', unaccent(${searchableText})),
        websearch_to_tsquery('german', unaccent($${ftsQueryParamIndex}))
      ) as fts_rank,
      similarity(
        unaccent(lower(${searchableText})),
        unaccent(lower($${plainQueryParamIndex}))
      ) as trigram_sim
    FROM watches w
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $${limitParamIndex}
    OFFSET $${offsetParamIndex}
  `

  // Execute main query
  const rawResults = await prisma.$queryRawUnsafe<any[]>(sqlQuery, ...parameters)

  // Execute count query (without LIMIT/OFFSET)
  const countQuery = `
    SELECT COUNT(*) as total
    FROM watches w
    WHERE ${whereClause}
  `
  const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
    countQuery,
    ...parameters.slice(0, -2) // Remove limit and offset params
  )
  const total = Number(countResult[0]?.total || 0)

  // Get additional data (seller, categories, bids) for results
  const watchIds = rawResults.map(r => r.id)

  if (watchIds.length === 0) {
    return { results: [], total: 0, limit, offset }
  }

  // Fetch related data in parallel
  const [sellers, categories, bids] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: rawResults.map(r => r.sellerId) } },
      select: { id: true, city: true, postalCode: true },
    }),
    prisma.watchCategory.findMany({
      where: { watchId: { in: watchIds } },
      include: { category: { select: { slug: true, name: true } } },
    }),
    prisma.bid.findMany({
      where: { watchId: { in: watchIds } },
      select: { id: true, watchId: true, amount: true },
      orderBy: { amount: 'desc' },
    }),
  ])

  // Build lookup maps
  const sellerMap = new Map(sellers.map(s => [s.id, s]))
  const categoryMap = new Map<string, string[]>()
  for (const wc of categories) {
    const existing = categoryMap.get(wc.watchId) || []
    existing.push(wc.category.slug)
    categoryMap.set(wc.watchId, existing)
  }
  const bidMap = new Map<string, Array<{ id: string; amount: number }>>()
  for (const b of bids) {
    const existing = bidMap.get(b.watchId) || []
    existing.push({ id: b.id, amount: b.amount })
    bidMap.set(b.watchId, existing)
  }

  // Transform results
  const results: SearchResult[] = rawResults.map(r => {
    // Parse JSON fields
    let images: string[] = []
    let boosters: string[] = []

    try {
      if (r.images) {
        images = typeof r.images === 'string' ? JSON.parse(r.images) : r.images
      }
    } catch {
      images = []
    }

    try {
      if (r.boosters) {
        boosters = typeof r.boosters === 'string' ? JSON.parse(r.boosters) : r.boosters
      }
    } catch {
      boosters = []
    }

    const seller = sellerMap.get(r.sellerId)
    const watchBids = bidMap.get(r.id) || []

    // Calculate current price (highest bid or base price)
    const highestBid = watchBids[0]
    const currentPrice = highestBid ? highestBid.amount : r.price

    return {
      id: r.id,
      title: r.title || '',
      description: r.description || null,
      brand: r.brand || '',
      model: r.model || '',
      price: currentPrice,
      buyNowPrice: r.buyNowPrice,
      condition: r.condition || '',
      year: r.year,
      images,
      boosters,
      isAuction: r.isAuction || false,
      auctionEnd: r.auctionEnd,
      auctionStart: r.auctionStart,
      createdAt: r.createdAt,
      sellerId: r.sellerId,
      seller: seller ? { city: seller.city, postalCode: seller.postalCode } : null,
      bids: watchBids,
      categorySlugs: categoryMap.get(r.id) || [],
      score: r.score,
      ftsRank: r.fts_rank,
      trigramSimilarity: r.trigram_sim,
    }
  })

  return { results, total, limit, offset }
}

/**
 * Search without query (filter-only mode)
 */
async function searchWithoutQuery(
  filters: SearchFilters,
  sort: SearchSort,
  limit: number,
  offset: number,
  now: Date
): Promise<SearchResponse> {
  // Build Prisma where clause
  const where: Prisma.WatchWhereInput = {
    AND: [
      // Not rejected
      {
        OR: [{ moderationStatus: null }, { moderationStatus: { not: 'rejected' } }],
      },
      // Not sold
      {
        OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }],
      },
      // Exclude ended auctions
      {
        OR: [{ auctionEnd: null }, { auctionEnd: { gt: now } }],
      },
    ],
  }

  // Add filters
  if (filters.category) {
    ;(where.AND as any[]).push({
      categories: {
        some: {
          category: {
            OR: [
              { slug: filters.category.toLowerCase() },
              { name: { contains: filters.category, mode: 'insensitive' } },
            ],
          },
        },
      },
    })
  }

  if (filters.minPrice !== undefined) {
    ;(where.AND as any[]).push({ price: { gte: filters.minPrice } })
  }
  if (filters.maxPrice !== undefined) {
    ;(where.AND as any[]).push({ price: { lte: filters.maxPrice } })
  }

  if (filters.condition) {
    ;(where.AND as any[]).push({ condition: filters.condition })
  }

  if (filters.brand) {
    ;(where.AND as any[]).push({ brand: { equals: filters.brand, mode: 'insensitive' } })
  }

  if (filters.isAuction === true) {
    ;(where.AND as any[]).push({ isAuction: true, auctionEnd: { gt: now } })
  } else if (filters.isAuction === false) {
    ;(where.AND as any[]).push({ isAuction: false })
  }

  if (filters.postalCode) {
    ;(where.AND as any[]).push({
      seller: { postalCode: { startsWith: filters.postalCode } },
    })
  }

  // Build orderBy
  let orderBy: Prisma.WatchOrderByWithRelationInput | Prisma.WatchOrderByWithRelationInput[]

  switch (sort.field) {
    case 'price':
      orderBy = [{ price: sort.direction }, { createdAt: 'desc' }]
      break
    case 'createdAt':
      orderBy = { createdAt: sort.direction }
      break
    case 'auctionEnd':
      orderBy = [{ auctionEnd: 'asc' }, { createdAt: 'desc' }]
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  // Execute query
  const [watches, total] = await Promise.all([
    prisma.watch.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        seller: { select: { id: true, city: true, postalCode: true } },
        categories: { include: { category: { select: { slug: true, name: true } } } },
        bids: { select: { id: true, amount: true }, orderBy: { amount: 'desc' } },
      },
    }),
    prisma.watch.count({ where }),
  ])

  // Transform results
  const results: SearchResult[] = watches.map(w => {
    let images: string[] = []
    let boosters: string[] = []

    try {
      if (w.images) images = JSON.parse(w.images)
    } catch {
      images = []
    }

    try {
      if (w.boosters) boosters = JSON.parse(w.boosters)
    } catch {
      boosters = []
    }

    const highestBid = w.bids[0]
    const currentPrice = highestBid ? highestBid.amount : w.price

    return {
      id: w.id,
      title: w.title,
      description: w.description,
      brand: w.brand,
      model: w.model,
      price: currentPrice,
      buyNowPrice: w.buyNowPrice,
      condition: w.condition,
      year: w.year,
      images,
      boosters,
      isAuction: w.isAuction,
      auctionEnd: w.auctionEnd,
      auctionStart: w.auctionStart,
      createdAt: w.createdAt,
      sellerId: w.sellerId,
      seller: w.seller ? { city: w.seller.city, postalCode: w.seller.postalCode } : null,
      bids: w.bids.map(b => ({ id: b.id, amount: b.amount })),
      categorySlugs: w.categories.map(c => c.category.slug),
    }
  })

  return { results, total, limit, offset }
}

/**
 * Get brand counts for filter UI
 */
export async function getBrandCounts(
  query?: string,
  category?: string
): Promise<Array<{ brand: string; count: number }>> {
  const now = new Date()

  const where: Prisma.WatchWhereInput = {
    AND: [
      { OR: [{ moderationStatus: null }, { moderationStatus: { not: 'rejected' } }] },
      { OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }] },
      { OR: [{ auctionEnd: null }, { auctionEnd: { gt: now } }] },
    ],
  }

  if (query) {
    const expandedQuery = expandQuery(query)
    const searchTokens: string[] = expandedQuery.tokens
    ;(where.AND as any[]).push({
      OR: searchTokens.slice(0, 10).map((t: string) => ({
        OR: [
          { title: { contains: t, mode: 'insensitive' } },
          { brand: { contains: t, mode: 'insensitive' } },
          { model: { contains: t, mode: 'insensitive' } },
          { description: { contains: t, mode: 'insensitive' } },
        ],
      })),
    })
  }

  if (category) {
    ;(where.AND as any[]).push({
      categories: {
        some: {
          category: {
            OR: [
              { slug: category.toLowerCase() },
              { name: { contains: category, mode: 'insensitive' } },
            ],
          },
        },
      },
    })
  }

  const brands = await prisma.watch.groupBy({
    by: ['brand'],
    where,
    _count: { brand: true },
    orderBy: { _count: { brand: 'desc' } },
    take: 50,
  })

  return brands
    .filter(b => b.brand && b.brand.trim())
    .map(b => ({ brand: b.brand, count: b._count.brand }))
}
