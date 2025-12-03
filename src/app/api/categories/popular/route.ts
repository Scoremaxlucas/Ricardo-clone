import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { categoryConfig } from '@/data/categories'

// Helper to get category metadata (for API compatibility - returns icon as string placeholder)
function getCategoryMetadata(slug: string) {
  const config = categoryConfig[slug] || categoryConfig['auto-motorrad'] // fallback
  return {
    name: config.name,
    icon: 'icon', // Placeholder - actual icon is component, not string
    color: config.color,
  }
}

export async function GET() {
  try {
    // Hole alle InvoiceItems, die Booster sind (description enthält "Booster")
    const boosterInvoices = await prisma.invoiceItem.findMany({
      where: {
        description: {
          contains: 'Booster',
        },
        watchId: {
          not: null,
        },
      },
      select: {
        total: true,
        watch: {
          select: {
            categories: {
              select: {
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        },
        invoice: {
          select: {
            status: true,
          },
        },
      },
    })

    // Berechne Anzahl der geboosteten Artikel pro Kategorie (aus aktiven Produkten)
    const boostedProductsByCategory: Record<string, number> = {}
    const categoryRevenue: Record<string, number> = {}

    // Zähle aktive geboostete Produkte direkt (über Relation)
    const activeBoostedWatches = await prisma.watch.findMany({
      where: {
        purchases: {
          none: {}, // Nur nicht verkaufte Produkte
        },
        boosters: {
          not: null,
        },
        categories: {
          some: {}, // Hat mindestens eine Kategorie
        },
      },
      select: {
        boosters: true,
        categories: {
          select: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    })

    activeBoostedWatches.forEach(watch => {
      try {
        const boosters =
          typeof watch.boosters === 'string' ? JSON.parse(watch.boosters) : watch.boosters

        if (Array.isArray(boosters) && boosters.length > 0 && boosters[0] !== 'none') {
          // Zähle für jede Kategorie des Produkts
          watch.categories.forEach((wc: any) => {
            const categorySlug = wc.category.slug
            if (!boostedProductsByCategory[categorySlug]) {
              boostedProductsByCategory[categorySlug] = 0
            }
            boostedProductsByCategory[categorySlug] += 1
          })
        }
      } catch (e) {
        // Ignore parsing errors
      }
    })

    // Zusätzlich: Berechne Umsatz aus bezahlten Booster-Rechnungen
    boosterInvoices.forEach(item => {
      if (item.watch && item.invoice.status === 'paid') {
        item.watch.categories.forEach((wc: any) => {
          const categorySlug = wc.category.slug
          if (!categoryRevenue[categorySlug]) {
            categoryRevenue[categorySlug] = 0
          }
          categoryRevenue[categorySlug] += item.total
        })
      }
    })

    // Hole alle aktiven Produkte mit ihren Kategorien
    const activeWatches = await prisma.watch.findMany({
      where: {
        purchases: {
          none: {}, // Nur nicht verkaufte Produkte
        },
        categories: {
          some: {}, // Hat mindestens eine Kategorie
        },
      },
      select: {
        id: true,
        categories: {
          select: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    })

    // Zähle Produkte pro Kategorie
    const activeProductsByCategory: Record<string, number> = {}
    activeWatches.forEach(watch => {
      watch.categories.forEach((wc: any) => {
        const categorySlug = wc.category.slug
        if (!activeProductsByCategory[categorySlug]) {
          activeProductsByCategory[categorySlug] = 0
        }
        activeProductsByCategory[categorySlug] += 1
      })
    })

    // Kombiniere Daten: Kategorien mit geboosteten Artikeln, Umsatz und Produktanzahl
    const categoriesWithData = Object.keys(categoryConfig).map(slug => {
      const metadata = getCategoryMetadata(slug)
      const boostedCount = boostedProductsByCategory[slug] || 0
      const revenue = categoryRevenue[slug] || 0
      const productCount = activeProductsByCategory[slug] || 0

      return {
        category: slug,
        name: metadata.name,
        icon: metadata.icon, // 'icon' placeholder - frontend will use categoryConfig
        color: metadata.color,
        boostedCount,
        revenue,
        productCount,
        score: boostedCount * 10 + revenue * 0.1 + productCount * 0.01, // Gewichtung: Anzahl geboosteter Artikel ist am wichtigsten
      }
    })

    // Sortiere nach Score (Anzahl geboosteter Artikel hat höchste Priorität)
    // Zeige ALLE Kategorien, auch wenn sie noch keine Produkte haben
    const sortedCategories = categoriesWithData.sort((a, b) => {
      // Zuerst nach Produktanzahl (Kategorien mit Produkten zuerst)
      if (a.productCount !== b.productCount) {
        return b.productCount - a.productCount
      }
      // Dann nach geboosteten Artikeln
      if (a.boostedCount !== b.boostedCount) {
        return b.boostedCount - a.boostedCount
      }
      // Dann nach Score
      return b.score - a.score
    })

    return NextResponse.json(
      {
        categories: sortedCategories,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
        },
      }
    )
  } catch (error) {
    console.error('Error fetching popular categories:', error)
    return NextResponse.json({ error: 'Failed to fetch popular categories' }, { status: 500 })
  }
}
