import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Verkäufer kann Verkauf stornieren, wenn Käufer nicht innerhalb von 14 Tagen gezahlt hat
// Rückerstattung der Kommission
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Lade Purchase mit Watch und Invoice
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          include: {
            seller: true,
          },
        },
        buyer: true,
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der Benutzer der Verkäufer ist
    if (purchase.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Kauf zu stornieren' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits bezahlt wurde
    if (purchase.paymentConfirmed) {
      return NextResponse.json(
        { message: 'Der Kauf kann nicht storniert werden, da die Zahlung bereits bestätigt wurde' },
        { status: 400 }
      )
    }

    // Prüfe Kontaktfrist: Stornierung möglich wenn:
    // 1. Kontaktfrist überschritten (7 Tage) UND
    // 2. Die andere Partei hat nicht kontaktiert
    const now = new Date()
    const contactDeadline = purchase.contactDeadline ? new Date(purchase.contactDeadline) : null
    const hasSellerContacted = purchase.sellerContactedAt !== null
    const hasBuyerContacted = purchase.buyerContactedAt !== null

    // Prüfe ob Kontaktfrist überschritten
    if (!contactDeadline || contactDeadline > now) {
      const daysRemaining = contactDeadline
        ? Math.ceil((contactDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 7
      return NextResponse.json(
        {
          message: `Die Kontaktfrist läuft noch ${daysRemaining} Tag(e). Bitte nehmen Sie zuerst Kontakt auf.`,
          daysRemaining,
        },
        { status: 400 }
      )
    }

    // Prüfe ob die andere Partei kontaktiert hat
    // Verkäufer kann stornieren wenn Käufer nicht kontaktiert hat
    if (hasBuyerContacted) {
      return NextResponse.json(
        {
          message:
            'Der Kauf kann nicht storniert werden, da der Käufer bereits Kontakt aufgenommen hat.',
        },
        { status: 400 }
      )
    }

    // Finde zugehörige Rechnung
    const invoice = await prisma.invoice.findFirst({
      where: {
        saleId: id,
        sellerId: purchase.watch.sellerId,
      },
    })

    // Storniere Purchase
    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'cancelled',
        paid: false,
        paidAt: null,
        paymentConfirmed: false,
        paymentConfirmedAt: null,
        itemReceived: false,
        itemReceivedAt: null,
      },
    })

    // Storniere Rechnung (Rückerstattung der Kommission)
    if (invoice) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'cancelled',
          refundedAt: new Date(),
        },
      })
      console.log(
        `[purchases/cancel-unpaid] ✅ Rechnung ${invoice.invoiceNumber} storniert (Rückerstattung der Kommission)`
      )
    }

    // Artikel wird automatisch wieder verfügbar
    // Prüfe ob es noch andere aktive Purchases gibt
    const otherActivePurchases = await prisma.purchase.findMany({
      where: {
        watchId: purchase.watchId,
        id: { not: id },
        status: { not: 'cancelled' },
      },
    })

    if (otherActivePurchases.length === 0) {
      console.log(
        `[purchases/cancel-unpaid] ✅ Watch ${purchase.watchId} ist wieder verfügbar (keine anderen aktiven Purchases)`
      )

      // Falls es eine Auktion war und autoRenew aktiv ist, könnte die Auktion verlängert werden
      // Aber das sollte der Verkäufer selbst entscheiden, daher machen wir es hier nicht automatisch
    }

    // Benachrichtigung an Käufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.buyerId,
          type: 'PURCHASE',
          title: 'Verkauf storniert',
          message: `Der Verkäufer hat den Verkauf von "${purchase.watch.title}" storniert, da keine Zahlung innerhalb von 14 Tagen erfolgt ist.`,
          link: `/my-watches/buying/purchased`,
          watchId: purchase.watchId,
        },
      })
    } catch (notifError) {
      console.error(
        '[purchases/cancel-unpaid] Fehler beim Erstellen der Benachrichtigung:',
        notifError
      )
    }

    const daysSincePurchase = Math.floor(
      (now.getTime() - purchase.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    console.log(
      `[purchases/cancel-unpaid] Verkäufer ${session.user.email} hat Purchase ${id} storniert (${daysSincePurchase} Tage nach Erstellung)`
    )

    return NextResponse.json({
      message: 'Verkauf erfolgreich storniert. Die Kommission wurde zurückerstattet.',
      purchase: {
        id,
        status: 'cancelled',
      },
      invoice: invoice
        ? {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: 'cancelled',
          }
        : null,
    })
  } catch (error: any) {
    console.error('Error cancelling unpaid purchase:', error)
    return NextResponse.json(
      { message: 'Fehler beim Stornieren des Verkaufs: ' + error.message },
      { status: 500 }
    )
  }
}
