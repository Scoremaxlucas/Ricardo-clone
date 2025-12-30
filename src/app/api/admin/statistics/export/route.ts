import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Helper: Admin-Check
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true },
    })
  }

  const isAdminInSession = session?.user?.isAdmin === true
  const isAdminInDb = user?.isAdmin === true
  return isAdminInSession || isAdminInDb
}

// GET: CSV-Export für Statistiken
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    // Lade Statistiken vom Statistics-Endpoint
    // Wir verwenden die gleiche Logik wie /api/admin/statistics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Alle Daten parallel laden
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      pendingVerifications,
      newUsersLast30Days,
      newUsersLast7Days,
      totalWatches,
      activeWatches,
      soldWatches,
      auctionWatches,
      buyNowWatches,
      expiredWatches,
      newWatchesLast30Days,
      newWatchesLast7Days,
      allPurchases,
      completedPurchases,
      pendingPurchases,
      cancelledPurchases,
      pendingDisputes,
      resolvedDisputes,
      closedDisputes,
      watchesByCategory,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { verified: true, verificationStatus: 'approved' } }),
      prisma.user.count({ where: { verificationStatus: 'pending' } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
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
      // WICHTIG: Explizites select verwenden, um disputeInitiatedBy zu vermeiden
      prisma.purchase.findMany({
        select: {
          id: true,
          price: true,
          status: true,
          watch: {
            select: { price: true, buyNowPrice: true, isAuction: true },
          },
          // Nur benötigte Felder selektieren (disputeInitiatedBy wird NICHT selektiert)
        },
      }),
      prisma.purchase.count({ where: { status: 'completed' } }),
      prisma.purchase.count({
        where: { status: { in: ['pending', 'payment_confirmed', 'shipped'] } },
      }),
      prisma.purchase.count({ where: { status: 'cancelled' } }),
      prisma.purchase.count({
        where: { disputeStatus: 'pending', disputeOpenedAt: { not: null } },
      }),
      prisma.purchase.count({ where: { disputeStatus: 'resolved' } }),
      prisma.purchase.count({ where: { disputeStatus: 'closed' } }),
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

    // Berechne abgeleitete Werte
    const totalRevenue = allPurchases.reduce((sum, purchase) => {
      return sum + (purchase.price || purchase.watch?.price || 0)
    }, 0)

    const completedRevenue = allPurchases
      .filter(p => p.status === 'completed')
      .reduce((sum, purchase) => {
        return sum + (purchase.price || purchase.watch?.price || 0)
      }, 0)

    const averagePurchasePrice = completedPurchases > 0 ? completedRevenue / completedPurchases : 0
    const successRate = totalWatches > 0 ? (soldWatches / totalWatches) * 100 : 0

    // Berechne durchschnittliche Verkaufsdauer
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
        return (purchaseDate.getTime() - watchCreated.getTime()) / (1000 * 60 * 60 * 24)
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

    // CSV-Header
    const headers = ['Kategorie', 'Metrik', 'Wert', 'Datum']

    // CSV-Zeilen
    const rows: string[] = []

    // Benutzer-Statistiken
    rows.push('Benutzer,Gesamt,' + totalUsers + ',')
    rows.push('Benutzer,Aktiv,' + activeUsers + ',')
    rows.push('Benutzer,Blockiert,' + blockedUsers + ',')
    rows.push('Benutzer,Verifiziert,' + verifiedUsers + ',')
    rows.push('Benutzer,Ausstehende Verifizierungen,' + pendingVerifications + ',')
    rows.push('Benutzer,Neu (30 Tage),' + newUsersLast30Days + ',')
    rows.push('Benutzer,Neu (7 Tage),' + newUsersLast7Days + ',')

    // Angebots-Statistiken
    rows.push('Angebote,Gesamt,' + totalWatches + ',')
    rows.push('Angebote,Aktiv,' + activeWatches + ',')
    rows.push('Angebote,Verkauft,' + soldWatches + ',')
    rows.push('Angebote,Abgelaufen,' + expiredWatches + ',')
    rows.push('Angebote,Auktionen,' + auctionWatches + ',')
    rows.push('Angebote,Sofortkauf,' + buyNowWatches + ',')
    rows.push('Angebote,Neu (30 Tage),' + newWatchesLast30Days + ',')
    rows.push('Angebote,Neu (7 Tage),' + newWatchesLast7Days + ',')
    rows.push('Angebote,Erfolgsrate (%),' + successRate.toFixed(2) + ',')
    rows.push('Angebote,Ø Verkaufsdauer (Tage),' + averageSaleDuration.toFixed(2) + ',')

    // Transaktions-Statistiken
    rows.push('Transaktionen,Gesamt,' + allPurchases.length + ',')
    rows.push('Transaktionen,Abgeschlossen,' + completedPurchases + ',')
    rows.push('Transaktionen,Ausstehend,' + pendingPurchases + ',')
    rows.push('Transaktionen,Storniert,' + cancelledPurchases + ',')
    rows.push('Transaktionen,Gesamtumsatz (CHF),' + totalRevenue.toFixed(2) + ',')
    rows.push('Transaktionen,Abgeschlossener Umsatz (CHF),' + completedRevenue.toFixed(2) + ',')
    rows.push('Transaktionen,Ø Verkaufspreis (CHF),' + averagePurchasePrice.toFixed(2) + ',')

    // Disputes
    rows.push('Disputes,Offen,' + pendingDisputes + ',')
    rows.push('Disputes,Gelöst,' + resolvedDisputes + ',')
    rows.push('Disputes,Geschlossen,' + closedDisputes + ',')
    rows.push('Disputes,Gesamt,' + (pendingDisputes + resolvedDisputes + closedDisputes) + ',')

    // Rechnungen
    rows.push('Rechnungen,Gesamt,' + totalInvoices + ',')
    rows.push('Rechnungen,Bezahlt,' + paidInvoices + ',')
    rows.push('Rechnungen,Ausstehend,' + pendingInvoices + ',')
    rows.push('Rechnungen,Überfällig,' + overdueInvoices + ',')

    // Top Kategorien
    topCategories.forEach(cat => {
      rows.push('Kategorien,' + cat.category + ',' + cat.count + ',')
    })

    // Zeitliche Entwicklung
    dailyStats.forEach(day => {
      rows.push('Entwicklung (7 Tage),' + day.date + ',Benutzer,' + day.users)
      rows.push('Entwicklung (7 Tage),' + day.date + ',Angebote,' + day.watches)
      rows.push('Entwicklung (7 Tage),' + day.date + ',Käufe,' + day.purchases)
    })

    const csv = [headers.join(','), ...rows].join('\n')

    const filename = `helvenda-statistiken-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting statistics:', error)
    return NextResponse.json({ message: 'Fehler beim Export: ' + error.message }, { status: 500 })
  }
}
