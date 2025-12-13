import { apiCache, generateCacheKey } from '@/lib/api-cache'
import { authOptions } from '@/lib/auth'
import {
  getUserPreferredBrands,
  getUserPreferredCategories,
  getUserPriceRange,
} from '@/lib/browsing-tracker'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für User-Präferenzen (Feature 5: Personalisierung)
 *
 * GET /api/user/preferences
 * POST /api/user/preferences
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Check cache first
    const cacheKey = generateCacheKey('/api/user/preferences', { userId })
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }

    // Hole gespeicherte Präferenzen aus DB
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    // Wenn keine Präferenzen existieren, analysiere Browsing-Historie
    if (!preferences) {
      const [categories, brands, priceRange] = await Promise.all([
        getUserPreferredCategories(userId),
        getUserPreferredBrands(userId),
        getUserPriceRange(userId),
      ])

      // Erstelle Präferenzen basierend auf Browsing-Historie
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          preferredCategories: JSON.stringify(categories),
          preferredBrands: JSON.stringify(brands),
          priceRange: priceRange ? JSON.stringify(priceRange) : null,
        },
      })
    }

    const response = {
      preferredCategories: preferences.preferredCategories
        ? JSON.parse(preferences.preferredCategories)
        : [],
      preferredBrands: preferences.preferredBrands ? JSON.parse(preferences.preferredBrands) : [],
      priceRange: preferences.priceRange ? JSON.parse(preferences.priceRange) : null,
      preferredConditions: preferences.preferredConditions
        ? JSON.parse(preferences.preferredConditions)
        : [],
      updatedAt: preferences.updatedAt,
    }

    // Cache für 5 Minuten
    apiCache.set(cacheKey, response, 300000)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    })
  } catch (error: any) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Präferenzen' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const { preferredCategories, preferredBrands, priceRange, preferredConditions } = body

    // Update oder erstelle Präferenzen
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        preferredCategories: preferredCategories ? JSON.stringify(preferredCategories) : undefined,
        preferredBrands: preferredBrands ? JSON.stringify(preferredBrands) : undefined,
        priceRange: priceRange ? JSON.stringify(priceRange) : undefined,
        preferredConditions: preferredConditions ? JSON.stringify(preferredConditions) : undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        preferredCategories: preferredCategories ? JSON.stringify(preferredCategories) : null,
        preferredBrands: preferredBrands ? JSON.stringify(preferredBrands) : null,
        priceRange: priceRange ? JSON.stringify(priceRange) : null,
        preferredConditions: preferredConditions ? JSON.stringify(preferredConditions) : null,
      },
    })

    // Invalidate cache
    const cacheKey = generateCacheKey('/api/user/preferences', { userId })
    apiCache.delete(cacheKey)

    return NextResponse.json({
      preferredCategories: preferences.preferredCategories
        ? JSON.parse(preferences.preferredCategories)
        : [],
      preferredBrands: preferences.preferredBrands ? JSON.parse(preferences.preferredBrands) : [],
      priceRange: preferences.priceRange ? JSON.parse(preferences.priceRange) : null,
      preferredConditions: preferences.preferredConditions
        ? JSON.parse(preferences.preferredConditions)
        : [],
      updatedAt: preferences.updatedAt,
    })
  } catch (error: any) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Präferenzen' },
      { status: 500 }
    )
  }
}
