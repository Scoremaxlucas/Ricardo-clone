import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET: Alle Disputes abrufen (nur für Admins)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe Admin-Status
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

    // Filter-Parameter
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // pending, resolved, closed
    const sortBy = searchParams.get('sortBy') || 'openedAt' // openedAt, resolvedAt
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc

    // Baue Where-Klausel
    const where: any = {
      disputeOpenedAt: { not: null }
    }

    if (status && status !== 'all') {
      where.disputeStatus = status
    }

    // Lade alle Disputes mit zugehörigen Daten
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
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
                nickname: true
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
            nickname: true
          }
        }
      },
      orderBy: {
        [sortBy === 'openedAt' ? 'disputeOpenedAt' : 'disputeResolvedAt']: sortOrder === 'asc' ? 'asc' : 'desc'
      }
    })

    // Formatiere Daten für Frontend
    const disputes = purchases.map(purchase => {
      const reason = purchase.disputeReason || 'unknown'
      const description = purchase.disputeDescription || ''

      return {
        id: purchase.id,
        purchaseId: purchase.id,
        watchId: purchase.watchId,
        watch: {
          id: purchase.watch.id,
          title: purchase.watch.title,
          brand: purchase.watch.brand,
          model: purchase.watch.model,
          images: purchase.watch.images ? JSON.parse(purchase.watch.images) : [],
          price: purchase.watch.price
        },
        buyer: {
          id: purchase.buyer.id,
          name: purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Unbekannt',
          email: purchase.buyer.email
        },
        seller: {
          id: purchase.watch.seller.id,
          name: purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Unbekannt',
          email: purchase.watch.seller.email
        },
        disputeReason: reason,
        disputeDescription: description,
        disputeStatus: purchase.disputeStatus || 'pending',
        disputeOpenedAt: purchase.disputeOpenedAt?.toISOString() || null,
        disputeResolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
        disputeResolvedBy: purchase.disputeResolvedBy || null,
        purchaseStatus: purchase.status,
        purchasePrice: purchase.price,
        createdAt: purchase.createdAt.toISOString()
      }
    })

    // Statistiken
    const stats = {
      total: disputes.length,
      pending: disputes.filter(d => d.disputeStatus === 'pending').length,
      resolved: disputes.filter(d => d.disputeStatus === 'resolved').length,
      closed: disputes.filter(d => d.disputeStatus === 'closed').length
    }

    return NextResponse.json({
      disputes,
      stats
    })
  } catch (error: any) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Disputes: ' + error.message },
      { status: 500 }
    )
  }
}

