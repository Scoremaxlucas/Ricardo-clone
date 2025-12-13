import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generatePaymentInfo } from '@/lib/payment-info'

/**
 * API-Route zum Abrufen der Zahlungsinformationen für einen Purchase
 * Nur der Käufer kann die Zahlungsinformationen abrufen
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Prüfe ob der User der Käufer ist
    const { prisma } = await import('@/lib/prisma')
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        buyerId: true,
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Zahlungsinformationen abzurufen' },
        { status: 403 }
      )
    }

    // Generiere Zahlungsinformationen
    const paymentInfo = await generatePaymentInfo(id)

    return NextResponse.json({
      paymentInfo,
    })
  } catch (error: any) {
    console.error('Error fetching payment info:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Zahlungsinformationen: ' + error.message },
      { status: 500 }
    )
  }
}
