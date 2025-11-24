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

    // Alle Benutzer laden - verwende queryRaw um ALLE User zu bekommen
    console.log('Fetching all users from database...')
    
    // Zuerst mit Prisma Standard-Methode
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
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Users fetched via Prisma:', users.length)
    
    // Verwende IMMER queryRaw um sicherzustellen, dass alle User gefunden werden
    console.log('⚠️  Verwende queryRaw um alle User zu finden...')
    const rawUsers = await prisma.$queryRaw<Array<{
      id: string
      email: string
      name: string | null
      firstName: string | null
      lastName: string | null
      nickname: string | null
      isAdmin: number | boolean
      isBlocked: number | boolean
      verified: number | boolean
      verificationStatus: string | null
      createdAt: Date
    }>>`
      SELECT id, email, name, firstName, lastName, nickname, 
             isAdmin, isBlocked, verified, verificationStatus, createdAt
      FROM users
      WHERE email NOT IN ('test@watch-out.ch', 'seller@watch-out.ch')
      ORDER BY createdAt DESC
    `
      
      console.log('Users fetched via queryRaw:', rawUsers.length)
      
      // Konvertiere raw Users zu Prisma-Format
      users = rawUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        firstName: u.firstName,
        lastName: u.lastName,
        nickname: u.nickname,
        isAdmin: u.isAdmin === 1 || u.isAdmin === true,
        isBlocked: u.isBlocked === 1 || u.isBlocked === true,
        blockedAt: null,
        verified: u.verified === 1 || u.verified === true,
        verificationStatus: u.verificationStatus,
        warningCount: 0,
        lastWarnedAt: null,
        createdAt: u.createdAt
      }))
    }

    console.log('Total users to return:', users.length)
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
