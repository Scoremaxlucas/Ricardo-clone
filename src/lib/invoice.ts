import { sendInvoiceNotificationEmail } from './email'
import { prisma } from './prisma'

const DEFAULT_PRICING = {
  commissionRate: 0.1, // 10% Kommission
  vatRate: 0.081, // 8.1% MwSt
}

// Hilfsfunktion zur Berechnung von Rechnungen
export async function calculateInvoiceForSale(purchaseId: string) {
  // Hole Purchase mit Watch, Boosters und Verkäufer
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      watch: {
        include: {
          seller: true,
          categories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  })

  if (!purchase) {
    throw new Error('Purchase nicht gefunden')
  }

  const pricing = DEFAULT_PRICING
  const salePrice = purchase.price || purchase.watch.price
  const commission = salePrice * pricing.commissionRate
  const subtotal = commission
  const vatAmount = subtotal * pricing.vatRate
  // Schweizer Rappenrundung auf 0.05 (5 Rappen)
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

  // Erstelle Rechnung
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      sellerId: purchase.watch.sellerId,
      saleId: purchaseId,
      subtotal: roundedSubtotal,
      vatRate: pricing.vatRate,
      vatAmount: roundedVatAmount,
      total: roundedTotal,
      status: 'pending',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Frist
      items: {
        create: [
          {
            watchId: purchase.watchId,
            description: `Kommission: ${purchase.watch.title}`,
            quantity: 1,
            price: roundedSubtotal,
            total: roundedSubtotal,
          },
        ],
      },
    },
    include: {
      items: true,
      seller: true,
    },
  })

  // Erstelle nur Plattform-Benachrichtigung (E-Mail wird nach 14 Tagen gesendet)
  // Die erste Zahlungsaufforderung wird nach 14 Tagen über den Mahnprozess gesendet
  try {
    await prisma.notification.create({
      data: {
        userId: purchase.watch.sellerId,
        type: 'NEW_INVOICE',
        title: 'Neue Rechnung erstellt',
        message: `Eine neue Rechnung wurde für Sie erstellt: ${invoiceNumber} (CHF ${roundedTotal.toFixed(2)}). Die Zahlungsaufforderung erhalten Sie in 14 Tagen.`,
        link: `/my-watches/selling/fees?invoice=${invoice.id}`,
      },
    })
  } catch (notificationError: any) {
    // Silent fail - Notification-Fehler sollte nicht kritisch sein
  }

  return invoice
}

// Hilfsfunktion zum Versenden von Rechnungs-Benachrichtigungen (E-Mail + Plattform)
export async function sendInvoiceNotificationAndEmail(invoice: any) {
  try {
    // Hole Invoice mit Items
    const invoiceWithItems = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        items: true,
        seller: true,
      },
    })

    if (!invoiceWithItems || !invoiceWithItems.seller) {
      return
    }

    const seller = invoiceWithItems.seller
    const invoiceItems = invoiceWithItems.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    }))

    // 1. E-Mail-Benachrichtigung
    if (seller.email) {
      try {
        await sendInvoiceNotificationEmail(
          seller.email,
          seller.name || seller.firstName || 'Nutzer',
          invoiceWithItems.invoiceNumber,
          invoiceWithItems.total,
          invoiceItems,
          invoiceWithItems.dueDate,
          invoiceWithItems.id
        )
      } catch (emailError: any) {
        // Silent fail - E-Mail-Fehler sollte nicht die Notification verhindern
      }
    }

    // 2. Plattform-Benachrichtigung
    try {
      await prisma.notification.create({
        data: {
          userId: seller.id,
          type: 'NEW_INVOICE',
          title: 'Neue Rechnung erstellt',
          message: `Eine neue Rechnung wurde für Sie erstellt: ${invoiceWithItems.invoiceNumber} (CHF ${invoiceWithItems.total.toFixed(2)})`,
          link: `/my-watches/selling/fees?invoice=${invoiceWithItems.id}`,
        },
      })
    } catch (notificationError: any) {
      // Silent fail - Notification-Fehler sollte nicht kritisch sein
    }
  } catch (error: any) {
    // Silent fail - Fehler sollten nicht die Hauptfunktionalität blockieren
    throw error
  }
}

/**
 * Erstellt eine Korrektur-Abrechnung (Storno-Rechnung) für eine stornierte Rechnung
 * Die Korrektur-Abrechnung hat negative Beträge und storniert die ursprüngliche Rechnung
 */
export async function createCreditNoteForInvoice(originalInvoiceId: string, reason: string) {
  // Hole ursprüngliche Rechnung
  const originalInvoice = await prisma.invoice.findUnique({
    where: { id: originalInvoiceId },
    include: {
      items: true,
      seller: true,
    },
  })

  if (!originalInvoice) {
    throw new Error('Ursprüngliche Rechnung nicht gefunden')
  }

  // Generiere Korrektur-Rechnungsnummer (mit "KORR-" Präfix)
  const year = new Date().getFullYear()
  const lastCreditNote = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `KORR-${year}-`,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  })

  let creditNoteNumber = `KORR-${year}-001`
  if (lastCreditNote) {
    const lastNumber = parseInt(lastCreditNote.invoiceNumber.split('-')[2])
    if (!isNaN(lastNumber) && lastNumber > 0) {
      creditNoteNumber = `KORR-${year}-${String(lastNumber + 1).padStart(3, '0')}`
    }
  }

  // Erstelle Korrektur-Abrechnung mit negativen Beträgen
  // WICHTIG: Die ursprüngliche Rechnung bleibt erhalten (wird nur auf 'cancelled' gesetzt, nicht gelöscht)
  const creditNote = await prisma.invoice.create({
    data: {
      invoiceNumber: creditNoteNumber,
      sellerId: originalInvoice.sellerId,
      saleId: originalInvoice.saleId,
      subtotal: -originalInvoice.subtotal, // Negativ
      vatRate: originalInvoice.vatRate,
      vatAmount: -originalInvoice.vatAmount, // Negativ
      total: -originalInvoice.total, // Negativ
      status: 'cancelled', // Korrektur-Abrechnung ist automatisch storniert
      dueDate: new Date(), // Keine Fälligkeit für Korrektur-Abrechnung
      refundedAt: new Date(),
      originalInvoiceId: originalInvoiceId, // Verknüpfung zur ursprünglichen Rechnung
      items: {
        create: originalInvoice.items.map(item => ({
          watchId: item.watchId,
          description: `Korrektur/Storno: ${item.description}`,
          quantity: item.quantity,
          price: -item.price, // Negativ
          total: -item.total, // Negativ
        })),
      },
    },
    include: {
      items: true,
      seller: true,
      originalInvoice: {
        select: {
          id: true,
          invoiceNumber: true,
          createdAt: true,
        },
      },
    },
  })

  // Benachrichtigung an Verkäufer
  try {
    await prisma.notification.create({
      data: {
        userId: originalInvoice.sellerId,
        type: 'NEW_INVOICE',
        title: 'Korrektur-Abrechnung erstellt',
        message: `Eine Korrektur-Abrechnung wurde für Sie erstellt: ${creditNoteNumber} (CHF ${creditNote.total.toFixed(2)}). Grund: ${reason}`,
        link: `/my-watches/selling/fees?invoice=${creditNote.id}`,
      },
    })
  } catch (notificationError: any) {
    // Silent fail - Notification-Fehler sollte nicht kritisch sein
  }

  return creditNote
}
