/**
 * Admin Stats API
 * Liefert Statistiken für das Admin-Dashboard
 *
 * AKTUALISIERT: Verwendet jetzt Order-Tabelle statt Purchase für aktuelle Daten
 */

import { shouldShowDetailedErrors } from '@/lib/env'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { prismaWherePendingSellerVerificationReview } from '@/lib/verification'
import { RentalListingStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Admin-Prüfung mit zentralem Helper
    const authError = await requireAdmin()
    if (authError) return authError

    const now = new Date()

    // Statistiken berechnen - AKTUALISIERT für Order-Tabelle
    const [
      // Benutzer-Statistiken
      totalUsers,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      pendingVerifications,

      // Angebots-Statistiken
      totalWatches,

      // NEU: Verwende Order-Tabelle für verkaufte Artikel und Umsatz
      orders,

      // Aktive Watches (ohne Order)
      activeWatchesCount,

      // Dispute-Statistiken - AKTUALISIERT: Kombiniere Order und Purchase Disputes
      orderDisputes,
      purchaseDisputes,

      // Payout Change Requests
      pendingPayoutChangeRequests,

      // Kontakt / Rechnungen (Dashboard-Badges)
      openContactRequests,
      openInvoicesNeedingAction,

      // Helvenda Wohnen (Kurz-KPIs für Haupt-Dashboard)
      wohnenActiveListings,
      wohnenApplicationsLast7Days,
      wohnenOutboxAlerts,
      wohnenNeedsExpiryReview,
    ] = await Promise.all([
      // Benutzer
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { verified: true, verificationStatus: 'approved' } }),
      // Nur eingereichte Ausweis-Verifizierungen, die auf Admin-Review warten
      prisma.user.count({
        where: prismaWherePendingSellerVerificationReview,
      }),

      // Angebote
      prisma.watch.count(),

      // Orders (für Umsatz und verkaufte Artikel)
      prisma.order.findMany({
        select: {
          id: true,
          itemPrice: true,
          platformFee: true,
          paymentStatus: true,
          orderStatus: true,
        },
      }),

      // Aktive Angebote (ohne Order und nicht abgelaufen)
      prisma.watch.count({
        where: {
          orders: { none: {} },
          OR: [
            { auctionEnd: null },
            { auctionEnd: { gt: now } },
          ],
        },
      }),

      // Order Disputes (neue Disputes)
      prisma.order.findMany({
        where: {
          disputeStatus: { not: 'none' },
        },
        select: {
          id: true,
          disputeStatus: true,
        },
      }),

      // Purchase Disputes (Legacy-Disputes)
      prisma.purchase.findMany({
        where: { disputeOpenedAt: { not: null } },
        select: {
          id: true,
          disputeStatus: true,
        },
      }),

      // Payout Change Requests
      prisma.payoutChangeRequest.count({
        where: { status: 'PENDING' },
      }),

      prisma.contactRequest.count({
        where: { status: { in: ['pending', 'in_progress'] } },
      }),

      prisma.invoice.count({
        where: {
          status: { in: ['pending', 'overdue'] },
          collectionStopped: false,
        },
      }),

      prisma.rentalListing.count({ where: { status: RentalListingStatus.active } }),

      prisma.rentalApplication.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),

      prisma.wohnenEmailOutbox.count({
        where: { status: { in: ['pending', 'failed'] } },
      }),

      prisma.rentalListing.count({ where: { needsExpiryReview: true } }),
    ])

    // Berechne Umsatz aus Orders (korrekte Datenquelle)
    const completedOrders = orders.filter(
      o => o.paymentStatus === 'paid' || o.paymentStatus === 'released'
    )
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.itemPrice, 0)

    // Plattform-Marge aus Orders (akkurat)
    const platformMargin = completedOrders.reduce((sum, order) => sum + (order.platformFee || 0), 0)

    // Verkaufte Angebote = Orders mit bezahltem Status
    const soldWatches = completedOrders.length

    // Kombiniere Disputes aus beiden Tabellen
    const orderPendingDisputes = orderDisputes.filter(
      d => d.disputeStatus === 'pending' || d.disputeStatus === 'open'
    ).length
    const purchasePendingDisputes = purchaseDisputes.filter(
      d => d.disputeStatus === 'pending'
    ).length
    const pendingDisputes = orderPendingDisputes + purchasePendingDisputes

    const result = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      blockedUsers: blockedUsers || 0,
      totalWatches: totalWatches || 0,
      activeWatches: activeWatchesCount || 0,
      soldWatches: soldWatches || 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      platformMargin: Math.round(platformMargin * 100) / 100,
      verifiedUsers: verifiedUsers || 0,
      pendingVerifications: pendingVerifications || 0,
      pendingDisputes: pendingDisputes || 0,
      pendingPayoutChangeRequests: pendingPayoutChangeRequests || 0,
      // Zusätzliche Stats für bessere Übersicht
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      pendingContactRequests: openContactRequests || 0,
      openInvoicesNeedingAction: openInvoicesNeedingAction || 0,
      wohnenActiveListings: wohnenActiveListings || 0,
      wohnenApplicationsLast7Days: wohnenApplicationsLast7Days || 0,
      wohnenOutboxAlerts: wohnenOutboxAlerts || 0,
      wohnenNeedsExpiryReview: wohnenNeedsExpiryReview || 0,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[admin/stats] Error:', error)

    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Statistiken',
        error: error?.message || 'Unbekannter Fehler',
        stack: shouldShowDetailedErrors() ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}
