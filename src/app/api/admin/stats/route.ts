import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Stats API called, session:', {
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
      console.log('User found by ID:', { email: user?.email, isAdmin: user?.isAdmin })
    }

    // Falls nicht gefunden per ID, versuche per E-Mail
    if (!user && session.user.email) {
      console.log('User not found by ID, trying email:', session.user.email)
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true },
      })
      console.log('User found by email:', { email: user?.email, isAdmin: user?.isAdmin })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = user?.isAdmin === true
    const isAdmin = isAdminInSession || isAdminInDb

    console.log('Admin check:', {
      isAdminInSession,
      isAdminInDb,
      isAdmin,
      userIsAdmin: user?.isAdmin,
      userEmail: session.user.email,
      sessionUserId: session.user.id,
    })

    if (!isAdmin) {
      console.log('Access denied - not admin')
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    console.log('Admin access granted, calculating stats...')

    // Statistiken berechnen
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalWatches,
      watches,
      purchases,
      verifiedUsers,
      pendingVerifications,
      pendingDisputes,
    ] = await Promise.all([
      // Benutzer-Statistiken
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      // Angebots-Statistiken
      prisma.watch.count(),
      // Alle Artikel mit Purchases zum Filtern
      prisma.watch.findMany({
        select: {
          id: true,
          auctionEnd: true,
          purchases: {
            select: {
              id: true,
            },
          },
        },
      }),
      // Transaktions-Statistiken
      prisma.purchase.findMany({
        include: {
          watch: {
            select: { price: true },
          },
        },
      }),
      // Verifizierungs-Statistiken
      prisma.user.count({ where: { verified: true, verificationStatus: 'approved' } }),
      prisma.user.count({ where: { verificationStatus: 'pending' } }),
      // Dispute-Statistiken
      prisma.purchase.count({
        where: { disputeStatus: 'pending', disputeOpenedAt: { not: null } },
      }),
    ])

    // Berechne aktive und verkaufte Angebote aus den Watch-Daten
    const now = new Date()
    const activeWatches = watches.filter(watch => {
      const hasNoPurchase = !watch.purchases || watch.purchases.length === 0
      const isNotExpired = !watch.auctionEnd || new Date(watch.auctionEnd) > now
      return hasNoPurchase && isNotExpired
    }).length

    const soldWatches = watches.filter(watch => {
      return watch.purchases && watch.purchases.length > 0
    }).length

    // Umsatz berechnen (price aus Purchase oder Fallback auf watch.price)
    const totalRevenue = purchases.reduce((sum, purchase) => {
      return sum + (purchase.price || purchase.watch?.price || 0)
    }, 0)

    // Platform-Marge - verwende Default, Pricing wird später aus Datenbank geladen
    // TODO: Pricing-Einstellungen aus Datenbank laden
    const platformMarginRate = 0.05
    const platformMargin = totalRevenue * platformMarginRate

    const result = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      blockedUsers: blockedUsers || 0,
      totalWatches: totalWatches || 0,
      activeWatches: activeWatches || 0,
      soldWatches: soldWatches || 0,
      totalRevenue: totalRevenue || 0,
      platformMargin: platformMargin || 0,
      verifiedUsers: verifiedUsers || 0,
      pendingVerifications: pendingVerifications || 0,
      pendingDisputes: pendingDisputes || 0,
    }

    console.log('Stats calculated:', result)
    console.log('Total users from DB:', totalUsers)
    console.log('Active users from DB:', activeUsers)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)

    // Prüfe ob es ein Prisma-Fehler ist
    if (error?.code) {
      console.error('Prisma error code:', error.code)
    }

    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Statistiken',
        error: error?.message || 'Unbekannter Fehler',
        errorName: error?.name,
        errorCode: error?.code,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}
