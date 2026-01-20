import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Benachrichtigungen abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const archivedOnly = searchParams.get('archivedOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: session.user.id,
    }

    if (archivedOnly) {
      // Nur archivierte anzeigen
      where.archived = true
    } else {
      // Standard: Archivierte ausschließen (außer wenn explizit archivedOnly=true)
      // Handle null values for backward compatibility (existing notifications before migration)
      // Use NOT to exclude archived=true, which will include both false and null
      where.archived = { not: true }
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
        // Nur nicht-archivierte zählen (handle null for backward compatibility)
        archived: { not: true },
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Benachrichtigung als gelesen markieren
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId, markAllAsRead, archive } = await request.json()

    if (markAllAsRead) {
      // Alle als gelesen markieren (nur nicht-archivierte)
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
          // Handle null for backward compatibility
          archived: { not: true },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ message: 'All notifications marked as read' })
    } else if (notificationId) {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }

      if (archive !== undefined) {
        // Archivieren oder Archivierung aufheben
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            archived: archive,
            archivedAt: archive ? new Date() : null,
          },
        })

        return NextResponse.json({
          message: archive ? 'Notification archived' : 'Notification unarchived',
        })
      } else {
        // Als gelesen markieren
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        })

        return NextResponse.json({ message: 'Notification marked as read' })
      }
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
