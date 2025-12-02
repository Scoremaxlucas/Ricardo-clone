import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PREISVORSCHLÄGE
 *
 * Analysiert historische Verkaufsdaten um realistische Preisvorschläge zu geben
 */

export async function POST(request: NextRequest) {
  try {
    const { category, subcategory, brand, model, condition, year } = await request.json()

    if (!category) {
      return NextResponse.json({ error: 'Kategorie ist erforderlich' }, { status: 400 })
    }

    // Baue Where-Clause für ähnliche Artikel
    const whereClause: any = {
      purchases: {
        some: {}, // Nur verkaufte Artikel
      },
    }

    if (category) {
      whereClause.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      }
    }

    if (brand) {
      whereClause.brand = {
        contains: brand,
        mode: 'insensitive',
      }
    }

    if (model) {
      whereClause.model = {
        contains: model,
        mode: 'insensitive',
      }
    }

    if (condition) {
      whereClause.condition = condition
    }

    if (year) {
      whereClause.year = parseInt(year)
    }

    // Hole ähnliche verkaufte Artikel
    const similarSoldItems = await prisma.watch.findMany({
      where: whereClause,
      include: {
        purchases: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Analysiere letzten 20 ähnlichen Verkäufe
    })

    if (similarSoldItems.length === 0) {
      // Fallback: Suche nach ähnlichen Artikeln in derselben Kategorie
      const categoryItems = await prisma.watch.findMany({
        where: {
          categories: {
            some: {
              category: {
                slug: category,
              },
            },
          },
          purchases: {
            some: {},
          },
        },
        include: {
          purchases: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      })

      if (categoryItems.length === 0) {
        return NextResponse.json({
          suggestedPrice: null,
          priceRange: null,
          confidence: 'low',
          message: 'Keine ähnlichen Verkäufe gefunden',
          dataPoints: 0,
        })
      }

      const prices = categoryItems
        .map(item => {
          const purchase = item.purchases[0]
          if (!purchase) return null
          // Für Auktionen: Nutze den finalen Preis, sonst den Kaufpreis
          return purchase.price || item.price
        })
        .filter((p): p is number => p !== null && p > 0)

      if (prices.length === 0) {
        return NextResponse.json({
          suggestedPrice: null,
          priceRange: null,
          confidence: 'low',
          message: 'Keine Preisinformationen verfügbar',
          dataPoints: 0,
        })
      }

      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      return NextResponse.json({
        suggestedPrice: Math.round(avgPrice),
        priceRange: {
          min: Math.round(minPrice),
          max: Math.round(maxPrice),
        },
        confidence: 'medium',
        message: `Basierend auf ${prices.length} ähnlichen Verkäufen in dieser Kategorie`,
        dataPoints: prices.length,
      })
    }

    // Berechne Preise aus Verkäufen
    const prices = similarSoldItems
      .map(item => {
        const purchase = item.purchases[0]
        if (!purchase) return null
        return purchase.price || item.price
      })
      .filter((p): p is number => p !== null && p > 0)

    if (prices.length === 0) {
      return NextResponse.json({
        suggestedPrice: null,
        priceRange: null,
        confidence: 'low',
        message: 'Keine Preisinformationen verfügbar',
        dataPoints: 0,
      })
    }

    // Berechne Statistiken
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const sortedPrices = [...prices].sort((a, b) => a - b)
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)]
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    // Vorschlag: Median (robuster als Durchschnitt)
    const suggestedPrice = Math.round(medianPrice)

    // Berechne Confidence basierend auf Datenmenge
    let confidence: 'low' | 'medium' | 'high' = 'low'
    if (prices.length >= 10) {
      confidence = 'high'
    } else if (prices.length >= 5) {
      confidence = 'medium'
    }

    return NextResponse.json({
      suggestedPrice,
      priceRange: {
        min: Math.round(minPrice),
        max: Math.round(maxPrice),
        average: Math.round(avgPrice),
        median: Math.round(medianPrice),
      },
      confidence,
      message: `Basierend auf ${prices.length} ähnlichen Verkäufen`,
      dataPoints: prices.length,
      statistics: {
        average: Math.round(avgPrice),
        median: Math.round(medianPrice),
        min: Math.round(minPrice),
        max: Math.round(maxPrice),
      },
    })
  } catch (error) {
    console.error('Fehler bei Preisvorschlag:', error)
    return NextResponse.json({ error: 'Fehler bei der Preisanalyse' }, { status: 500 })
  }
}
