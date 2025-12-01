import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Kontaktanfragen abrufen
export async function GET(request: NextRequest) {
  try {
    console.log('[contact-requests] GET request received')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('[contact-requests] No session found')
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    console.log('[contact-requests] Session found, user:', session.user.id)

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      console.log('[contact-requests] User is not admin')
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    console.log('[contact-requests] Admin confirmed, fetching requests')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, pending, in_progress, resolved, closed
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status !== 'all') {
      where.status = status
    }

    console.log('[contact-requests] Query params:', { status, page, limit, skip, where })

    // Prüfe ob contactRequest Modell verfügbar ist (wichtig nach Schema-Änderungen!)
    if (!prisma.contactRequest) {
      console.error('[contact-requests] ❌ contactRequest Modell nicht verfügbar im Prisma Client!')
      console.error(
        '[contact-requests] Der Server verwendet eine gecachte Version des Prisma Clients.'
      )
      console.error(
        '[contact-requests] Lösung: Server stoppen, .next Cache löschen, Server neu starten'
      )
      console.error('[contact-requests] Oder verwende: ./scripts/fix-prisma-cache.sh')

      return NextResponse.json(
        {
          message: 'ContactRequest Modell nicht verfügbar. Der Server muss neu gestartet werden.',
          error: 'MODEL_NOT_AVAILABLE',
          hint: 'Bitte führen Sie aus: ./scripts/fix-prisma-cache.sh oder manuell: Server stoppen → rm -rf .next → npm run dev',
        },
        { status: 500 }
      )
    }

    // Query ausführen
    const [contactRequests, total] = await Promise.all([
      prisma.contactRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contactRequest.count({ where }),
    ])

    console.log('[contact-requests] Successfully fetched:', {
      count: contactRequests.length,
      total,
    })

    return NextResponse.json({
      contactRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('[contact-requests] Error fetching contact requests:', error)
    console.error('[contact-requests] Error stack:', error.stack)
    console.error('[contact-requests] Error name:', error.name)
    console.error('[contact-requests] Error message:', error.message)

    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Kontaktanfragen: ' + (error.message || String(error)),
        error: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
