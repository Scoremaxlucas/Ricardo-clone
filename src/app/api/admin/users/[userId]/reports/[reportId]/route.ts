import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// DELETE: Meldung entfernen/löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; reportId: string }> }
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
      select: { isAdmin: true, email: true, name: true, firstName: true, lastName: true },
    })
    const isAdmin = isAdminInSession || adminUser?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { userId, reportId } = await params

    // Hole Report-Daten vor dem Löschen
    const report = await prisma.userReport.findUnique({
      where: { id: reportId },
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
    })

    if (!report) {
      return NextResponse.json({ message: 'Meldung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Report zu diesem User gehört
    if (report.reportedUserId !== userId) {
      return NextResponse.json(
        { message: 'Meldung gehört nicht zu diesem Benutzer' },
        { status: 400 }
      )
    }

    // Lösche Report
    await prisma.userReport.delete({
      where: { id: reportId },
    })

    const adminName =
      adminUser?.name ||
      `${adminUser?.firstName} ${adminUser?.lastName}` ||
      adminUser?.email ||
      'Ein Administrator'

    const reporterName =
      report.reporter.name ||
      `${report.reporter.firstName} ${report.reporter.lastName}` ||
      report.reporter.nickname ||
      report.reporter.email

    // Erstelle Activity-Eintrag für den gemeldeten User
    try {
      if (prisma.userActivity) {
        await prisma.userActivity.create({
          data: {
            userId: userId,
            action: 'user_report_dismissed',
            details: JSON.stringify({
              reportId: report.id,
              reason: report.reason,
              reporterId: report.reportedBy,
              reporter: reporterName,
              dismissedBy: session.user.id,
              dismissedByEmail: adminUser?.email,
              dismissedByName: adminName,
            }),
          },
        })
      }
    } catch (activityError) {
      console.warn('Could not create activity entry:', activityError)
    }

    return NextResponse.json({ message: 'Meldung wurde entfernt' })
  } catch (error: any) {
    console.error('Error deleting user report:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Entfernen der Meldung',
        error: error.message,
      },
      { status: 500 }
    )
  }
}





