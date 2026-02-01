/**
 * Admin Statistics API
 * Detaillierte Statistiken für das Admin-Dashboard
 *
 * AKTUALISIERT: Verwendet jetzt Order-Tabelle für aktuelle Transaktionsdaten
 */

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Admin-Prüfung
    const authError = await requireAdmin()
    if (authError) return authError

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Alle Daten parallel laden - AKTUALISIERT für Order-Tabelle
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
      auctionWatches,
      buyNowWatches,
      newWatchesLast30Days,
      newWatchesLast7Days,

      // NEU: Order-basierte Transaktionsstatistiken
      allOrders,

      // Legacy-Purchases für historische Daten
      allLegacyPurchases,

      // Dispute-Statistiken - kombiniert aus Order und Purchase
      orderDisputes,
      purchaseDisputes,

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
      prisma.user.count({
        where: {
          verificationStatus: 'pending',
          verified: true,
          OR: [
            { idDocument: { not: null } },
            { idDocumentPage1: { not: null } },
            { idDocumentPage2: { not: null } },
          ],
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

      // Angebote
      prisma.watch.count(),
      prisma.watch.count({ where: { isAuction: true } }),
      prisma.watch.count({ where: { isAuction: false } }),
      prisma.watch.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.watch.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

      // Orders (AKTUALISIERT - primäre Datenquelle)
      prisma.order.findMany({
        select: {
          id: true,
          itemPrice: true,
          platformFee: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
          paidAt: true,
        },
      }),

      // Legacy Purchases (für historische Vollständigkeit)
      prisma.purchase.findMany({
        select: {
          id: true,
          price: true,
          status: true,
          createdAt: true,
          watch: {
            select: { price: true },
          },
        },
      }),

      // Order Disputes
      prisma.order.findMany({
        where: { disputeStatus: { not: 'none' } },
        select: { id: true, disputeStatus: true },
      }),

      // Purchase Disputes (Legacy)
      prisma.purchase.findMany({
        where: { disputeOpenedAt: { not: null } },
        select: { id: true, disputeStatus: true },
      }),

      // Kategorien
      prisma.watchCategory
        .findMany({
          include: {
            category: {
              select: { name: true },
            },
          },
        })
        .then(categories => {
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

    // === Berechne Order-basierte Statistiken ===
    const paidOrders = allOrders.filter(
      o => o.paymentStatus === 'paid' || o.paymentStatus === 'released'
    )
    const pendingOrders = allOrders.filter(
      o => o.paymentStatus === 'created' || o.orderStatus === 'awaiting_payment'
    )

    // Order-Umsatz (korrekt)
    const orderRevenue = paidOrders.reduce((sum, o) => sum + o.itemPrice, 0)
    const orderPlatformFees = paidOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0)

    // Legacy-Umsatz
    const completedLegacy = allLegacyPurchases.filter(p => p.status === 'completed')
    const legacyRevenue = completedLegacy.reduce(
      (sum, p) => sum + (p.price || p.watch?.price || 0),
      0
    )

    // Kombinierter Umsatz
    const totalRevenue = orderRevenue + legacyRevenue

    // Durchschnittspreis (nur aus bezahlten Orders)
    const averageOrderPrice = paidOrders.length > 0 ? orderRevenue / paidOrders.length : 0

    // Aktive und verkaufte Angebote
    const soldWatchIds = new Set([
      ...allOrders.filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'released').map(o => o.id),
    ])

    // Aktive Watches (ohne Order und nicht abgelaufen)
    const activeWatches = await prisma.watch.count({
      where: {
        orders: { none: {} },
        OR: [
          { auctionEnd: null },
          { auctionEnd: { gt: now } },
        ],
      },
    })

    // Abgelaufene Watches
    const expiredWatches = await prisma.watch.count({
      where: {
        auctionEnd: { lt: now },
        orders: { none: {} },
      },
    })

    // Verkaufte Watches = Anzahl bezahlter Orders
    const soldWatches = paidOrders.length

    // Erfolgsrate
    const successRate = totalWatches > 0 ? (soldWatches / totalWatches) * 100 : 0

    // === Berechne Disputes ===
    const orderPendingDisputes = orderDisputes.filter(
      d => d.disputeStatus === 'pending' || d.disputeStatus === 'open'
    ).length
    const orderResolvedDisputes = orderDisputes.filter(d => d.disputeStatus === 'resolved').length
    const orderClosedDisputes = orderDisputes.filter(
      d => d.disputeStatus === 'closed' || d.disputeStatus === 'rejected'
    ).length

    const purchasePendingDisputes = purchaseDisputes.filter(d => d.disputeStatus === 'pending').length
    const purchaseResolvedDisputes = purchaseDisputes.filter(d => d.disputeStatus === 'resolved').length
    const purchaseClosedDisputes = purchaseDisputes.filter(
      d => d.disputeStatus === 'closed' || d.disputeStatus === 'rejected'
    ).length

    const totalPendingDisputes = orderPendingDisputes + purchasePendingDisputes
    const totalResolvedDisputes = orderResolvedDisputes + purchaseResolvedDisputes
    const totalClosedDisputes = orderClosedDisputes + purchaseClosedDisputes

    // Durchschnittliche Verkaufsdauer (für Orders)
    const ordersWithDuration = allOrders
      .filter(o => o.paidAt)
      .map(o => {
        const created = new Date(o.createdAt)
        const paid = new Date(o.paidAt!)
        return (paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // Tage
      })

    const averageSaleDuration =
      ordersWithDuration.length > 0
        ? ordersWithDuration.reduce((sum, d) => sum + d, 0) / ordersWithDuration.length
        : 0

    // Top Kategorien formatieren
    const topCategories = Array.isArray(watchesByCategory)
      ? watchesByCategory.map((cat: any) => ({
          category: cat.category || 'Unbekannt',
          count: cat._count?.id || 0,
        }))
      : []

    // Zeitliche Entwicklung (letzte 7 Tage) - AKTUALISIERT für Orders
    const dailyStats = []
    try {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const [users, watches, orders] = await Promise.all([
          prisma.user.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
          prisma.watch.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
          prisma.order.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
        ])

        dailyStats.push({
          date: startOfDay.toISOString().split('T')[0],
          users,
          watches,
          orders, // Umbenannt von "purchases" zu "orders"
        })
      }
    } catch (dailyStatsError) {
      console.error('[admin/statistics] Error calculating daily stats:', dailyStatsError)
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

      // Transaktionen (AKTUALISIERT)
      transactions: {
        // Order-basierte Stats (primär)
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        orderRevenue: Math.round(orderRevenue * 100) / 100,
        platformFees: Math.round(orderPlatformFees * 100) / 100,
        averageOrderPrice: Math.round(averageOrderPrice * 100) / 100,

        // Legacy-Stats (sekundär)
        legacyPurchases: allLegacyPurchases.length,
        completedLegacyPurchases: completedLegacy.length,
        legacyRevenue: Math.round(legacyRevenue * 100) / 100,

        // Kombiniert
        total: allOrders.length + allLegacyPurchases.length,
        completed: paidOrders.length + completedLegacy.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },

      // Disputes (kombiniert)
      disputes: {
        pending: totalPendingDisputes,
        resolved: totalResolvedDisputes,
        closed: totalClosedDisputes,
        total: orderDisputes.length + purchaseDisputes.length,
        // Aufschlüsselung
        orderDisputes: orderDisputes.length,
        purchaseDisputes: purchaseDisputes.length,
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
    console.error('[admin/statistics] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Statistiken: ' + error.message },
      { status: 500 }
    )
  }
}
