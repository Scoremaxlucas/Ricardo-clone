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

    const { newBooster } = await request.json()

    if (!newBooster || newBooster === 'none') {
      return NextResponse.json(
        { message: 'Bitte wählen Sie einen neuen Booster aus' },
        { status: 400 }
      )
    }

    // Hole die Uhr und prüfe Berechtigung
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        bids: true,
        purchases: { take: 1 },
        sales: { take: 1 },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Artikel nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User der Verkäufer ist
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, dieses Angebot zu bearbeiten' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits Gebote vorhanden sind
    if (watch.bids.length > 0) {
      return NextResponse.json(
        {
          message:
            'Der Booster kann nicht mehr geändert werden, da bereits Gebote abgegeben wurden',
        },
        { status: 400 }
      )
    }

    // Parse aktuelle Booster
    let currentBoosters: string[] = []
    if (watch.boosters) {
      try {
        currentBoosters = JSON.parse(watch.boosters)
      } catch (e) {
        if (watch.boosters !== 'none' && watch.boosters) {
          currentBoosters = [watch.boosters]
        }
      }
    }
    currentBoosters = currentBoosters.filter(code => code && code !== 'none')

    // Hole aktuellen und neuen Booster-Preis
    const currentBoosterCode = currentBoosters.length > 0 ? currentBoosters[0] : null
    let currentBoosterPrice = 0
    let newBoosterPrice = 0

    if (currentBoosterCode) {
      const currentBooster = await prisma.boosterPrice.findUnique({
        where: { code: currentBoosterCode },
      })
      if (currentBooster) {
        currentBoosterPrice = currentBooster.price
      }
    }

    const newBoosterRecord = await prisma.boosterPrice.findUnique({
      where: { code: newBooster },
    })

    if (!newBoosterRecord) {
      return NextResponse.json({ message: 'Booster nicht gefunden' }, { status: 404 })
    }

    newBoosterPrice = newBoosterRecord.price

    // Berechne Differenz (kann auch negativ sein, wenn man downgradet)
    const priceDifference = newBoosterPrice - currentBoosterPrice

    // Wenn bereits ein Booster vorhanden ist, muss der neue teurer sein (Upgrade)
    // Wenn kein Booster vorhanden ist, kann jeder Booster hinzugefügt werden
    if (currentBoosterCode && priceDifference <= 0) {
      return NextResponse.json(
        {
          message:
            'Der neue Booster muss teurer sein als der aktuelle Booster. Verwenden Sie die Bearbeitungsseite für Downgrades.',
        },
        { status: 400 }
      )
    }

    // Update Booster in der Datenbank
    await prisma.watch.update({
      where: { id },
      data: {
        boosters: JSON.stringify([newBooster]),
      },
    })

    // Erstelle Rechnung für die Differenz (oder den vollen Preis, wenn kein Booster vorhanden war)
    // Preis ist bereits inkl. MwSt - berechne Netto und MwSt-Betrag
    const vatRate = 0.081 // 8.1% MwSt
    const total = currentBoosterCode ? priceDifference : newBoosterPrice // Total ist der Preis inkl. MwSt
    const subtotal = total / (1 + vatRate) // Netto-Preis ohne MwSt
    const vatAmount = total - subtotal // MwSt-Betrag
    // Schweizer Rappenrundung auf 0.05
    const roundedSubtotal = Math.floor(subtotal * 20) / 20
    const roundedVatAmount = Math.ceil(vatAmount * 20) / 20
    const roundedTotal = roundedSubtotal + roundedVatAmount

    // Generiere Rechnungsnummer
    const year = new Date().getFullYear()
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `REV-${year}-`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    })

    let invoiceNumber = `REV-${year}-001`
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
      if (!isNaN(lastNumber) && lastNumber > 0) {
        invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
      }
    }

    // Erstelle Rechnung für Booster-Upgrade
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        sellerId: watch.sellerId,
        saleId: null, // Kein Verkauf, nur Booster-Upgrade
        subtotal: roundedSubtotal,
        vatRate,
        vatAmount: roundedVatAmount,
        total: roundedTotal,
        status: 'pending',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Frist
        items: {
          create: [
            {
              watchId: watch.id,
              description: currentBoosterCode
                ? `Booster-Upgrade: ${newBoosterRecord.name} (Differenz)`
                : `Booster: ${newBoosterRecord.name}`,
              quantity: 1,
              price: roundedSubtotal,
              total: roundedSubtotal,
            },
          ],
        },
      },
    })

    console.log(
      `[upgrade-booster] Booster-Rechnung erstellt: ${invoiceNumber} für ${newBoosterRecord.name} (${currentBoosterCode ? 'Differenz' : 'Vollpreis'} CHF ${roundedTotal.toFixed(2)} inkl. MwSt) - Watch ${watch.id}`
    )

    // Sende E-Mail-Benachrichtigung und erstelle Plattform-Benachrichtigung
    try {
      const { sendInvoiceNotificationAndEmail } = await import('@/lib/invoice')
      await sendInvoiceNotificationAndEmail(invoice)
    } catch (notificationError: any) {
      console.error('[upgrade-booster] Fehler bei Benachrichtigung:', notificationError)
      // Fehler sollte nicht die Rechnungserstellung verhindern
    }

    return NextResponse.json({
      message: currentBoosterCode
        ? 'Booster erfolgreich upgegradet'
        : 'Booster erfolgreich hinzugefügt',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
      },
      priceDifference: subtotal,
    })
  } catch (error: any) {
    console.error('Error upgrading booster:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Upgraden des Boosters',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
