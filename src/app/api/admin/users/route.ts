import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Users API called, session:', { 
      userId: session?.user?.id, 
      email: session?.user?.email 
    })
    
    if (!session?.user?.id && !session?.user?.email) {
      console.log('No session user id or email')
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
    let adminUser = user
    if (!adminUser && session.user.email) {
      adminUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true }
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = adminUser?.isAdmin === true || adminUser?.isAdmin === 1
    const isAdmin = isAdminInSession || isAdminInDb

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    // Alle Benutzer laden
    console.log('Fetching all users from database...')
    const users = await prisma.user.findMany({
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
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Users fetched:', users.length)
    console.log('First user:', users[0])

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        message: 'Fehler beim Laden der Benutzer',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
