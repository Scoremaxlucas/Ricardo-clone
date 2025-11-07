import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole die Uhr und prüfe Berechtigung
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        purchases: { take: 1 },
        sales: { take: 1 }
      }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Uhr nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob User der Verkäufer ist
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, dieses Angebot zu stoppen' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits ein Kauf oder Verkauf stattgefunden hat
    if (watch.purchases.length > 0 || watch.sales.length > 0) {
      return NextResponse.json(
        { message: 'Das Angebot kann nicht gestoppt werden, da bereits ein Kauf stattgefunden hat' },
        { status: 400 }
      )
    }

    // Stoppe das Angebot durch Setzen des auctionEnd auf jetzt
    const now = new Date()
    const updatedWatch = await prisma.watch.update({
      where: { id },
      data: {
        auctionEnd: now,
        autoRenew: false // Deaktiviere Auto-Renew beim Stoppen
      }
    })

    return NextResponse.json({
      message: 'Angebot erfolgreich gestoppt',
      watch: updatedWatch
    })
  } catch (error: any) {
    console.error('Error stopping watch:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Stoppen des Angebots',
        error: error.message
      },
      { status: 500 }
    )
  }
}


