import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET: Nur geblockte Benutzer abrufen (nur für Admins)
 */
export async function GET(request: NextRequest) {
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

    // Nur geblockte Benutzer laden
    const blockedUsers = await prisma.user.findMany({
      where: {
        isBlocked: true,
      },
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

    // Konvertiere zu einheitlichem Format
    const users = blockedUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      firstName: u.firstName,
      lastName: u.lastName,
      nickname: u.nickname,
      isAdmin: u.isAdmin === true,
      isBlocked: true,
      blockedAt: u.blockedAt?.toISOString() || null,
      verified: u.verified === true,
      verificationStatus: u.verificationStatus,
      warningCount: u.warningCount || 0,
      lastWarnedAt: u.lastWarnedAt?.toISOString() || null,
      createdAt: u.createdAt.toISOString(),
    }))

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error fetching blocked users:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der geblockten Benutzer: ' + error.message },
      { status: 500 }
    )
  }
}
