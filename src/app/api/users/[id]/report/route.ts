import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// POST: User melden
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason, description } = body

    if (!reason) {
      return NextResponse.json({ message: 'Grund fehlt' }, { status: 400 })
    }

    // Prüfe ob User existiert
    const reportedUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!reportedUser) {
      return NextResponse.json({ message: 'User nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User sich nicht selbst meldet
    if (session.user.id === id) {
      return NextResponse.json({ message: 'Sie können sich nicht selbst melden' }, { status: 400 })
    }

    // Prüfe ob bereits gemeldet (verhindere Duplikate)
    let existingReport = null
    try {
      // Prüfe ob userReport verfügbar ist
      if (!prisma.userReport) {
        console.error(
          'prisma.userReport is not available. Prisma Client may need to be regenerated.'
        )
        return NextResponse.json(
          {
            message:
              'Die UserReport-Funktion ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.',
          },
          { status: 503 }
        )
      }

      existingReport = await prisma.userReport.findFirst({
        where: {
          reportedUserId: id,
          reportedBy: session.user.id,
          status: 'pending',
        },
      })
    } catch (findError: any) {
      console.warn('Could not check for existing report:', findError.message)
      // Weiter mit der Erstellung, auch wenn Prüfung fehlschlägt
    }

    if (existingReport) {
      return NextResponse.json(
        { message: 'Sie haben diesen User bereits gemeldet' },
        { status: 400 }
      )
    }

    // Erstelle Meldung
    let report
    try {
      // Prüfe nochmal ob userReport verfügbar ist
      if (!prisma.userReport) {
        console.error('prisma.userReport is not available when creating report.')
        return NextResponse.json(
          {
            message:
              'Die UserReport-Funktion ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.',
          },
          { status: 503 }
        )
      }

      report = await prisma.userReport.create({
        data: {
          reportedUserId: id,
          reportedBy: session.user.id,
          reason,
          description: description || null,
          status: 'pending',
        },
        include: {
          reportedUser: {
            select: {
              id: true,
              name: true,
              nickname: true,
              email: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              nickname: true,
              email: true,
            },
          },
        },
      })
    } catch (createError: any) {
      console.error('Error creating user report:', createError)
      // Prüfe ob es ein Prisma-Fehler ist (z.B. Tabelle existiert nicht)
      if (createError.code === 'P2001' || createError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            message:
              'Die UserReport-Funktion ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.',
          },
          { status: 503 }
        )
      }
      throw createError
    }

    // Erstelle Benachrichtigung für Admins
    try {
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      })

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'USER_REPORTED',
            title: 'Neue User-Meldung',
            message: `${report.reporter.nickname || report.reporter.name || report.reporter.email} hat ${report.reportedUser.nickname || report.reportedUser.name || report.reportedUser.email} gemeldet`,
            link: `/admin/users?filter=reported`,
          },
        })
      }
    } catch (notificationError) {
      console.warn('Could not create admin notifications:', notificationError)
    }

    // Erstelle Activity-Einträge für beide User
    try {
      // Activity für Reporter (reported_user)
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          action: 'reported_user',
          details: JSON.stringify({
            reportId: report.id,
            reportedUserId: id,
            reason,
            description: description || null,
          }),
        },
      })

      // Activity für gemeldeten User (user_reported)
      await prisma.userActivity.create({
        data: {
          userId: id,
          action: 'user_reported',
          details: JSON.stringify({
            reportId: report.id,
            reporterId: session.user.id,
            reason,
            description: description || null,
            status: 'pending',
          }),
        },
      })
    } catch (activityError) {
      console.warn('Could not create activity entries:', activityError)
    }

    return NextResponse.json({ message: 'User erfolgreich gemeldet', report })
  } catch (error: any) {
    console.error('Error reporting user:', error)
    return NextResponse.json({ message: 'Fehler beim Melden: ' + error.message }, { status: 500 })
  }
}
