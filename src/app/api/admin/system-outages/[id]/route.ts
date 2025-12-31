import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { shouldShowDetailedErrors } from '@/lib/env'

export const dynamic = 'force-dynamic'

// GET: Einzelnen Systemausfall abrufen
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const outage = await prisma.systemOutage.findUnique({
      where: { id: params.id },
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

    if (!outage) {
      return NextResponse.json({ error: 'Systemausfall nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ outage })
  } catch (error) {
    console.error('Fehler beim Laden des Systemausfalls:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Laden des Systemausfalls',
        ...(shouldShowDetailedErrors() && { details: String(error) }),
      },
      { status: 500 }
    )
  }
}

// PATCH: Systemausfall beenden
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const outage = await prisma.systemOutage.findUnique({
      where: { id: params.id },
    })

    if (!outage) {
      return NextResponse.json({ error: 'Systemausfall nicht gefunden' }, { status: 404 })
    }

    if (outage.endedAt) {
      return NextResponse.json({ error: 'Systemausfall wurde bereits beendet' }, { status: 400 })
    }

    const endedAt = new Date()
    const durationMinutes = Math.round((endedAt.getTime() - outage.startedAt.getTime()) / 60000)

    const updatedOutage = await prisma.systemOutage.update({
      where: { id: params.id },
      data: {
        endedAt,
        durationMinutes,
        resolvedBy: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        resolver: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Systemausfall beendet',
      outage: updatedOutage,
      durationMinutes,
    })
  } catch (error) {
    console.error('Fehler beim Beenden des Systemausfalls:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Beenden des Systemausfalls',
        ...(shouldShowDetailedErrors() && { details: String(error) }),
      },
      { status: 500 }
    )
  }
}

// DELETE: Systemausfall löschen (nur wenn keine Verlängerung angewendet wurde)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const outage = await prisma.systemOutage.findUnique({
      where: { id: params.id },
    })

    if (!outage) {
      return NextResponse.json({ error: 'Systemausfall nicht gefunden' }, { status: 404 })
    }

    if (outage.extensionApplied) {
      return NextResponse.json(
        {
          error:
            'Dieser Ausfall kann nicht gelöscht werden, da bereits Auktionsverlängerungen angewendet wurden',
        },
        { status: 400 }
      )
    }

    await prisma.systemOutage.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Systemausfall gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Systemausfalls:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Löschen des Systemausfalls',
        ...(shouldShowDetailedErrors() && { details: String(error) }),
      },
      { status: 500 }
    )
  }
}
