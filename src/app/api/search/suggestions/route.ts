import { apiCache, generateCacheKey } from '@/lib/api-cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPopularSearches, getSearchSuggestions } from '@/lib/search-analytics'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * RICARDO-LEVEL: Enhanced Search Suggestions API
 *
 * GET /api/search/suggestions?q=...&limit=...
 *
 * Returns:
 * - Text suggestions (from search history)
 * - Category suggestions (matching categories)
 * - Brand suggestions (matching brands)
 * - Product suggestions (matching products with images)
 */

// Category data for suggestions
const categories = [
  { slug: 'luxusuhren', name: 'Luxusuhren', icon: '⌚' },
  { slug: 'vintage', name: 'Vintage & Antik', icon: '🏺' },
  { slug: 'sportuhren', name: 'Sportuhren', icon: '🏃' },
  { slug: 'taucheruhren', name: 'Taucheruhren', icon: '🤿' },
  { slug: 'smartwatches', name: 'Smartwatches', icon: '📱' },
  { slug: 'damenuhren', name: 'Damenuhren', icon: '👩' },
  { slug: 'herrenuhren', name: 'Herrenuhren', icon: '👨' },
  { slug: 'accessoires', name: 'Accessoires', icon: '🎀' },
  { slug: 'schmuck', name: 'Schmuck', icon: '💎' },
  { slug: 'elektronik', name: 'Elektronik', icon: '📟' },
  { slug: 'mode', name: 'Mode & Kleidung', icon: '👔' },
  { slug: 'auto', name: 'Auto & Motorrad', icon: '🚗' },
  { slug: 'sport', name: 'Sport & Freizeit', icon: '⚽' },
  { slug: 'haus', name: 'Haus & Garten', icon: '🏠' },
  { slug: 'sammeln', name: 'Sammeln & Kunst', icon: '🎨' },
]

// Popular luxury watch brands
const popularBrands = [
  'Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet', 'Tag Heuer',
  'Breitling', 'IWC', 'Cartier', 'Tudor', 'Longines', 'Tissot',
  'Jaeger-LeCoultre', 'Zenith', 'Hublot', 'Panerai', 'Vacheron Constantin',
  'A. Lange & Söhne', 'Blancpain', 'Chopard', 'Girard-Perregaux',
  // Tech brands
  'Apple', 'Samsung', 'Sony', 'Canon', 'Nikon', 'DJI',
  // Fashion brands
  'Nike', 'Adidas', 'Louis Vuitton', 'Gucci', 'Prada', 'Hermès',
]

interface SuggestionItem {
  type: 'text' | 'category' | 'brand' | 'product'
  value: string
  label: string
  icon?: string
  image?: string
  price?: number
  categorySlug?: string
  productId?: string
  count?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    const enhanced = searchParams.get('enhanced') !== 'false' // Default to enhanced

    // Session für User-ID (optional)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // API-Level Cache für vollständige Response
    const cacheKey = generateCacheKey('/api/search/suggestions', { q: query, limit, enhanced })
    const cachedResponse = apiCache.get<any>(cacheKey)

    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      })
    }

    const queryLower = query.trim().toLowerCase()
    
    // If not enhanced mode, return simple suggestions (backward compatible)
    if (!enhanced) {
      let suggestions: string[] = []
      if (queryLower.length >= 2) {
        suggestions = await getSearchSuggestions(query.trim(), limit)
      } else if (queryLower.length === 0) {
        suggestions = await getPopularSearches(limit)
      }
      
      const response = {
        suggestions,
        query: query.trim(),
        count: suggestions.length,
      }
      apiCache.set(cacheKey, response, 60000)
      return NextResponse.json(response, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', 'X-Cache': 'MISS' },
      })
    }

    // ENHANCED MODE: Multiple suggestion types
    const enhancedSuggestions: SuggestionItem[] = []

    if (queryLower.length >= 2) {
      // 1. Category suggestions (match category names)
      const matchingCategories = categories.filter(
        c => c.name.toLowerCase().includes(queryLower) || c.slug.toLowerCase().includes(queryLower)
      ).slice(0, 3)
      
      for (const cat of matchingCategories) {
        enhancedSuggestions.push({
          type: 'category',
          value: cat.slug,
          label: cat.name,
          icon: cat.icon,
          categorySlug: cat.slug,
        })
      }

      // 2. Brand suggestions (match brand names)
      const matchingBrands = popularBrands.filter(
        b => b.toLowerCase().includes(queryLower)
      ).slice(0, 3)
      
      for (const brand of matchingBrands) {
        // Get count of items from this brand
        try {
          const count = await prisma.watch.count({
            where: {
              brand: { contains: brand, mode: 'insensitive' },
              moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] },
            },
          })
          enhancedSuggestions.push({
            type: 'brand',
            value: brand,
            label: brand,
            count,
          })
        } catch {
          enhancedSuggestions.push({
            type: 'brand',
            value: brand,
            label: brand,
          })
        }
      }

      // 3. Product suggestions (actual products matching query)
      try {
        const products = await prisma.watch.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
              { model: { contains: query, mode: 'insensitive' } },
            ],
            moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] },
          },
          select: {
            id: true,
            title: true,
            brand: true,
            price: true,
            images: true,
          },
          take: 3,
          orderBy: { createdAt: 'desc' },
        })

        for (const product of products) {
          let images: string[] = []
          try {
            images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images || []
          } catch {}
          
          enhancedSuggestions.push({
            type: 'product',
            value: product.id,
            label: product.title,
            image: images[0] || undefined,
            price: product.price,
            productId: product.id,
          })
        }
      } catch (err) {
        console.error('Error fetching product suggestions:', err)
      }

      // 4. Text suggestions (from search history)
      const textSuggestions = await getSearchSuggestions(query.trim(), limit - enhancedSuggestions.length)
      for (const text of textSuggestions) {
        // Avoid duplicates
        if (!enhancedSuggestions.some(s => s.label.toLowerCase() === text.toLowerCase())) {
          enhancedSuggestions.push({
            type: 'text',
            value: text,
            label: text,
          })
        }
      }
    } else if (queryLower.length === 0) {
      // No query: show popular searches and trending categories
      const popularSearches = await getPopularSearches(5)
      for (const text of popularSearches) {
        enhancedSuggestions.push({
          type: 'text',
          value: text,
          label: text,
          icon: '🔥',
        })
      }
      
      // Add some popular categories
      for (const cat of categories.slice(0, 4)) {
        enhancedSuggestions.push({
          type: 'category',
          value: cat.slug,
          label: cat.name,
          icon: cat.icon,
          categorySlug: cat.slug,
        })
      }
    }

    const response = {
      suggestions: enhancedSuggestions.map(s => s.label), // Backward compatible
      enhancedSuggestions,
      query: query.trim(),
      count: enhancedSuggestions.length,
    }

    // Cache API Response für 1 Minute
    apiCache.set(cacheKey, response, 60000)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    })
  } catch (error: any) {
    console.error('Error fetching search suggestions:', error)
    return NextResponse.json(
      {
        suggestions: [],
        enhancedSuggestions: [],
        query: '',
        count: 0,
        error: 'Error fetching suggestions',
      },
      { status: 500 }
    )
  }
}
