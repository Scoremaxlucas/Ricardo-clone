import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Angebot melden
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason, description } = body

    if (!reason) {
      return NextResponse.json({ message: 'Grund fehlt' }, { status: 400 })
    }

    // Prüfe ob Angebot existiert
    const watch = await prisma.watch.findUnique({
      where: { id },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob bereits gemeldet (verhindere Duplikate)
    const existingReport = await prisma.report.findFirst({
      where: {
        watchId: id,
        reportedBy: session.user.id,
        status: 'pending',
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { message: 'Sie haben dieses Angebot bereits gemeldet' },
        { status: 400 }
      )
    }

    // Erstelle Meldung
    const report = await prisma.report.create({
      data: {
        watchId: id,
        reportedBy: session.user.id,
        reason,
        description: description || null,
        status: 'pending',
      },
    })

    // Erstelle Historie-Eintrag (optional, falls ModerationHistory verfügbar ist)
    try {
      if (prisma.moderationHistory) {
        await prisma.moderationHistory.create({
          data: {
            watchId: id,
            adminId: session.user.id,
            action: 'reported',
            details: JSON.stringify({ reason, description }),
          },
        })
      }
    } catch (historyError) {
      // Historie-Eintrag ist optional, Fehler wird ignoriert
      console.warn('Could not create moderation history entry:', historyError)
    }

    return NextResponse.json({ message: 'Angebot erfolgreich gemeldet', report })
  } catch (error: any) {
    console.error('Error reporting watch:', error)
    return NextResponse.json({ message: 'Fehler beim Melden: ' + error.message }, { status: 500 })
  }
}
