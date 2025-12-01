import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Hole Artikel der letzten 7 Tage und zähle nach Kategorien
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const watches = await prisma.watch.findMany({
      where: {
        // Stornierte Purchases machen den Artikel wieder verfügbar
        OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }],
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    // Zähle Artikel pro Kategorie
    const categoryCounts: Record<string, number> = {}
    watches.forEach(watch => {
      watch.categories.forEach((wc: any) => {
        const categorySlug = wc.category?.slug
        if (categorySlug) {
          categoryCounts[categorySlug] = (categoryCounts[categorySlug] || 0) + 1
        }
      })
    })

    // Hole auch Artikel der letzten 14 Tage für Vergleich
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const previousWatches = await prisma.watch.findMany({
      where: {
        // Stornierte Purchases machen den Artikel wieder verfügbar
        OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }],
        createdAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    const previousCounts: Record<string, number> = {}
    previousWatches.forEach(watch => {
      watch.categories.forEach((wc: any) => {
        const categorySlug = wc.category?.slug
        if (categorySlug) {
          previousCounts[categorySlug] = (previousCounts[categorySlug] || 0) + 1
        }
      })
    })

    // Berechne Wachstum
    const categoryNames: Record<string, string> = {
      'auto-motorrad': 'Auto & Motorrad',
      'computer-netzwerk': 'Computer & Netzwerk',
      sport: 'Sport',
      'uhren-schmuck': 'Uhren & Schmuck',
      'kleidung-accessoires': 'Kleidung & Accessoires',
      'haushalt-wohnen': 'Haushalt & Wohnen',
      'kind-baby': 'Kind & Baby',
      buecher: 'Bücher',
      'games-konsolen': 'Games & Konsolen',
      'sammeln-seltenes': 'Sammeln & Seltenes',
    }

    const categoryIcons: Record<string, string> = {
      'auto-motorrad': '🚗',
      'computer-netzwerk': '💻',
      sport: '⚽',
      'uhren-schmuck': '⌚',
      'kleidung-accessoires': '👗',
      'haushalt-wohnen': '🏠',
      'kind-baby': '👶',
      buecher: '📚',
      'games-konsolen': '🎮',
      'sammeln-seltenes': '✨',
    }

    const categoryColors: Record<string, string> = {
      'auto-motorrad': 'bg-blue-500',
      'computer-netzwerk': 'bg-purple-500',
      sport: 'bg-green-500',
      'uhren-schmuck': 'bg-yellow-500',
      'kleidung-accessoires': 'bg-pink-500',
      'haushalt-wohnen': 'bg-emerald-500',
      'kind-baby': 'bg-orange-500',
      buecher: 'bg-indigo-500',
      'games-konsolen': 'bg-red-500',
      'sammeln-seltenes': 'bg-rose-500',
    }

    const trending = Object.entries(categoryCounts)
      .map(([category, count]) => {
        const previous = previousCounts[category] || 0
        const growth = previous > 0 ? Math.round(((count - previous) / previous) * 100) : count * 10

        return {
          category,
          name: categoryNames[category] || category,
          count,
          growth: Math.max(0, growth),
          icon: categoryIcons[category] || '📦',
          color: categoryColors[category] || 'bg-gray-500',
        }
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 4)

    return NextResponse.json({ categories: trending })
  } catch (error) {
    console.error('Error fetching trending categories:', error)
    return NextResponse.json({ error: 'Failed to fetch trending categories' }, { status: 500 })
  }
}
