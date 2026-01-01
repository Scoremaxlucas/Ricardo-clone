import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET: Dispute-Details für Käufer/Verkäufer abrufen
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Lade Purchase mit allen relevanten Daten
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        watchId: true,
        buyerId: true,
        status: true,
        price: true,
        createdAt: true,
        disputeOpenedAt: true,
        disputeReason: true,
        disputeDescription: true,
        disputeStatus: true,
        disputeDeadline: true,
        disputeResolvedAt: true,
        disputeResolvedBy: true,
        disputeAttachments: true,
        // Ricardo-Style Fields
        sellerResponseDeadline: true,
        sellerRespondedAt: true,
        disputeEscalationLevel: true,
        disputeEscalationReason: true,
        disputeRefundRequired: true,
        disputeRefundAmount: true,
        disputeRefundDeadline: true,
        disputeRefundCompletedAt: true,
        watch: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            images: true,
            price: true,
            sellerId: true,
            paymentProtectionEnabled: true,
            seller: {
              select: {
                id: true,
                name: true,
                nickname: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            nickname: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe Berechtigung (nur Käufer oder Verkäufer)
    const isSeller = purchase.watch.sellerId === session.user.id
    const isBuyer = purchase.buyerId === session.user.id

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Dispute anzuzeigen' },
        { status: 403 }
      )
    }

    // Prüfe ob ein Dispute existiert
    if (!purchase.disputeOpenedAt) {
      return NextResponse.json(
        { message: 'Kein Dispute für diesen Kauf vorhanden' },
        { status: 404 }
      )
    }

    // Parse images
    let images: string[] = []
    try {
      if (typeof purchase.watch.images === 'string') {
        images = JSON.parse(purchase.watch.images)
      } else if (Array.isArray(purchase.watch.images)) {
        images = purchase.watch.images
      }
    } catch (e) {
      images = []
    }

    // Parse attachments
    let attachments: string[] = []
    try {
      if (purchase.disputeAttachments) {
        attachments = JSON.parse(purchase.disputeAttachments)
      }
    } catch (e) {
      attachments = []
    }

    // Format response
    const buyerName =
      purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'

    const sellerName =
      purchase.watch.seller.nickname ||
      purchase.watch.seller.firstName ||
      purchase.watch.seller.name ||
      'Verkäufer'

    return NextResponse.json({
      dispute: {
        id: purchase.id,
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
          email: isSeller ? purchase.buyer.email : undefined, // Nur Verkäufer sieht E-Mail des Käufers
          image: purchase.buyer.image,
        },
        seller: {
          id: purchase.watch.seller.id,
          name: sellerName,
          email: isBuyer ? purchase.watch.seller.email : undefined, // Nur Käufer sieht E-Mail des Verkäufers
          image: purchase.watch.seller.image,
        },
        disputeReason: purchase.disputeReason,
        disputeDescription: purchase.disputeDescription,
        disputeStatus: purchase.disputeStatus,
        disputeOpenedAt: purchase.disputeOpenedAt?.toISOString() || null,
        disputeDeadline: purchase.disputeDeadline?.toISOString() || null,
        disputeResolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
        disputeAttachments: attachments,
        purchaseStatus: purchase.status,
        purchasePrice: purchase.price,
        createdAt: purchase.createdAt.toISOString(),
        paymentProtectionEnabled: purchase.watch.paymentProtectionEnabled,
        userRole: isBuyer ? 'buyer' : 'seller',
        // Ricardo-Style Fields
        sellerResponseDeadline: purchase.sellerResponseDeadline?.toISOString() || null,
        sellerRespondedAt: purchase.sellerRespondedAt?.toISOString() || null,
        disputeEscalationLevel: purchase.disputeEscalationLevel || 0,
        disputeEscalationReason: purchase.disputeEscalationReason || null,
        disputeRefundRequired: purchase.disputeRefundRequired || false,
        disputeRefundAmount: purchase.disputeRefundAmount || null,
        disputeRefundDeadline: purchase.disputeRefundDeadline?.toISOString() || null,
        disputeRefundCompletedAt: purchase.disputeRefundCompletedAt?.toISOString() || null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Disputes: ' + error.message },
      { status: 500 }
    )
  }
}
