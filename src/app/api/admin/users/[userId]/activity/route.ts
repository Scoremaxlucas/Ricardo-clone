import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const isAdminInSession = session?.user?.isAdmin === true
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })
    const isAdmin = isAdminInSession || adminUser?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { userId } = await params

    // Hole alle Aktivitäten aus verschiedenen Quellen
    const activities: Array<{
      id: string
      action: string
      details: any
      createdAt: Date
      type: string
    }> = []

    // 1. User-Activities aus UserActivity Tabelle
    try {
      const userActivities = await prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      userActivities.forEach(activity => {
        activities.push({
          id: activity.id,
          action: activity.action,
          details: activity.details ? JSON.parse(activity.details) : null,
          createdAt: activity.createdAt,
          type: 'user_activity',
        })
      })
    } catch (error) {
      console.warn('Could not load user activities:', error)
    }

    // 2. Erstellte Watches
    const watches = await prisma.watch.findMany({
      where: { sellerId: userId },
      select: {
        id: true,
        title: true,
        articleNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    watches.forEach(watch => {
      activities.push({
        id: watch.id,
        action: 'watch_created',
        details: {
          watchId: watch.id,
          title: watch.title,
          articleNumber: watch.articleNumber,
        },
        createdAt: watch.createdAt,
        type: 'watch',
      })
    })

    // 3. Verkaufte Watches
    const sales = await prisma.sale.findMany({
      where: { sellerId: userId },
      include: {
        watch: {
          select: {
            id: true,
            title: true,
            articleNumber: true,
          },
        },
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    sales.forEach(sale => {
      activities.push({
        id: sale.id,
        action: 'watch_sold',
        details: {
          saleId: sale.id,
          watchId: sale.watch.id,
          title: sale.watch.title,
          articleNumber: sale.watch.articleNumber,
          price: sale.price,
          buyer: sale.buyer
            ? {
                id: sale.buyer.id,
                email: sale.buyer.email,
                name:
                  sale.buyer.name ||
                  `${sale.buyer.firstName} ${sale.buyer.lastName}` ||
                  sale.buyer.nickname,
              }
            : null,
        },
        createdAt: sale.createdAt,
        type: 'sale',
      })
    })

    // 4. Käufe
    const purchases = await prisma.purchase.findMany({
      where: { buyerId: userId },
      include: {
        watch: {
          select: {
            id: true,
            title: true,
            articleNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    purchases.forEach(purchase => {
      activities.push({
        id: purchase.id,
        action: 'purchase_completed',
        details: {
          purchaseId: purchase.id,
          watchId: purchase.watch.id,
          title: purchase.watch.title,
          articleNumber: purchase.watch.articleNumber,
          price: purchase.price,
          status: purchase.status,
        },
        createdAt: purchase.createdAt,
        type: 'purchase',
      })
    })

    // 5. User gemeldet (als Reporter)
    try {
      const reportsMade = await prisma.userReport.findMany({
        where: { reportedBy: userId },
        include: {
          reportedUser: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      reportsMade.forEach(report => {
        activities.push({
          id: report.id,
          action: 'reported_user',
          details: {
            reportId: report.id,
            reportedUserId: report.reportedUserId,
            reportedUser: {
              id: report.reportedUser.id,
              email: report.reportedUser.email,
              name:
                report.reportedUser.name ||
                `${report.reportedUser.firstName} ${report.reportedUser.lastName}` ||
                report.reportedUser.nickname,
            },
            reason: report.reason,
            description: report.description,
          },
          createdAt: report.createdAt,
          type: 'user_report',
        })
      })
    } catch (error) {
      console.warn('Could not load user reports made:', error)
    }

    // 6. User wurde gemeldet (als Reported User)
    try {
      const reportsReceived = await prisma.userReport.findMany({
        where: { reportedUserId: userId },
        include: {
          reporter: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      reportsReceived.forEach(report => {
        activities.push({
          id: report.id,
          action: 'user_reported',
          details: {
            reportId: report.id,
            reporterId: report.reportedBy,
            reporter: {
              id: report.reporter.id,
              email: report.reporter.email,
              name:
                report.reporter.name ||
                `${report.reporter.firstName} ${report.reporter.lastName}` ||
                report.reporter.nickname,
            },
            reason: report.reason,
            description: report.description,
            status: report.status,
          },
          createdAt: report.createdAt,
          type: 'user_report',
        })
      })
    } catch (error) {
      console.warn('Could not load user reports received:', error)
    }

    // 7. Kontaktformular-Anfragen (wenn userId vorhanden)
    try {
      const contactRequests = await prisma.contactRequest.findMany({
        where: {
          // ContactRequest hat kein userId, aber wir können nach Email suchen
          // Das ist nicht ideal, aber für jetzt ok
        },
        orderBy: { createdAt: 'desc' },
      })
      // Nur wenn wir die Email des Users haben
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      if (user) {
        const userContactRequests = contactRequests.filter(cr => cr.email === user.email)
        userContactRequests.forEach(request => {
          activities.push({
            id: request.id,
            action: 'contact_form_sent',
            details: {
              requestId: request.id,
              category: request.category,
              subject: request.subject,
              status: request.status,
            },
            createdAt: request.createdAt,
            type: 'contact_request',
          })
        })
      }
    } catch (error) {
      console.warn('Could not load contact requests:', error)
    }

    // 8. Verifizierung
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verified: true,
        verificationStatus: true,
        verifiedAt: true,
        verificationReviewedAt: true,
        createdAt: true,
      },
    })

    if (user?.verifiedAt) {
      activities.push({
        id: `verification-${userId}`,
        action: 'verification_approved',
        details: {
          verifiedAt: user.verifiedAt,
          verificationStatus: user.verificationStatus,
        },
        createdAt: user.verifiedAt,
        type: 'verification',
      })
    } else if (user?.verificationStatus === 'rejected' && user?.verificationReviewedAt) {
      activities.push({
        id: `verification-rejected-${userId}`,
        action: 'verification_rejected',
        details: {
          reviewedAt: user.verificationReviewedAt,
          verificationStatus: user.verificationStatus,
        },
        createdAt: user.verificationReviewedAt,
        type: 'verification',
      })
    }

    // 9. Blockierung/Entblockung
    if (user) {
      const blockedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isBlocked: true,
          blockedAt: true,
          blockedBy: true,
          blockedReason: true,
        },
      })

      if (blockedUser?.blockedAt) {
        activities.push({
          id: `blocked-${userId}`,
          action: 'user_blocked',
          details: {
            blockedAt: blockedUser.blockedAt,
            blockedBy: blockedUser.blockedBy,
            reason: blockedUser.blockedReason,
          },
          createdAt: blockedUser.blockedAt,
          type: 'moderation',
        })
      }
    }

    // Sortiere nach Datum (neueste zuerst)
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return NextResponse.json(activities)
  } catch (error: any) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Aktivitäten',
        error: error.message,
      },
      { status: 500 }
    )
  }
}




