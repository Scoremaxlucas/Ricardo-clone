import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET: Dispute-Details abrufen (nur für Admins)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    // Lade Purchase mit allen Details
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                nickname: true,
                phone: true,
                street: true,
                streetNumber: true,
                postalCode: true,
                city: true,
                paymentMethods: true,
                // Ricardo-Style: Seller warning info
                disputeWarningCount: true,
                disputesLostCount: true,
                disputeRestrictionLevel: true,
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
            phone: true,
            street: true,
            streetNumber: true,
            postalCode: true,
            city: true,
            paymentMethods: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob es ein Dispute oder Stornierungsantrag ist
    const isDispute = purchase.disputeOpenedAt !== null
    const isCancellation = purchase.cancellationRequestedAt !== null

    if (!isDispute && !isCancellation) {
      return NextResponse.json(
        { message: 'Für diesen Kauf wurde weder ein Dispute noch ein Stornierungsantrag eröffnet' },
        { status: 400 }
      )
    }

    // Verwende die entsprechenden Felder je nach Typ
    const reason = isCancellation
      ? purchase.cancellationRequestReason || 'unknown'
      : purchase.disputeReason || 'unknown'
    const description = isCancellation
      ? purchase.cancellationRequestDescription || ''
      : purchase.disputeDescription || ''
    const status = isCancellation
      ? purchase.cancellationRequestStatus || 'pending'
      : purchase.disputeStatus || 'pending'
    const openedAt = isCancellation ? purchase.cancellationRequestedAt : purchase.disputeOpenedAt
    const resolvedAt = isCancellation
      ? purchase.cancellationRequestResolvedAt
      : purchase.disputeResolvedAt
    const resolvedBy = isCancellation
      ? purchase.cancellationRequestResolvedBy
      : purchase.disputeResolvedBy

    // Parse Dispute-Attachments (nur bei echten Disputes, nicht Stornierungen)
    let disputeAttachments: string[] = []
    if (!isCancellation && purchase.disputeAttachments) {
      try {
        disputeAttachments = JSON.parse(purchase.disputeAttachments)
      } catch (e) {
        console.error('Error parsing dispute attachments:', e)
      }
    }

    // Parse Status-Historie
    let statusHistory: any[] = []
    if (purchase.statusHistory) {
      try {
        statusHistory = JSON.parse(purchase.statusHistory)
      } catch (e) {
        console.error('Error parsing status history:', e)
      }
    }

    // Parse Images
    const images = purchase.watch.images ? JSON.parse(purchase.watch.images) : []

    // Parse Payment Methods
    const buyerPaymentMethods = purchase.buyer.paymentMethods
      ? JSON.parse(purchase.buyer.paymentMethods)
      : []
    const sellerPaymentMethods = purchase.watch.seller.paymentMethods
      ? JSON.parse(purchase.watch.seller.paymentMethods)
      : []

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
          buyNowPrice: purchase.watch.buyNowPrice,
        },
        buyer: {
          id: purchase.buyer.id,
          name:
            purchase.buyer.nickname ||
            purchase.buyer.firstName ||
            purchase.buyer.name ||
            'Unbekannt',
          email: purchase.buyer.email,
          phone: purchase.buyer.phone,
          address:
            purchase.buyer.street && purchase.buyer.streetNumber
              ? `${purchase.buyer.street} ${purchase.buyer.streetNumber}, ${purchase.buyer.postalCode} ${purchase.buyer.city}`
              : null,
          paymentMethods: buyerPaymentMethods,
        },
        seller: {
          id: purchase.watch.seller.id,
          name:
            purchase.watch.seller.nickname ||
            purchase.watch.seller.firstName ||
            purchase.watch.seller.name ||
            'Unbekannt',
          email: purchase.watch.seller.email,
          phone: purchase.watch.seller.phone,
          address:
            purchase.watch.seller.street && purchase.watch.seller.streetNumber
              ? `${purchase.watch.seller.street} ${purchase.watch.seller.streetNumber}, ${purchase.watch.seller.postalCode} ${purchase.watch.seller.city}`
              : null,
          paymentMethods: sellerPaymentMethods,
          // Ricardo-Style: Seller warning info
          disputeWarningCount: purchase.watch.seller.disputeWarningCount || 0,
          disputesLostCount: purchase.watch.seller.disputesLostCount || 0,
          disputeRestrictionLevel: purchase.watch.seller.disputeRestrictionLevel || null,
        },
        disputeReason: reason,
        disputeDescription: description,
        disputeStatus: status,
        disputeOpenedAt: openedAt?.toISOString() || null,
        disputeDeadline: purchase.disputeDeadline?.toISOString() || null,
        disputeFrozenAt: purchase.disputeFrozenAt?.toISOString() || null,
        disputeAttachments,
        disputeReminderCount: purchase.disputeReminderCount || 0,
        disputeReminderSentAt: purchase.disputeReminderSentAt?.toISOString() || null,
        disputeResolvedAt: resolvedAt?.toISOString() || null,
        disputeResolvedBy: resolvedBy || null,
        // Ricardo-Style Fields
        disputeInitiatedBy: purchase.disputeInitiatedBy || null,
        sellerResponseDeadline: purchase.sellerResponseDeadline?.toISOString() || null,
        sellerRespondedAt: purchase.sellerRespondedAt?.toISOString() || null,
        sellerResponseText: purchase.sellerResponseText || null,
        disputeEscalatedAt: purchase.disputeEscalatedAt?.toISOString() || null,
        disputeEscalationLevel: purchase.disputeEscalationLevel || 0,
        disputeEscalationReason: purchase.disputeEscalationReason || null,
        disputeRefundRequired: purchase.disputeRefundRequired || false,
        disputeRefundAmount: purchase.disputeRefundAmount || null,
        disputeRefundDeadline: purchase.disputeRefundDeadline?.toISOString() || null,
        disputeRefundCompletedAt: purchase.disputeRefundCompletedAt?.toISOString() || null,
        sellerWarningIssued: purchase.sellerWarningIssued || false,
        sellerWarningReason: purchase.sellerWarningReason || null,
        stripePaymentIntentId: purchase.stripePaymentIntentId || null,
        type: isCancellation ? 'cancellation' : 'dispute',
        purchaseStatus: purchase.status,
        purchasePrice: purchase.price,
        shippingMethod: purchase.shippingMethod,
        itemReceived: purchase.itemReceived,
        itemReceivedAt: purchase.itemReceivedAt?.toISOString() || null,
        paymentConfirmed: purchase.paymentConfirmed,
        paymentConfirmedAt: purchase.paymentConfirmedAt?.toISOString() || null,
        contactDeadline: purchase.contactDeadline?.toISOString() || null,
        sellerContactedAt: purchase.sellerContactedAt?.toISOString() || null,
        buyerContactedAt: purchase.buyerContactedAt?.toISOString() || null,
        trackingNumber: purchase.trackingNumber,
        trackingProvider: purchase.trackingProvider,
        shippedAt: purchase.shippedAt?.toISOString() || null,
        createdAt: purchase.createdAt.toISOString(),
        statusHistory,
      },
    })
  } catch (error: any) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Dispute-Details: ' + error.message },
      { status: 500 }
    )
  }
}
