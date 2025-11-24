import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET: Dispute-Details abrufen (nur für Admins)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe Admin-Status: Zuerst aus Session, dann aus Datenbank
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
    
    // Prüfe ob User Admin ist (per ID oder E-Mail)
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, email: true }
      })
    }

    // Falls nicht gefunden per ID, versuche per E-Mail
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true }
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = user?.isAdmin === true || user?.isAdmin === 1
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
                paymentMethods: true
              }
            }
          }
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
            paymentMethods: true
          }
        }
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { message: 'Kauf nicht gefunden' },
        { status: 404 }
      )
    }

    if (!purchase.disputeOpenedAt) {
      return NextResponse.json(
        { message: 'Für diesen Kauf wurde kein Dispute eröffnet' },
        { status: 400 }
      )
    }

    // Dispute-Reason und Description sind jetzt getrennt gespeichert
    const reason = purchase.disputeReason || 'unknown'
    const description = purchase.disputeDescription || ''

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
          buyNowPrice: purchase.watch.buyNowPrice
        },
        buyer: {
          id: purchase.buyer.id,
          name: purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Unbekannt',
          email: purchase.buyer.email,
          phone: purchase.buyer.phone,
          address: purchase.buyer.street && purchase.buyer.streetNumber
            ? `${purchase.buyer.street} ${purchase.buyer.streetNumber}, ${purchase.buyer.postalCode} ${purchase.buyer.city}`
            : null,
          paymentMethods: buyerPaymentMethods
        },
        seller: {
          id: purchase.watch.seller.id,
          name: purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Unbekannt',
          email: purchase.watch.seller.email,
          phone: purchase.watch.seller.phone,
          address: purchase.watch.seller.street && purchase.watch.seller.streetNumber
            ? `${purchase.watch.seller.street} ${purchase.watch.seller.streetNumber}, ${purchase.watch.seller.postalCode} ${purchase.watch.seller.city}`
            : null,
          paymentMethods: sellerPaymentMethods
        },
        disputeReason: reason,
        disputeDescription: description,
        disputeStatus: purchase.disputeStatus || 'pending',
        disputeOpenedAt: purchase.disputeOpenedAt?.toISOString() || null,
        disputeResolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
        disputeResolvedBy: purchase.disputeResolvedBy || null,
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
        statusHistory
      }
    })
  } catch (error: any) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Dispute-Details: ' + error.message },
      { status: 500 }
    )
  }
}

