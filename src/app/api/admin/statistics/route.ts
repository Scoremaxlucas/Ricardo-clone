import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET: Detaillierte Statistiken für Admin-Dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const isAdminInSession = session?.user?.isAdmin === true

    // Prüfe ob User Admin ist (per ID oder E-Mail)
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, email: true },
      })
    }

    // Falls nicht gefunden per ID, versuche per E-Mail
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true },
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = user?.isAdmin === true
    const isAdmin = isAdminInSession || isAdminInDb

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Alle Daten parallel laden
    const [
      // Benutzer-Statistiken
      totalUsers,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      pendingVerifications,
      newUsersLast30Days,
      newUsersLast7Days,

      // Angebots-Statistiken
      totalWatches,
      activeWatches,
      soldWatches,
      auctionWatches,
      buyNowWatches,
      expiredWatches,
      newWatchesLast30Days,
      newWatchesLast7Days,

      // Transaktions-Statistiken
      allPurchases,
      completedPurchases,
      pendingPurchases,
      cancelledPurchases,

      // Dispute-Statistiken
      pendingDisputes,
      resolvedDisputes,
      closedDisputes,

      // Kategorien-Statistiken
      watchesByCategory,

      // Rechnungs-Statistiken
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      // Benutzer
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { verified: true, verificationStatus: 'approved' } }),
      prisma.user.count({ where: { verificationStatus: 'pending' } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

      // Angebote
      prisma.watch.count(),
      prisma.watch.count({
        where: {
          purchases: { none: {} },
          OR: [{ auctionEnd: null }, { auctionEnd: { gt: now } }],
        },
      }),
      prisma.watch.count({
        where: {
          purchases: { some: {} },
        },
      }),
      prisma.watch.count({ where: { isAuction: true } }),
      prisma.watch.count({ where: { isAuction: false } }),
      prisma.watch.count({
        where: {
          auctionEnd: { lt: now },
          purchases: { none: {} },
        },
      }),
      prisma.watch.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.watch.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

      // Transaktionen
      prisma.purchase.findMany({
        include: {
          watch: {
            select: { price: true, buyNowPrice: true, isAuction: true },
          },
        },
      }),
      prisma.purchase.count({ where: { status: 'completed' } }),
      prisma.purchase.count({
        where: { status: { in: ['pending', 'payment_confirmed', 'shipped'] } },
      }),
      prisma.purchase.count({ where: { status: 'cancelled' } }),

      // Disputes
      prisma.purchase.count({
        where: { disputeStatus: 'pending', disputeOpenedAt: { not: null } },
      }),
      prisma.purchase.count({ where: { disputeStatus: 'resolved' } }),
      prisma.purchase.count({ where: { disputeStatus: 'closed' } }),

      // Kategorien - verwende WatchCategory Relation
      prisma.watchCategory
        .findMany({
          include: {
            category: {
              select: { name: true },
            },
          },
        })
        .then(categories => {
          // Gruppiere nach category name
          const categoryCounts: { [key: string]: number } = {}
          categories.forEach(wc => {
            const catName = wc.category?.name || 'Unbekannt'
            categoryCounts[catName] = (categoryCounts[catName] || 0) + 1
          })
          return Object.entries(categoryCounts)
            .map(([category, count]) => ({ category, _count: { id: count } }))
            .sort((a, b) => b._count.id - a._count.id)
            .slice(0, 10)
        })
        .catch(() => []),

      // Rechnungen
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.invoice.count({ where: { status: 'pending' } }),
      prisma.invoice.count({
        where: {
          status: 'pending',
          dueDate: { lt: now },
        },
      }),
    ])

    // Berechne Umsatz
    const totalRevenue = allPurchases.reduce((sum, purchase) => {
      return sum + (purchase.price || purchase.watch?.price || 0)
    }, 0)

    const completedRevenue = allPurchases
      .filter(p => p.status === 'completed')
      .reduce((sum, purchase) => {
        return sum + (purchase.price || purchase.watch?.price || 0)
      }, 0)

    const averagePurchasePrice = completedPurchases > 0 ? completedRevenue / completedPurchases : 0

    // Berechne Erfolgsrate
    const successRate = totalWatches > 0 ? (soldWatches / totalWatches) * 100 : 0

    // Berechne durchschnittliche Verkaufsdauer (für verkaufte Angebote)
    const soldWatchesWithDates = await prisma.watch.findMany({
      where: {
        purchases: { some: {} },
      },
      include: {
        purchases: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const saleDurations = soldWatchesWithDates
      .map(watch => {
        if (!watch.purchases || watch.purchases.length === 0) return null
        const purchaseDate = watch.purchases[0].createdAt
        const watchCreated = watch.createdAt
        return (purchaseDate.getTime() - watchCreated.getTime()) / (1000 * 60 * 60 * 24) // Tage
      })
      .filter((d): d is number => d !== null)

    const averageSaleDuration =
      saleDurations.length > 0
        ? saleDurations.reduce((sum, d) => sum + d, 0) / saleDurations.length
        : 0

    // Top Kategorien formatieren
    const topCategories = Array.isArray(watchesByCategory)
      ? watchesByCategory.map((cat: any) => ({
          category: cat.category || 'Unbekannt',
          count: cat._count?.id || 0,
        }))
      : []

    // Zeitliche Entwicklung (letzte 7 Tage)
    const dailyStats = []
    try {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const [users, watches, purchases] = await Promise.all([
          prisma.user.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
          prisma.watch.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
          prisma.purchase.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
        ])

        dailyStats.push({
          date: startOfDay.toISOString().split('T')[0],
          users,
          watches,
          purchases,
        })
      }
    } catch (dailyStatsError) {
      console.error('Error calculating daily stats:', dailyStatsError)
      // Setze leere dailyStats bei Fehler
    }

    return NextResponse.json({
      // Benutzer
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        verified: verifiedUsers,
        pendingVerifications,
        newLast30Days: newUsersLast30Days,
        newLast7Days: newUsersLast7Days,
      },

      // Angebote
      watches: {
        total: totalWatches,
        active: activeWatches,
        sold: soldWatches,
        expired: expiredWatches,
        auctions: auctionWatches,
        buyNow: buyNowWatches,
        newLast30Days: newWatchesLast30Days,
        newLast7Days: newWatchesLast7Days,
        successRate: Math.round(successRate * 100) / 100,
        averageSaleDuration: Math.round(averageSaleDuration * 100) / 100,
      },

      // Transaktionen
      transactions: {
        total: allPurchases.length,
        completed: completedPurchases,
        pending: pendingPurchases,
        cancelled: cancelledPurchases,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        completedRevenue: Math.round(completedRevenue * 100) / 100,
        averagePrice: Math.round(averagePurchasePrice * 100) / 100,
      },

      // Disputes
      disputes: {
        pending: pendingDisputes,
        resolved: resolvedDisputes,
        closed: closedDisputes,
        total: pendingDisputes + resolvedDisputes + closedDisputes,
      },

      // Kategorien
      categories: topCategories,

      // Rechnungen
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
      },

      // Zeitliche Entwicklung
      dailyStats,
    })
  } catch (error: any) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Statistiken: ' + error.message },
      { status: 500 }
    )
  }
}
