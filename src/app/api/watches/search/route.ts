import { shouldShowDetailedErrors } from "@/lib/env"
import { searchListings, type SearchFilters, type SearchSort } from '@/lib/search'
import { NextRequest, NextResponse } from 'next/server'

/**
 * CRITICAL: Force dynamic rendering to ensure fresh data
 * Without this, Next.js might cache route responses and newly published
 * listings won't appear in search results immediately.
 *
 * Required for <= 5 second visibility guarantee after publish.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Advanced Search API using PostgreSQL Full-Text Search + Trigram
 *
 * Features:
 * - Full-text search with German language support
 * - Fuzzy matching for typos (ball, bal, baal all work)
 * - Synonym expansion (fussball finds soccer, football, etc.)
 * - Relevance ranking with weighted fields
 * - Filter support (category, price, condition, brand, auction, location)
 * - Pagination (limit/offset)
 *
 * Query Parameters:
 * - q: Search query (optional)
 * - category: Category slug (optional)
 * - subcategory: Subcategory slug (optional)
 * - minPrice: Minimum price (optional)
 * - maxPrice: Maximum price (optional)
 * - condition: Condition filter (optional)
 * - brand: Brand filter (optional)
 * - isAuction: true/false (optional)
 * - postalCode: Postal code prefix (optional)
 * - sortBy: relevance|price-low|price-high|newest|ending|bids (default: relevance)
 * - limit: Results per page (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const query = searchParams.get('q') || undefined
    const category = searchParams.get('category') || undefined
    const subcategory = searchParams.get('subcategory') || undefined
    const minPriceStr = searchParams.get('minPrice')
    const maxPriceStr = searchParams.get('maxPrice')
    const condition = searchParams.get('condition') || undefined
    const brand = searchParams.get('brand') || undefined
    const isAuctionStr = searchParams.get('isAuction')
    const postalCode = searchParams.get('postalCode') || undefined
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const limitStr = searchParams.get('limit')
    const offsetStr = searchParams.get('offset')

    // Parse numeric values
    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined
    const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 100)
    const offset = Math.max(parseInt(offsetStr || '0', 10) || 0, 0)

    // Parse boolean
    let isAuction: boolean | null = null
    if (isAuctionStr === 'true') isAuction = true
    else if (isAuctionStr === 'false') isAuction = false

    // Build filters
    const filters: SearchFilters = {}
    if (category) filters.category = category
    if (subcategory) filters.subcategory = subcategory
    if (minPrice !== undefined && !isNaN(minPrice)) filters.minPrice = minPrice
    if (maxPrice !== undefined && !isNaN(maxPrice)) filters.maxPrice = maxPrice
    if (condition) filters.condition = condition
    if (brand) filters.brand = brand
    if (isAuction !== null) filters.isAuction = isAuction
    if (postalCode) filters.postalCode = postalCode

    // Build sort
    let sort: SearchSort = { field: 'relevance', direction: 'desc' }
    switch (sortBy) {
      case 'price-low':
        sort = { field: 'price', direction: 'asc' }
        break
      case 'price-high':
        sort = { field: 'price', direction: 'desc' }
        break
      case 'newest':
        sort = { field: 'createdAt', direction: 'desc' }
        break
      case 'ending':
        sort = { field: 'auctionEnd', direction: 'asc' }
        break
      case 'bids':
        sort = { field: 'bids', direction: 'desc' }
        break
      default:
        sort = { field: 'relevance', direction: 'desc' }
    }

    // Execute search
    const searchResult = await searchListings({
      query,
      filters,
      sort,
      limit,
      offset,
    })

    // Transform results to API response format (backward compatible)
    const watches = searchResult.results.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description,
      brand: result.brand,
      model: result.model,
      price: result.price,
      buyNowPrice: result.buyNowPrice,
      condition: result.condition,
      year: result.year,
      images: result.images,
      boosters: result.boosters,
      isAuction: result.isAuction,
      auctionEnd: result.auctionEnd,
      auctionStart: result.auctionStart,
      createdAt: result.createdAt,
      sellerId: result.sellerId,
      seller: result.seller,
      bids: result.bids,
      city: result.seller?.city || null,
      postalCode: result.seller?.postalCode || null,
      categorySlugs: result.categorySlugs,
      // Enhanced fields for Ricardo-level cards
      paymentProtectionEnabled: result.paymentProtectionEnabled,
      shippingMethods: result.shippingMethods,
      shippingMinCost: result.shippingMinCost,
      sellerVerified: result.sellerVerified,
      // Include search metadata if present
      ...(result.score !== undefined && { _score: result.score }),
      ...(result.ftsRank !== undefined && { _ftsRank: result.ftsRank }),
      ...(result.trigramSimilarity !== undefined && { _trigramSim: result.trigramSimilarity }),
    }))

    return NextResponse.json(
      {
        watches,
        total: searchResult.total,
        limit: searchResult.limit,
        offset: searchResult.offset,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error: any) {
    console.error('[SEARCH] Search error:', error)
    console.error('[SEARCH] Error stack:', error?.stack)

    // Check if it's a known database error (e.g., extension not installed)
    const errorMessage = error?.message || String(error)
    if (errorMessage.includes('pg_trgm') || errorMessage.includes('unaccent')) {
      console.error('[SEARCH] PostgreSQL extensions may not be installed. Run the migration first.')
    }

    return NextResponse.json(
      {
        error: 'Ein Fehler ist aufgetreten bei der Suche',
        message: shouldShowDetailedErrors() ? errorMessage : undefined,
        watches: [],
        total: 0,
      },
      { status: 500 }
    )
  }
}
