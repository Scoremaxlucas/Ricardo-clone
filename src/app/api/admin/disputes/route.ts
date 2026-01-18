/**
 * Admin Disputes API
 * Alle Disputes und Stornierungsanträge für Admin
 *
 * AKTUALISIERT: Kombiniert Order-Disputes (neu) mit Purchase-Disputes (legacy)
 */

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Admin-Prüfung
    const authError = await requireAdmin()
    if (authError) return authError

    // Filter-Parameter
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // pending, resolved, closed, all
    const type = searchParams.get('type') || 'all' // all, dispute, cancellation
    const source = searchParams.get('source') || 'all' // all, order, purchase
    const sortBy = searchParams.get('sortBy') || 'openedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // === LADE ORDER-DISPUTES (NEU) ===
    const orderDisputes = (source === 'all' || source === 'order') && (type === 'all' || type === 'dispute')
      ? await prisma.order.findMany({
          where: {
            disputeStatus: status && status !== 'all'
              ? status
              : { not: 'none' },
          },
          select: {
            id: true,
            orderNumber: true,
            watchId: true,
            itemPrice: true,
            totalAmount: true,
            orderStatus: true,
            paymentStatus: true,
            paymentMethod: true,
            disputeStatus: true,
            disputeOpenedAt: true,
            disputeReason: true,
            disputeDescription: true,
            disputeResolvedAt: true,
            disputeResolvedBy: true,
            createdAt: true,
            watch: {
              select: {
                id: true,
                title: true,
                brand: true,
                model: true,
                images: true,
                price: true,
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
            [sortBy === 'openedAt' ? 'disputeOpenedAt' : 'disputeResolvedAt']:
              sortOrder === 'asc' ? 'asc' : 'desc',
          },
        })
      : []

    // === LADE LEGACY PURCHASE-DISPUTES ===
    const purchaseDisputeWhere: any = {
      disputeOpenedAt: { not: null },
    }
    if (status && status !== 'all') {
      purchaseDisputeWhere.disputeStatus = status
    }

    const purchaseDisputes = (source === 'all' || source === 'purchase') && (type === 'all' || type === 'dispute')
      ? await prisma.purchase.findMany({
          where: purchaseDisputeWhere,
          select: {
            id: true,
            watchId: true,
            price: true,
            status: true,
            createdAt: true,
            disputeOpenedAt: true,
            disputeReason: true,
            disputeDescription: true,
            disputeStatus: true,
            disputeResolvedAt: true,
            disputeResolvedBy: true,
            disputeDeadline: true,
            disputeAttachments: true,
            disputeReminderCount: true,
            disputeEscalationLevel: true,
            sellerResponseDeadline: true,
            sellerRespondedAt: true,
            disputeRefundRequired: true,
            disputeRefundAmount: true,
            watch: {
              select: {
                id: true,
                title: true,
                brand: true,
                model: true,
                images: true,
                price: true,
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
          },
          orderBy: {
            [sortBy === 'openedAt' ? 'disputeOpenedAt' : 'disputeResolvedAt']:
              sortOrder === 'asc' ? 'asc' : 'desc',
          },
        })
      : []

    // === LADE STORNIERUNGSANTRÄGE (nur aus Purchase) ===
    const cancellationWhere: any = {
      cancellationRequestedAt: { not: null },
    }
    if (status && status !== 'all') {
      cancellationWhere.cancellationRequestStatus = status
    }

    const cancellationPurchases = (type === 'all' || type === 'cancellation') && (source === 'all' || source === 'purchase')
      ? await prisma.purchase.findMany({
          where: cancellationWhere,
          select: {
            id: true,
            watchId: true,
            price: true,
            status: true,
            createdAt: true,
            cancellationRequestedAt: true,
            cancellationRequestReason: true,
            cancellationRequestDescription: true,
            cancellationRequestStatus: true,
            cancellationRequestResolvedAt: true,
            cancellationRequestResolvedBy: true,
            watch: {
              select: {
                id: true,
                title: true,
                brand: true,
                model: true,
                images: true,
                price: true,
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
          },
          orderBy: {
            cancellationRequestedAt: sortOrder === 'asc' ? 'asc' : 'desc',
          },
        })
      : []

    // === FORMATIERE ORDER-DISPUTES ===
    const formattedOrderDisputes = orderDisputes.map(order => {
      let images: string[] = []
      try {
        if (order.watch.images) {
          images = typeof order.watch.images === 'string'
            ? JSON.parse(order.watch.images)
            : order.watch.images
        }
      } catch (e) {
        images = []
      }

      const buyerName = order.buyer.nickname || order.buyer.firstName || order.buyer.name || 'Unbekannt'
      const sellerName = order.seller.nickname || order.seller.firstName || order.seller.name || 'Unbekannt'

      return {
        id: order.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        purchaseId: null, // Kein Purchase
        watchId: order.watchId,
        watch: {
          id: order.watch.id,
          title: order.watch.title,
          brand: order.watch.brand,
          model: order.watch.model,
          images,
          price: order.watch.price,
        },
        buyer: {
          id: order.buyer.id,
          name: buyerName,
          email: order.buyer.email,
        },
        seller: {
          id: order.seller.id,
          name: sellerName,
          email: order.seller.email,
        },
        disputeReason: order.disputeReason || 'unknown',
        disputeDescription: order.disputeDescription || '',
        disputeStatus: order.disputeStatus || 'pending',
        disputeOpenedAt: order.disputeOpenedAt?.toISOString() || null,
        disputeDeadline: null, // Order hat kein separates Deadline-Feld
        disputeAttachments: [],
        disputeReminderCount: 0,
        disputeResolvedAt: order.disputeResolvedAt?.toISOString() || null,
        disputeResolvedBy: order.disputeResolvedBy || null,
        disputeEscalationLevel: 0,
        sellerResponseDeadline: null,
        sellerRespondedAt: null,
        disputeRefundRequired: false,
        disputeRefundAmount: null,
        purchaseStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        purchasePrice: order.itemPrice,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        type: 'dispute' as const,
        source: 'order' as const,
      }
    })

    // === FORMATIERE PURCHASE-DISPUTES (Legacy) ===
    const formattedPurchaseDisputes = purchaseDisputes.map(purchase => {
      let images: string[] = []
      try {
        if (purchase.watch.images) {
          images = typeof purchase.watch.images === 'string'
            ? JSON.parse(purchase.watch.images)
            : purchase.watch.images
        }
      } catch (e) {
        images = []
      }

      const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Unbekannt'
      const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Unbekannt'

      return {
        id: purchase.id,
        orderId: null,
        orderNumber: null,
        purchaseId: purchase.id,
        watchId: purchase.watchId,
        watch: {
          id: purchase.watch.id,
          title: purchase.watch.title,
          brand: purchase.watch.brand,
          model: purchase.watch.model,
          images,
          price: purchase.watch.price,
        },
        buyer: {
          id: purchase.buyer.id,
          name: buyerName,
          email: purchase.buyer.email,
        },
        seller: {
          id: purchase.watch.seller.id,
          name: sellerName,
          email: purchase.watch.seller.email,
        },
        disputeReason: purchase.disputeReason || 'unknown',
        disputeDescription: purchase.disputeDescription || '',
        disputeStatus: purchase.disputeStatus || 'pending',
        disputeOpenedAt: purchase.disputeOpenedAt?.toISOString() || null,
        disputeDeadline: purchase.disputeDeadline?.toISOString() || null,
        disputeAttachments: purchase.disputeAttachments ? JSON.parse(purchase.disputeAttachments) : [],
        disputeReminderCount: purchase.disputeReminderCount || 0,
        disputeResolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
        disputeResolvedBy: purchase.disputeResolvedBy || null,
        disputeEscalationLevel: purchase.disputeEscalationLevel || 0,
        sellerResponseDeadline: purchase.sellerResponseDeadline?.toISOString() || null,
        sellerRespondedAt: purchase.sellerRespondedAt?.toISOString() || null,
        disputeRefundRequired: purchase.disputeRefundRequired || false,
        disputeRefundAmount: purchase.disputeRefundAmount || null,
        purchaseStatus: purchase.status,
        paymentStatus: null,
        purchasePrice: purchase.price,
        totalAmount: purchase.price,
        createdAt: purchase.createdAt.toISOString(),
        type: 'dispute' as const,
        source: 'purchase' as const,
      }
    })

    // === FORMATIERE STORNIERUNGSANTRÄGE ===
    const formattedCancellations = cancellationPurchases.map(purchase => {
      let images: string[] = []
      try {
        if (purchase.watch.images) {
          images = typeof purchase.watch.images === 'string'
            ? JSON.parse(purchase.watch.images)
            : purchase.watch.images
        }
      } catch (e) {
        images = []
      }

      const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Unbekannt'
      const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Unbekannt'

      return {
        id: purchase.id,
        orderId: null,
        orderNumber: null,
        purchaseId: purchase.id,
        watchId: purchase.watchId,
        watch: {
          id: purchase.watch.id,
          title: purchase.watch.title,
          brand: purchase.watch.brand,
          model: purchase.watch.model,
          images,
          price: purchase.watch.price,
        },
        buyer: {
          id: purchase.buyer.id,
          name: buyerName,
          email: purchase.buyer.email,
        },
        seller: {
          id: purchase.watch.seller.id,
          name: sellerName,
          email: purchase.watch.seller.email,
        },
        disputeReason: purchase.cancellationRequestReason || 'unknown',
        disputeDescription: purchase.cancellationRequestDescription || '',
        disputeStatus: purchase.cancellationRequestStatus || 'pending',
        disputeOpenedAt: purchase.cancellationRequestedAt?.toISOString() || null,
        disputeDeadline: null,
        disputeAttachments: [],
        disputeReminderCount: 0,
        disputeResolvedAt: purchase.cancellationRequestResolvedAt?.toISOString() || null,
        disputeResolvedBy: purchase.cancellationRequestResolvedBy || null,
        disputeEscalationLevel: 0,
        sellerResponseDeadline: null,
        sellerRespondedAt: null,
        disputeRefundRequired: false,
        disputeRefundAmount: null,
        purchaseStatus: purchase.status,
        paymentStatus: null,
        purchasePrice: purchase.price,
        totalAmount: purchase.price,
        createdAt: purchase.createdAt.toISOString(),
        type: 'cancellation' as const,
        source: 'purchase' as const,
      }
    })

    // === KOMBINIERE ALLE DISPUTES ===
    const allItems = [
      ...formattedOrderDisputes,
      ...formattedPurchaseDisputes,
      ...formattedCancellations,
    ]

    // Sortiere kombiniert nach Datum
    allItems.sort((a, b) => {
      const dateA = a.disputeOpenedAt ? new Date(a.disputeOpenedAt).getTime() : 0
      const dateB = b.disputeOpenedAt ? new Date(b.disputeOpenedAt).getTime() : 0
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    // === STATISTIKEN ===
    const stats = {
      total: allItems.length,
      pending: allItems.filter(d => d.disputeStatus === 'pending' || d.disputeStatus === 'open').length,
      escalated: allItems.filter(d => d.disputeStatus === 'escalated').length,
      underReview: allItems.filter(d => d.disputeStatus === 'under_review').length,
      resolved: allItems.filter(d => d.disputeStatus === 'resolved').length,
      rejected: allItems.filter(d => d.disputeStatus === 'rejected').length,
      closed: allItems.filter(d => d.disputeStatus === 'closed' || d.disputeStatus === 'rejected').length,
      // Aufschlüsselung nach Quelle
      orderDisputes: formattedOrderDisputes.length,
      purchaseDisputes: formattedPurchaseDisputes.length,
      cancellations: formattedCancellations.length,
    }

    return NextResponse.json({
      disputes: allItems,
      stats,
    })
  } catch (error: any) {
    console.error('[admin/disputes] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Disputes: ' + error.message },
      { status: 500 }
    )
  }
}
