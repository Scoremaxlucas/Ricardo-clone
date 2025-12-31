import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { shouldShowDetailedErrors } from '@/lib/env'

export const dynamic = 'force-dynamic'

// GET: Liste aller Systemausfälle (mit Filter-Optionen)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = activeOnly ? { endedAt: null } : {}

    const outages = await prisma.systemOutage.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        resolver: {
          select: { id: true, name: true, email: true },
        },
        extender: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Aktive Ausfälle zählen
    const activeCount = await prisma.systemOutage.count({
      where: { endedAt: null },
    })

    return NextResponse.json({
      outages,
      activeCount,
      total: outages.length,
    })
  } catch (error) {
    console.error('Fehler beim Laden der Systemausfälle:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Laden der Systemausfälle',
        ...(shouldShowDetailedErrors() && { details: String(error) }),
      },
      { status: 500 }
    )
  }
}

// POST: Neuen Systemausfall melden
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      severity = 'major',
      affectedServices = [],
      isPlanned = false,
      startedAt,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Titel ist erforderlich' }, { status: 400 })
    }

    // Prüfen ob bereits ein aktiver Ausfall existiert
    const activeOutage = await prisma.systemOutage.findFirst({
      where: { endedAt: null },
    })

    if (activeOutage) {
      return NextResponse.json(
        {
          error: 'Es gibt bereits einen aktiven Systemausfall',
          activeOutage,
        },
        { status: 400 }
      )
    }

    const outage = await prisma.systemOutage.create({
      data: {
        title,
        description,
        severity,
        affectedServices,
        isPlanned,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Systemausfall gemeldet',
      outage,
    })
  } catch (error) {
    console.error('Fehler beim Melden des Systemausfalls:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Melden des Systemausfalls',
        ...(shouldShowDetailedErrors() && { details: String(error) }),
      },
      { status: 500 }
    )
  }
}
