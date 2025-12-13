import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
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

    // Hole alle Reports für diesen User
    const reports = await prisma.userReport.findMany({
      where: {
        reportedUserId: userId,
      },
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
        reviewer: {
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(reports)
  } catch (error: any) {
    console.error('Error fetching user reports:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Meldungen',
        error: error.message,
      },
      { status: 500 }
    )
  }
}










