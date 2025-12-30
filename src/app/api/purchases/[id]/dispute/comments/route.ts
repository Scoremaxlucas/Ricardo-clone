import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET: Dispute-Kommentare abrufen
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Lade Purchase für Berechtigungsprüfung
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        buyerId: true,
        watch: { select: { sellerId: true } },
        disputeOpenedAt: true,
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe Berechtigung
    const isSeller = purchase.watch.sellerId === session.user.id
    const isBuyer = purchase.buyerId === session.user.id
    const isAdmin = session.user.isAdmin === true

    if (!isSeller && !isBuyer && !isAdmin) {
      return NextResponse.json({ message: 'Nicht berechtigt' }, { status: 403 })
    }

    // Lade Kommentare (interne Notizen nur für Admins)
    const comments = await prisma.disputeComment.findMany({
      where: {
        purchaseId: id,
        ...(isAdmin ? {} : { isInternal: false }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            firstName: true,
            image: true,
            isAdmin: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      comments: comments.map(c => ({
        id: c.id,
        type: c.type,
        content: c.content,
        userRole: c.userRole,
        attachments: c.attachments ? JSON.parse(c.attachments) : [],
        isInternal: c.isInternal,
        createdAt: c.createdAt.toISOString(),
        user: {
          id: c.user.id,
          name: c.user.nickname || c.user.firstName || c.user.name || 'Unbekannt',
          image: c.user.image,
          isAdmin: c.user.isAdmin,
        },
      })),
    })
  } catch (error: any) {
    console.error('Error fetching dispute comments:', error)
    return NextResponse.json({ message: 'Fehler beim Laden der Kommentare' }, { status: 500 })
  }
}

/**
 * POST: Neuen Kommentar hinzufügen
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const { content, attachments, isInternal } = await request.json()

    if (!content || content.trim().length < 5) {
      return NextResponse.json(
        { message: 'Kommentar muss mindestens 5 Zeichen haben' },
        { status: 400 }
      )
    }

    // Lade Purchase mit Dispute-Status
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, nickname: true, firstName: true },
        },
        watch: {
          select: {
            title: true,
            seller: {
              select: { id: true, name: true, email: true, nickname: true, firstName: true },
            },
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    if (!purchase.disputeOpenedAt) {
      return NextResponse.json({ message: 'Kein aktiver Dispute vorhanden' }, { status: 400 })
    }

    if (purchase.disputeStatus === 'resolved' || purchase.disputeStatus === 'closed') {
      return NextResponse.json({ message: 'Dispute ist bereits abgeschlossen' }, { status: 400 })
    }

    // Prüfe Berechtigung
    const isSeller = purchase.watch.seller.id === session.user.id
    const isBuyer = purchase.buyerId === session.user.id
    const isAdmin = session.user.isAdmin === true

    if (!isSeller && !isBuyer && !isAdmin) {
      return NextResponse.json({ message: 'Nicht berechtigt' }, { status: 403 })
    }

    // Interne Notizen nur für Admins
    if (isInternal && !isAdmin) {
      return NextResponse.json(
        { message: 'Interne Notizen sind nur für Admins erlaubt' },
        { status: 403 }
      )
    }

    // Bestimme User-Rolle
    const userRole = isAdmin ? 'admin' : isBuyer ? 'buyer' : 'seller'

    // Erstelle Kommentar
    const comment = await prisma.disputeComment.create({
      data: {
        purchaseId: id,
        userId: session.user.id,
        userRole,
        type: 'comment',
        content: content.trim(),
        attachments: attachments ? JSON.stringify(attachments) : null,
        isInternal: isInternal || false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            firstName: true,
            image: true,
            isAdmin: true,
          },
        },
      },
    })

    // Benachrichtigung an andere Parteien (wenn nicht interne Notiz)
    if (!isInternal) {
      const commenterName = session.user.name || 'Ein Nutzer'
      const notifyUsers: { id: string; email: string; name: string; link: string }[] = []

      // Bestimme wer benachrichtigt werden soll
      if (!isBuyer) {
        notifyUsers.push({
          id: purchase.buyerId,
          email: purchase.buyer.email,
          name:
            purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer',
          link: '/my-watches/buying/purchased',
        })
      }

      if (!isSeller) {
        notifyUsers.push({
          id: purchase.watch.seller.id,
          email: purchase.watch.seller.email,
          name:
            purchase.watch.seller.nickname ||
            purchase.watch.seller.firstName ||
            purchase.watch.seller.name ||
            'Verkäufer',
          link: '/my-watches/selling/sold',
        })
      }

      // Admins benachrichtigen (wenn Kommentar von Käufer/Verkäufer)
      if (!isAdmin) {
        const admins = await prisma.user.findMany({
          where: { isAdmin: true },
          select: { id: true, email: true, name: true },
        })

        for (const admin of admins) {
          notifyUsers.push({
            id: admin.id,
            email: admin.email,
            name: admin.name || 'Admin',
            link: `/admin/disputes/${id}`,
          })
        }
      }

      // Sende Benachrichtigungen
      for (const user of notifyUsers) {
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'PURCHASE',
              title: '💬 Neuer Kommentar im Dispute',
              message: `${commenterName} hat einen Kommentar zum Dispute für "${purchase.watch.title}" hinzugefügt.`,
              link: user.link,
              watchId: purchase.watchId,
            },
          })
        } catch (e) {
          console.error('Error creating notification:', e)
        }
      }
    }

    return NextResponse.json({
      message: 'Kommentar hinzugefügt',
      comment: {
        id: comment.id,
        type: comment.type,
        content: comment.content,
        userRole: comment.userRole,
        attachments: comment.attachments ? JSON.parse(comment.attachments) : [],
        isInternal: comment.isInternal,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.nickname || comment.user.firstName || comment.user.name || 'Unbekannt',
          image: comment.user.image,
          isAdmin: comment.user.isAdmin,
        },
      },
    })
  } catch (error: any) {
    console.error('Error creating dispute comment:', error)
    return NextResponse.json({ message: 'Fehler beim Erstellen des Kommentars' }, { status: 500 })
  }
}
