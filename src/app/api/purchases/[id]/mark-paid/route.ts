import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

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

    // Hole den Purchase mit Watch und Buyer
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

    // Prüfe ob der eingeloggte User der Käufer ist
    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Käufer kann den Status ändern' },
        { status: 403 }
      )
    }

    // Markiere als bezahlt
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        paid: true,
        paidAt: new Date()
      },
      include: {
        watch: true,
        buyer: true
      }
    })

    // Sende E-Mail an den Verkäufer (Bestätigung)
    try {
      const emailResult = await sendEmail({
        to: purchase.watch.seller.email,
        subject: `Bezahlung erhalten für ${purchase.watch.title}`,
        html: `
          <h2>Bezahlung erhalten</h2>
          <p>Die Bezahlung für Ihre verkaufte Uhr wurde als erhalten markiert:</p>
          <ul>
            <li><strong>Artikel:</strong> ${purchase.watch.title}</li>
            <li><strong>Käufer:</strong> ${purchase.buyer.name || purchase.buyer.email}</li>
            <li><strong>Betrag:</strong> CHF ${purchase.price}</li>
          </ul>
          <p>Sie können nun die Uhr versenden.</p>
        `
      })
      console.log('[mark-paid] Email result:', emailResult)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Fehler wird ignoriert, Purchase-Update war erfolgreich
    }

    console.log(`[mark-paid] Purchase ${id} als bezahlt markiert von ${session.user.email}`)

    return NextResponse.json({
      message: 'Status erfolgreich auf "bezahlt" geändert',
      purchase: {
        id: updatedPurchase.id,
        paid: updatedPurchase.paid,
        paidAt: updatedPurchase.paidAt
      }
    })
  } catch (error: any) {
    console.error('Error marking purchase as paid:', error)
    return NextResponse.json(
      { message: 'Fehler beim Ändern des Status: ' + error.message },
      { status: 500 }
    )
  }
}

