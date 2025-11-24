import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { setPaymentDeadline } from '@/lib/payment-info'

/**
 * API-Route zum Markieren, dass Kontakt aufgenommen wurde
 * Kann sowohl von Verkäufer als auch Käufer aufgerufen werden
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
    const { role } = await request.json() // 'seller' oder 'buyer'

    // Lade Purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          select: {
            sellerId: true
          }
        }
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { message: 'Kauf nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung
    const isSeller = purchase.watch.sellerId === session.user.id
    const isBuyer = purchase.buyerId === session.user.id

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Kauf zu bearbeiten' },
        { status: 403 }
      )
    }

    // Aktualisiere entsprechend der Rolle
    const updateData: any = {}
    const now = new Date()
    
    if (role === 'seller' && isSeller) {
      if (!purchase.sellerContactedAt) {
        updateData.sellerContactedAt = now
        // Setze Zahlungsfrist wenn Verkäufer kontaktiert (14 Tage)
        if (!purchase.paymentDeadline) {
          await setPaymentDeadline(id, now)
        }
      }
    } else if (role === 'buyer' && isBuyer) {
      if (!purchase.buyerContactedAt) {
        updateData.buyerContactedAt = now
        // Setze Zahlungsfrist wenn Käufer kontaktiert (14 Tage)
        if (!purchase.paymentDeadline) {
          await setPaymentDeadline(id, now)
        }
      }
    } else {
      return NextResponse.json(
        { message: 'Ungültige Rolle oder keine Berechtigung' },
        { status: 400 }
      )
    }

    // Update Purchase
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: updateData
    })

    console.log(`[purchases/mark-contacted] ${role} hat Kontakt für Purchase ${id} markiert`)

    return NextResponse.json({
      message: 'Kontakt erfolgreich markiert',
      purchase: updatedPurchase
    })
  } catch (error: any) {
    console.error('Error marking contact:', error)
    return NextResponse.json(
      { message: 'Fehler beim Markieren des Kontakts: ' + error.message },
      { status: 500 }
    )
  }
}

