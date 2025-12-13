import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateInvoiceForSale } from '@/lib/invoice'

// PATCH - Preisvorschlag akzeptieren oder ablehnen
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json(
        { message: 'Datenbankfehler. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body // 'accept' oder 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Ungültige Aktion. Verwenden Sie "accept" oder "reject".' },
        { status: 400 }
      )
    }

    const priceOffer = await prisma.priceOffer.findUnique({
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

    if (!priceOffer) {
      return NextResponse.json({ message: 'Preisvorschlag nicht gefunden' }, { status: 404 })
    }

    // Nur der Verkäufer kann akzeptieren/ablehnen
    if (priceOffer.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Preisvorschlag zu bearbeiten' },
        { status: 403 }
      )
    }

    if (priceOffer.status !== 'pending') {
      return NextResponse.json(
        { message: 'Dieser Preisvorschlag wurde bereits bearbeitet' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      // Verifizierung ist primär für VERKÄUFER zwingend notwendig
      // Für Käufer ist Verifizierung empfohlen, aber nicht zwingend für Preisvorschläge
      // Daher entfernen wir die Verifizierungsprüfung für Käufer hier komplett

      // Berechne Kontaktfrist (7 Tage nach Purchase)
      const contactDeadline = new Date()
      contactDeadline.setDate(contactDeadline.getDate() + 7)

      // Verwende Transaktion, damit beide Operationen atomar sind
      // Falls das Update fehlschlägt, wird der Purchase auch nicht erstellt
      const result = await prisma.$transaction(async tx => {
        // Erstelle einen Purchase
        const purchase = await tx.purchase.create({
          data: {
            watchId: priceOffer.watchId,
            buyerId: priceOffer.buyerId,
            price: priceOffer.amount,
            status: 'pending',
            itemReceived: false,
            paymentConfirmed: false,
            contactDeadline: contactDeadline, // 7-Tage-Kontaktfrist
          },
        })

        console.log('[offers] Purchase erstellt:', {
          purchaseId: purchase.id,
          watchId: priceOffer.watchId,
          buyerId: priceOffer.buyerId,
        })

        // Aktualisiere den Preisvorschlag
        // WICHTIG: Verwende purchaseId (nicht purchaseld!)
        const updatedOffer = await tx.priceOffer.update({
          where: { id },
          data: {
            status: 'accepted',
            purchaseId: purchase.id, // Korrektes Feld-Name
          },
          include: {
            watch: true,
            buyer: true,
          },
        })

        console.log('[offers] PriceOffer aktualisiert:', {
          offerId: updatedOffer.id,
          purchaseId: purchase.id,
          status: updatedOffer.status,
        })

        return { purchase, updatedOffer }
      })

      const { purchase, updatedOffer } = result

      // E-Mail: Preisvorschlag akzeptiert an Käufer
      try {
        const { sendEmail, getPriceOfferAcceptedEmail } = await import('@/lib/email')
        const buyerName =
          priceOffer.buyer.nickname ||
          priceOffer.buyer.firstName ||
          priceOffer.buyer.name ||
          priceOffer.buyer.email ||
          'Käufer'
        const { subject, html, text } = getPriceOfferAcceptedEmail(
          buyerName,
          priceOffer.watch.title,
          priceOffer.amount,
          priceOffer.watchId,
          purchase.id
        )
        await sendEmail({
          to: priceOffer.buyer.email,
          subject,
          html,
          text,
        })
        console.log(
          `[offers] ✅ Preisvorschlag-Akzeptiert-E-Mail gesendet an Käufer ${priceOffer.buyer.email}`
        )
      } catch (emailError: any) {
        console.error(
          '[offers] ❌ Fehler beim Senden der Preisvorschlag-Akzeptiert-E-Mail:',
          emailError
        )
      }

      // Benachrichtigung für den Käufer
      try {
        await prisma.notification.create({
          data: {
            userId: priceOffer.buyerId,
            type: 'PRICE_OFFER_ACCEPTED',
            title: 'Preisvorschlag akzeptiert',
            message: `Ihr Preisvorschlag von CHF ${new Intl.NumberFormat('de-CH').format(priceOffer.amount)} für "${priceOffer.watch.title}" wurde akzeptiert.`,
            link: `/my-watches/buying/purchased`,
            watchId: priceOffer.watchId,
            priceOfferId: priceOffer.id,
          },
        })
        console.log(
          `[notifications] Preisvorschlag-Akzeptiert-Benachrichtigung erstellt für Käufer ${priceOffer.buyerId}`
        )
      } catch (notifError) {
        console.error(
          '[notifications] Fehler beim Erstellen der Akzeptiert-Benachrichtigung:',
          notifError
        )
      }

      // Erstelle Benachrichtigung für Verkäufer
      try {
        const buyer = priceOffer.buyer
        const buyerName =
          buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Ein Käufer'
        await prisma.notification.create({
          data: {
            userId: priceOffer.watch.sellerId,
            type: 'PURCHASE',
            title: 'Ihr Artikel wurde verkauft',
            message: `${buyerName} hat "${priceOffer.watch.title}" für CHF ${priceOffer.amount.toFixed(2)} gekauft`,
            watchId: priceOffer.watchId,
            link: `/my-watches/selling/sold`,
          },
        })
        console.log(
          `[offers] ✅ Verkaufs-Benachrichtigung für Seller ${priceOffer.watch.sellerId} erstellt`
        )
      } catch (notificationError: any) {
        console.error(
          '[offers] ❌ Fehler beim Erstellen der Verkaufs-Benachrichtigung:',
          notificationError
        )
        // Fehler sollte den Kauf nicht verhindern
      }

      // Erstelle Rechnung SOFORT nach erfolgreichem Verkauf
      try {
        const invoice = await calculateInvoiceForSale(purchase.id)
        console.log(
          `[offers] ✅ Rechnung erstellt: ${invoice.invoiceNumber} für Seller ${priceOffer.watch.sellerId}, Total: CHF ${invoice.total.toFixed(2)} (sofort nach Verkauf)`
        )
      } catch (invoiceError) {
        console.error('[offers] ❌ Fehler beim Erstellen der Rechnung:', invoiceError)
        // Fehler wird geloggt, aber Purchase bleibt erfolgreich
      }

      // Sende Bestätigungs-E-Mail an Käufer
      try {
        const { sendEmail, getPurchaseConfirmationEmail } = await import('@/lib/email')
        const { getShippingCost } = await import('@/lib/shipping')
        const buyer = priceOffer.buyer
        const seller = priceOffer.watch.seller
        const buyerName = buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
        const sellerName =
          seller.nickname || seller.firstName || seller.name || seller.email || 'Verkäufer'

        // Berechne Versandkosten
        const shippingMethod = priceOffer.watch.shippingMethod
        let shippingMethods: any = null
        try {
          if (shippingMethod) {
            shippingMethods =
              typeof shippingMethod === 'string' ? JSON.parse(shippingMethod) : shippingMethod
          }
        } catch {
          shippingMethods = null
        }
        const shippingCost = getShippingCost(shippingMethods)

        const { subject, html, text } = getPurchaseConfirmationEmail(
          buyerName,
          sellerName,
          priceOffer.watch.title,
          priceOffer.amount,
          shippingCost,
          'buy-now',
          purchase.id,
          priceOffer.watchId
        )

        await sendEmail({
          to: buyer.email,
          subject,
          html,
          text,
        })

        console.log(`[offers] ✅ Kaufbestätigungs-E-Mail gesendet an Käufer ${buyer.email}`)
      } catch (emailError: any) {
        console.error('[offers] ❌ Fehler beim Senden der Kaufbestätigungs-E-Mail:', emailError)
        // E-Mail-Fehler sollte den Kauf nicht verhindern
      }

      return NextResponse.json({
        message: 'Preisvorschlag akzeptiert',
        offer: updatedOffer,
        purchase,
      })
    } else {
      // action === 'reject'
      const updatedOffer = await prisma.priceOffer.update({
        where: { id },
        data: {
          status: 'rejected',
        },
        include: {
          watch: true,
          buyer: true,
        },
      })

      // Benachrichtigung für den Käufer
      try {
        await prisma.notification.create({
          data: {
            userId: priceOffer.buyerId,
            type: 'PRICE_OFFER_REJECTED',
            title: 'Preisvorschlag abgelehnt',
            message: `Ihr Preisvorschlag von CHF ${new Intl.NumberFormat('de-CH').format(priceOffer.amount)} für "${priceOffer.watch.title}" wurde abgelehnt.`,
            link: `/products/${priceOffer.watchId}`,
            watchId: priceOffer.watchId,
            priceOfferId: priceOffer.id,
          },
        })
        console.log(
          `[notifications] Preisvorschlag-Abgelehnt-Benachrichtigung erstellt für Käufer ${priceOffer.buyerId}`
        )
      } catch (notifError) {
        console.error(
          '[notifications] Fehler beim Erstellen der Abgelehnt-Benachrichtigung:',
          notifError
        )
      }

      return NextResponse.json({
        message: 'Preisvorschlag abgelehnt',
        offer: updatedOffer,
      })
    }
  } catch (error: any) {
    console.error('Error updating price offer:', error)
    return NextResponse.json(
      {
        message:
          'Fehler beim Aktualisieren des Preisvorschlags: ' + (error.message || String(error)),
      },
      { status: 500 }
    )
  }
}

// DELETE - Preisvorschlag löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json(
        { message: 'Datenbankfehler. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    const priceOffer = await prisma.priceOffer.findUnique({
      where: { id },
      include: {
        watch: true,
      },
    })

    if (!priceOffer) {
      return NextResponse.json({ message: 'Preisvorschlag nicht gefunden' }, { status: 404 })
    }

    // Nur der Käufer kann seinen eigenen Preisvorschlag löschen
    if (priceOffer.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Preisvorschlag zu löschen' },
        { status: 403 }
      )
    }

    // Nur pending Preisvorschläge können gelöscht werden
    if (priceOffer.status !== 'pending') {
      return NextResponse.json(
        { message: 'Nur ausstehende Preisvorschläge können gelöscht werden' },
        { status: 400 }
      )
    }

    await prisma.priceOffer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Preisvorschlag gelöscht' })
  } catch (error: any) {
    console.error('Error deleting price offer:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Preisvorschlags: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
