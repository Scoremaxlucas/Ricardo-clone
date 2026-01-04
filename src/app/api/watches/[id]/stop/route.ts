import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole die Uhr und prüfe Berechtigung
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        purchases: { take: 1 },
        sales: { take: 1 },
        bids: { take: 1 }, // Prüfe ob bereits Gebote vorhanden sind
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Artikel nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User der Verkäufer ist
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, dieses Angebot zu stoppen' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits ein aktiver Kauf oder Verkauf stattgefunden hat
    // Stornierte Purchases zählen nicht
    const activePurchases = watch.purchases.filter(p => p.status !== 'cancelled')
    if (activePurchases.length > 0 || watch.sales.length > 0) {
      return NextResponse.json(
        {
          message: 'Das Angebot kann nicht gestoppt werden, da bereits ein Kauf stattgefunden hat',
        },
        { status: 400 }
      )
    }

    // REGEL: Auktionen können nur beendet werden wenn keine Gebote vorhanden sind
    // Ricardo rule: "Before Any Bid Is Placed - You can also end or delete the offer"
    // "After a Bid Has Been Placed - the listing cannot be ended"
    if (watch.isAuction) {
      const bidsCount = watch.bids.length
      if (bidsCount > 0) {
        return NextResponse.json(
          {
            message:
              'Auktionen mit Geboten können nicht beendet werden. Die Auktion endet automatisch nach Ablauf der festgelegten Frist.',
          },
          { status: 400 }
        )
      }
      // If auction has 0 bids, allow ending (Ricardo rule)
    }

    // Stoppe das Angebot durch Setzen des auctionEnd auf jetzt
    const now = new Date()
    const updatedWatch = await prisma.watch.update({
      where: { id },
      data: {
        auctionEnd: now,
        autoRenew: false, // Deaktiviere Auto-Renew beim Stoppen
      },
    })

    return NextResponse.json({
      message: 'Angebot erfolgreich gestoppt',
      watch: updatedWatch,
    })
  } catch (error: any) {
    console.error('Error stopping watch:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Stoppen des Angebots',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
