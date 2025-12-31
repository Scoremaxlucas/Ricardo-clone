import { shouldShowDetailedErrors } from "@/lib/env"
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Users API called, session:', {
      userId: session?.user?.id,
      email: session?.user?.email,
    })

    if (!session?.user?.id && !session?.user?.email) {
      console.log('No session user id or email')
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status: Zuerst aus Session, dann aus Datenbank
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
    let adminUser = user
    if (!adminUser && session.user.email) {
      adminUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true },
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = adminUser?.isAdmin === true
    const isAdmin = isAdminInSession || isAdminInDb

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    // Alle Benutzer laden - verwende queryRaw um ALLE User zu bekommen
    console.log('Fetching all users from database...')

    // Hole Filter-Parameter
    const { searchParams } = new URL(request.url)
    const filterParam = searchParams.get('filter') || 'all'

    // Hole alle User
    let users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
        isAdmin: true,
        isBlocked: true,
        blockedAt: true,
        verified: true,
        verificationStatus: true,
        warningCount: true,
        lastWarnedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Berechne pendingReports für jeden User
    // Verwende einfachen Ansatz: Hole alle pending Reports und zähle pro User
    const pendingReportsMap = new Map<string, number>()

    try {
      // Versuche alle pending Reports zu holen
      const allPendingReports = await prisma.userReport.findMany({
        where: {
          status: 'pending',
        },
        select: {
          reportedUserId: true,
        },
      })

      // Zähle Reports pro User
      allPendingReports.forEach(report => {
        const currentCount = pendingReportsMap.get(report.reportedUserId) || 0
        pendingReportsMap.set(report.reportedUserId, currentCount + 1)
      })
    } catch (reportError: any) {
      // Falls UserReport Tabelle noch nicht existiert, ignoriere Fehler
      console.warn('Could not load user reports (table might not exist yet):', reportError.message)
    }

    // Füge pendingReports zu jedem User hinzu
    const usersWithReports = users.map(user => ({
      ...user,
      pendingReports: pendingReportsMap.get(user.id) || 0,
    }))

    // Filtere nach verschiedenen Kriterien, wenn Filter gesetzt ist
    let filteredUsers = usersWithReports
    if (filterParam === 'reported') {
      filteredUsers = usersWithReports.filter(u => u.pendingReports > 0)
    } else if (filterParam === 'blocked') {
      filteredUsers = usersWithReports.filter(u => u.isBlocked)
    } else if (filterParam === 'verified') {
      filteredUsers = usersWithReports.filter(
        u => u.verified && u.verificationStatus === 'approved'
      )
    }

    console.log('Users fetched via Prisma:', users.length)
    console.log('Total users to return:', filteredUsers.length)
    if (filterParam === 'reported') {
      console.log('Filtered to reported users:', filteredUsers.length)
    }

    return NextResponse.json(filteredUsers)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Benutzer',
        error: error.message,
        stack: shouldShowDetailedErrors() ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
