import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API-Route für Käufer: Stornierung wenn Verkäufer nicht innerhalb von 7 Tagen kontaktiert hat
 * Ricardo-Style: Käufer-Schutz bei Nichteinhaltung der Kontaktfrist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Lade Purchase mit Watch und Invoice
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          include: {
            seller: true
          }
        },
        buyer: true
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { message: 'Kauf nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob der Benutzer der Käufer ist
    if (purchase.buyerId !== session.user.id) {
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
    // 2. Verkäufer hat nicht kontaktiert
    const now = new Date()
    const contactDeadline = purchase.contactDeadline ? new Date(purchase.contactDeadline) : null
    const hasSellerContacted = purchase.sellerContactedAt !== null
    
    // Prüfe ob Kontaktfrist überschritten
    if (!contactDeadline || contactDeadline > now) {
      const daysRemaining = contactDeadline 
        ? Math.ceil((contactDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 7
      return NextResponse.json(
        { 
          message: `Die Kontaktfrist läuft noch ${daysRemaining} Tag(e). Bitte warten Sie auf Kontakt vom Verkäufer.`,
          daysRemaining
        },
        { status: 400 }
      )
    }
    
    // Prüfe ob Verkäufer kontaktiert hat
    if (hasSellerContacted) {
      return NextResponse.json(
        { 
          message: 'Der Kauf kann nicht storniert werden, da der Verkäufer bereits Kontakt aufgenommen hat.',
        },
        { status: 400 }
      )
    }

    // Finde zugehörige Rechnung
    const invoice = await prisma.invoice.findFirst({
      where: {
        saleId: id,
        sellerId: purchase.watch.sellerId
      }
    })

    // Storniere Purchase
    await prisma.purchase.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelReason: 'Kontaktfrist nicht eingehalten (Verkäufer)'
      }
    })

    // Storniere Rechnung (RICARDO-STYLE: Rückerstattung der Kommission)
    if (invoice) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'cancelled'
        }
      })
      console.log(`[purchases/cancel-by-buyer] ✅ Rechnung ${invoice.invoiceNumber} storniert (Rückerstattung der Kommission)`)
    }

    // Benachrichtigung an Verkäufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.watch.sellerId,
          type: 'PURCHASE',
          title: 'Kauf storniert - Kontaktfrist nicht eingehalten',
          message: `Der Käufer hat den Kauf von "${purchase.watch.title}" storniert, da Sie nicht innerhalb von 7 Tagen Kontakt aufgenommen haben.`,
          link: `/my-watches/selling/sold`,
          watchId: purchase.watchId,
        },
      })
    } catch (notifError) {
      console.error('[purchases/cancel-by-buyer] Fehler beim Erstellen der Benachrichtigung:', notifError)
    }

    console.log(`[purchases/cancel-by-buyer] Käufer ${session.user.email} hat Purchase ${id} storniert (Kontaktfrist nicht eingehalten)`)

    return NextResponse.json({
      message: 'Kauf erfolgreich storniert. Die Kommission wurde zurückerstattet.',
      purchase: {
        id,
        status: 'cancelled'
      },
      invoice: invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: 'cancelled'
      } : null
    })
  } catch (error: any) {
    console.error('Error cancelling purchase by buyer:', error)
    return NextResponse.json(
      { message: 'Fehler beim Stornieren des Kaufs: ' + error.message },
      { status: 500 }
    )
  }
}







