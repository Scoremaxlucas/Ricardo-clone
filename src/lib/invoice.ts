import { sendInvoiceNotificationEmail } from './email'
import { calculatePlatformFee, getPricingConfig } from './pricing-config'
import { prisma } from './prisma'

// Verwende zentrale Pricing-Konfiguration
const getInvoicePricing = async () => {
  const config = await getPricingConfig()
  return {
    commissionRate: config.platformFeeRate, // Verwende Platform Fee Rate
    vatRate: config.vatRate,
    minimumCommission: config.minimumCommission,
    maximumCommission: config.maximumCommission,
  }
}

// Hilfsfunktion zur Berechnung von Rechnungen
export async function calculateInvoiceForSale(purchaseId: string) {
  // Hole Purchase mit Watch, Boosters und Verkäufer
  // WICHTIG: Explizites select um disputeInitiatedBy zu vermeiden (P2022)
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: {
      id: true,
      price: true,
      watchId: true,
      buyerId: true,
      // disputeInitiatedBy wird NICHT selektiert
      watch: {
        select: {
          id: true,
          title: true,
          price: true,
          sellerId: true,
          boosters: true,
          seller: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              hasUnpaidInvoices: true,
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!purchase) {
    throw new Error('Purchase nicht gefunden')
  }

  const pricing = await getInvoicePricing()
  const salePrice = purchase.price || purchase.watch.price

  // WICHTIG: Die 5% Kommission ist der GESAMTBETRAG inkl. MwSt (8.1%)
  // Berechne zuerst den Gesamtbetrag (5% des Verkaufspreises)
  const totalCommission = await calculatePlatformFee(salePrice, {
    platformFeeRate: pricing.commissionRate,
    minimumCommission: pricing.minimumCommission,
    maximumCommission: pricing.maximumCommission,
  })

  // Netto-Kommission (was Helvenda behält) = Gesamtbetrag / (1 + MwSt-Satz)
  const netCommission = totalCommission / (1 + pricing.vatRate)

  // MwSt-Betrag = Gesamtbetrag - Netto-Kommission
  const vatAmount = totalCommission - netCommission

  // Schweizer Rappenrundung auf 0.05 (5 Rappen)
  const roundedSubtotal = Math.floor(netCommission * 20) / 20
  const roundedVatAmount = Math.ceil(vatAmount * 20) / 20
  const roundedTotal = roundedSubtotal + roundedVatAmount

  // Sicherstellen, dass der Gesamtbetrag exakt der Kommission entspricht (5% des Verkaufspreises)
  // Bei Rundungsdifferenzen: Gesamtbetrag hat Priorität
  const finalTotal = totalCommission
  const finalSubtotal = finalTotal - roundedVatAmount

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
      subtotal: finalSubtotal,
      vatRate: pricing.vatRate,
      vatAmount: roundedVatAmount,
      total: finalTotal,
      status: 'pending',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Frist
      items: {
        create: [
          {
            watchId: purchase.watchId,
            description: `Kommission: ${purchase.watch.title}`,
            quantity: 1,
            price: finalSubtotal,
            amount: finalSubtotal, // WICHTIG: Für Bexio-Sync
            total: finalSubtotal,
          },
        ],
      },
    },
    include: {
      items: true,
      seller: true,
    },
  })

  // Erstelle Plattform-Benachrichtigung
  try {
    await prisma.notification.create({
      data: {
        userId: purchase.watch.sellerId,
        type: 'NEW_INVOICE',
        title: 'Neue Rechnung erstellt',
        message: `Eine neue Rechnung wurde für Sie erstellt: ${invoiceNumber} (CHF ${finalTotal.toFixed(2)}). Die Zahlungsaufforderung erhalten Sie in 14 Tagen.`,
        link: `/my-watches/selling/fees?invoice=${invoice.id}`,
      },
    })
  } catch (notificationError: any) {
    // Silent fail - Notification-Fehler sollte nicht kritisch sein
  }

  // Sende E-Mail-Benachrichtigung (optional, da Zahlungsaufforderung nach 14 Tagen kommt)
  try {
    const seller = await prisma.user.findUnique({
      where: { id: purchase.watch.sellerId },
      select: { email: true, name: true, firstName: true, nickname: true },
    })

    if (seller?.email) {
      const { sendEmail, getInvoiceNotificationEmail } = await import('@/lib/email')
      const sellerName = seller.nickname || seller.firstName || seller.name || 'Nutzer'
      const dueDateFormatted = invoice.dueDate.toLocaleDateString('de-CH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const { subject, html } = getInvoiceNotificationEmail(
        sellerName,
        invoiceNumber,
        finalTotal,
        dueDateFormatted
      )

      await sendEmail({
        to: seller.email,
        subject,
        html,
      })

      console.log(`[invoice] ✅ Rechnungsbenachrichtigungs-E-Mail gesendet an ${seller.email}`)
    }
  } catch (emailError: any) {
    console.error('[invoice] Fehler beim Senden der Rechnungsbenachrichtigungs-E-Mail:', emailError)
    // E-Mail-Fehler sollte nicht kritisch sein
  }

  // Sync invoice to Bexio automatically
  // WICHTIG: Bexio ist das primäre Buchhaltungssystem - Sync ist kritisch
  if (process.env.BEXIO_API_TOKEN) {
    try {
      console.log(`[invoice] 🔄 Starte Bexio-Sync für ${invoice.invoiceNumber}...`)
      const { createBexioInvoice } = await import('@/lib/bexio-sync')
      const bexioResult = await createBexioInvoice(invoice.id)
      console.log(`[invoice] ✅ Invoice ${invoice.invoiceNumber} synced to Bexio:`)
      console.log(`[invoice]    - Bexio Invoice ID: ${bexioResult.bexioInvoiceId}`)
      console.log(`[invoice]    - QR Reference: ${bexioResult.qrReference}`)

      // Aktualisiere Invoice-Objekt mit Bexio-Daten für Return
      invoice.bexioInvoiceId = bexioResult.bexioInvoiceId
      invoice.qrReference = bexioResult.qrReference
    } catch (bexioError: any) {
      // Log detaillierten Fehler - Bexio-Sync ist wichtig!
      console.error(`[invoice] ❌ Bexio sync FAILED for invoice ${invoice.invoiceNumber}:`)
      console.error(`[invoice]    - Error: ${bexioError.message}`)
      console.error(`[invoice]    - Stack: ${bexioError.stack}`)
      // Invoice bleibt lokal gespeichert, aber ohne Bexio-Verknüpfung
      // Payment-Info wird Fallback-Referenz verwenden
    }
  } else {
    console.warn(`[invoice] ⚠️ BEXIO_API_TOKEN nicht gesetzt - kein Bexio-Sync!`)
  }

  return invoice
}

/**
 * Erstellt eine Rechnung für eine Order (neues einheitliches System)
 * Ricardo-Style: Rechnung wird erst bei Zahlungsbestätigung erstellt
 */
export async function calculateInvoiceForOrder(orderId: string) {
  // Hole Order mit Watch und Verkäufer
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      watch: {
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              hasUnpaidInvoices: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    throw new Error('Order nicht gefunden')
  }

  // Prüfe ob bereits eine Rechnung für diese Order existiert
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      saleId: orderId, // Wir verwenden saleId als Referenz für sowohl Purchase als auch Order
    },
  })

  if (existingInvoice) {
    console.log(`[invoice] Rechnung ${existingInvoice.invoiceNumber} existiert bereits für Order ${orderId}`)
    return existingInvoice
  }

  const pricing = await getInvoicePricing()
  const salePrice = order.itemPrice

  // WICHTIG: Die 5% Kommission ist der GESAMTBETRAG inkl. MwSt (8.1%)
  const totalCommission = await calculatePlatformFee(salePrice, {
    platformFeeRate: pricing.commissionRate,
    minimumCommission: pricing.minimumCommission,
    maximumCommission: pricing.maximumCommission,
  })

  // Netto-Kommission (was Helvenda behält) = Gesamtbetrag / (1 + MwSt-Satz)
  const netCommission = totalCommission / (1 + pricing.vatRate)

  // MwSt-Betrag = Gesamtbetrag - Netto-Kommission
  const vatAmount = totalCommission - netCommission

  // Schweizer Rappenrundung auf 0.05 (5 Rappen)
  const roundedVatAmount = Math.ceil(vatAmount * 20) / 20

  // Sicherstellen, dass der Gesamtbetrag exakt der Kommission entspricht
  const finalTotal = totalCommission
  const finalSubtotal = finalTotal - roundedVatAmount

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
      sellerId: order.sellerId,
      saleId: orderId, // Verwende orderId als Referenz
      subtotal: finalSubtotal,
      vatRate: pricing.vatRate,
      vatAmount: roundedVatAmount,
      total: finalTotal,
      status: 'pending',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Frist
      items: {
        create: [
          {
            watchId: order.watchId,
            description: `Kommission: ${order.watch.title}`,
            quantity: 1,
            price: finalSubtotal,
            amount: finalSubtotal, // WICHTIG: Für Bexio-Sync
            total: finalSubtotal,
          },
        ],
      },
    },
    include: {
      items: true,
      seller: true,
    },
  })

  // Erstelle Plattform-Benachrichtigung
  try {
    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        type: 'NEW_INVOICE',
        title: 'Neue Rechnung erstellt',
        message: `Eine neue Rechnung wurde für Sie erstellt: ${invoiceNumber} (CHF ${finalTotal.toFixed(2)}). Die Zahlungsaufforderung erhalten Sie in 14 Tagen.`,
        link: `/my-watches/selling/fees?invoice=${invoice.id}`,
      },
    })
  } catch (notificationError: any) {
    // Silent fail - Notification-Fehler sollte nicht kritisch sein
  }

  // Sync invoice to Bexio automatically
  // WICHTIG: Bexio ist das primäre Buchhaltungssystem - Sync ist kritisch
  if (process.env.BEXIO_API_TOKEN) {
    try {
      console.log(`[invoice/order] 🔄 Starte Bexio-Sync für ${invoice.invoiceNumber}...`)
      const { createBexioInvoice } = await import('@/lib/bexio-sync')
      const bexioResult = await createBexioInvoice(invoice.id)
      console.log(`[invoice/order] ✅ Invoice ${invoice.invoiceNumber} synced to Bexio:`)
      console.log(`[invoice/order]    - Bexio Invoice ID: ${bexioResult.bexioInvoiceId}`)
      console.log(`[invoice/order]    - QR Reference: ${bexioResult.qrReference}`)

      // Aktualisiere Invoice-Objekt mit Bexio-Daten für Return
      invoice.bexioInvoiceId = bexioResult.bexioInvoiceId
      invoice.qrReference = bexioResult.qrReference
    } catch (bexioError: any) {
      // Log detaillierten Fehler - Bexio-Sync ist wichtig!
      console.error(`[invoice/order] ❌ Bexio sync FAILED for invoice ${invoice.invoiceNumber}:`)
      console.error(`[invoice/order]    - Error: ${bexioError.message}`)
      console.error(`[invoice/order]    - Stack: ${bexioError.stack}`)
    }
  } else {
    console.warn(`[invoice/order] ⚠️ BEXIO_API_TOKEN nicht gesetzt - kein Bexio-Sync!`)
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
          amount: -item.total, // WICHTIG: Für Bexio-Sync (Negativ)
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
