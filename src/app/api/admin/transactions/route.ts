/**
 * Admin Transactions API
 * Liefert alle Transaktionen für die Admin-Übersicht
 *
 * AKTUALISIERT: Verwendet jetzt primär Order-Tabelle,
 * inkludiert aber auch Legacy-Purchase-Daten für vollständige Historie
 */

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Admin-Prüfung
    const authError = await requireAdmin()
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') || 'all' // 'all', 'orders', 'legacy'
    const limit = parseInt(searchParams.get('limit') || '100')

    // Lade Orders (NEUE Transaktionen)
    const orders = source !== 'legacy' ? await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        itemPrice: true,
        shippingCost: true,
        platformFee: true,
        protectionFee: true,
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        paymentMethod: true,
        paidAt: true,
        createdAt: true,
        watch: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    }) : []

    // Lade Legacy-Purchases (für historische Daten)
    const legacyPurchases = source !== 'orders' ? await prisma.purchase.findMany({
      select: {
        id: true,
        price: true,
        status: true,
        createdAt: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
        watch: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            price: true,
            sellerId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    }) : []

    // Hole Seller-Infos für Legacy-Purchases
    const sellerIds = Array.from(new Set(legacyPurchases.map(p => p.watch.sellerId)))
    const sellers = sellerIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, email: true, firstName: true, lastName: true, nickname: true },
    }) : []
    const sellerMap = new Map(sellers.map(s => [s.id, s]))

    // Formatiere Orders als Transaktionen
    const orderTransactions = orders.map(order => {
      const buyerName = order.buyer.nickname || order.buyer.firstName || order.buyer.name || 'Unbekannt'
      const sellerName = order.seller.nickname || order.seller.firstName || order.seller.name || 'Unbekannt'

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        type: 'order' as const,
        source: 'order' as const,
        price: order.itemPrice,
        shippingCost: order.shippingCost,
        platformFee: order.platformFee,
        protectionFee: order.protectionFee,
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        buyerId: order.buyer.id,
        buyerName,
        buyerEmail: order.buyer.email,
        sellerId: order.seller.id,
        sellerName,
        sellerEmail: order.seller.email,
        watchId: order.watch.id,
        watchTitle: order.watch.title,
        watchBrand: order.watch.brand,
        watchModel: order.watch.model,
        paidAt: order.paidAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
      }
    })

    // Formatiere Legacy-Purchases als Transaktionen
    const legacyTransactions = legacyPurchases.map(p => {
      const price = p.price || p.watch.price || 0
      const seller = sellerMap.get(p.watch.sellerId)
      const buyerName = p.buyer.nickname || p.buyer.firstName || p.buyer.name || 'Unbekannt'
      const sellerName = seller?.nickname || seller?.firstName || seller?.name || 'Unbekannt'

      // Berechne Marge (Legacy: 10% mit max CHF 220)
      const calculatedMargin = price * 0.1
      const platformFee = Math.min(calculatedMargin, 220)

      return {
        id: p.id,
        orderNumber: null,
        type: 'legacy_purchase' as const,
        source: 'purchase' as const,
        price,
        shippingCost: 0,
        platformFee,
        protectionFee: null,
        totalAmount: price,
        status: p.status,
        paymentStatus: p.status === 'completed' ? 'paid' : p.status,
        paymentMethod: null,
        buyerId: p.buyer.id,
        buyerName,
        buyerEmail: p.buyer.email,
        sellerId: p.watch.sellerId,
        sellerName,
        sellerEmail: seller?.email || '',
        watchId: p.watch.id,
        watchTitle: p.watch.title,
        watchBrand: p.watch.brand,
        watchModel: p.watch.model,
        paidAt: null,
        createdAt: p.createdAt.toISOString(),
      }
    })

    // Kombiniere und sortiere nach Datum
    const allTransactions = [...orderTransactions, ...legacyTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    // Berechne Statistiken (nur aus Orders für Genauigkeit)
    const paidOrders = orders.filter(o =>
      o.paymentStatus === 'paid' || o.paymentStatus === 'released'
    )

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.itemPrice, 0)
    const totalPlatformFees = paidOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0)

    // Legacy-Umsatz separat berechnen
    const completedLegacy = legacyPurchases.filter(p => p.status === 'completed')
    const legacyRevenue = completedLegacy.reduce((sum, p) => sum + (p.price || p.watch.price || 0), 0)

    return NextResponse.json({
      transactions: allTransactions,
      stats: {
        // Aktuelle Order-Statistiken (primär)
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        orderRevenue: Math.round(totalRevenue * 100) / 100,
        platformFees: Math.round(totalPlatformFees * 100) / 100,

        // Legacy-Statistiken (sekundär)
        legacyPurchases: legacyPurchases.length,
        completedLegacyPurchases: completedLegacy.length,
        legacyRevenue: Math.round(legacyRevenue * 100) / 100,

        // Kombiniert
        totalTransactions: allTransactions.length,
        totalRevenue: Math.round((totalRevenue + legacyRevenue) * 100) / 100,
        platformMargin: Math.round(totalPlatformFees * 100) / 100,
      },
    })
  } catch (error: any) {
    console.error('[admin/transactions] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Transaktionen', error: error.message },
      { status: 500 }
    )
  }
}
