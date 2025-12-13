/* eslint-disable no-console */
import { prisma } from './prisma'
import { sendEmail } from './email'

// Mahnprozess-Konstanten
const REMINDER_SCHEDULE = {
  PAYMENT_REQUEST_DAYS: 14, // Erste Zahlungsaufforderung (14 Tage nach Rechnungserstellung)
  FIRST_REMINDER_DAYS: 30, // Erste Erinnerung (30 Tage nach Rechnungserstellung = 16 Tage nach Fälligkeit)
  SECOND_REMINDER_DAYS: 44, // Zweite Erinnerung + Mahnspesen (44 Tage nach Rechnungserstellung = 30 Tage nach Fälligkeit)
  FINAL_REMINDER_DAYS: 58, // Letzte Erinnerung + Konto-Sperre (58 Tage nach Rechnungserstellung = 44 Tage nach Fälligkeit)
  LATE_FEE_AMOUNT: 10.0, // CHF 10.– Mahnspesen
}

/**
 * Berechnet die Anzahl Tage seit Rechnungserstellung
 */
function getDaysSinceInvoice(invoiceDate: Date): number {
  const now = new Date()
  const diffTime = now.getTime() - invoiceDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Sendet erste Zahlungsaufforderung (Tag 14)
 */
/**
 * Sendet erste Zahlungsaufforderung (Tag 14) - Rechnung wird fällig
 * Dies ist die erste E-Mail-Benachrichtigung mit Zahlungsmethoden
 */
async function sendPaymentRequest(invoice: any) {
  const daysSinceInvoice = getDaysSinceInvoice(invoice.createdAt)

  if (daysSinceInvoice >= REMINDER_SCHEDULE.PAYMENT_REQUEST_DAYS && !invoice.paymentRequestSentAt) {
    console.log(
      `[invoice-reminders] Sende erste Zahlungsaufforderung für Rechnung ${invoice.invoiceNumber} (Tag ${daysSinceInvoice} nach Erstellung)`
    )

    // E-Mail senden (erste Zahlungsaufforderung mit Zahlungsmethoden)
    try {
      const seller = await prisma.user.findUnique({
        where: { id: invoice.sellerId },
      })

      if (seller?.email) {
        const { getPaymentRequestEmail } = await import('./email')
        const { subject, html, text } = getPaymentRequestEmail(
          seller.name || seller.firstName || 'Nutzer',
          invoice.invoiceNumber,
          invoice.total,
          invoice.dueDate,
          invoice.id
        )

        await sendEmail({
          to: seller.email,
          subject,
          html,
          text,
        })

        console.log(`[invoice-reminders] ✅ Zahlungsaufforderung gesendet an ${seller.email}`)
      }
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Senden der Zahlungsaufforderung:`, error)
    }

    // Update Invoice - Markiere als fällig (paymentRequestSentAt wird gesetzt)
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentRequestSentAt: new Date(),
        // Status bleibt 'pending' - wird erst bei Überfälligkeit 'overdue'
      },
    })

    // Plattform-Benachrichtigung
    try {
      await prisma.notification.create({
        data: {
          userId: invoice.sellerId,
          type: 'PAYMENT_REQUEST',
          title: 'Zahlungsaufforderung',
          message: `Ihre Rechnung ${invoice.invoiceNumber} über CHF ${invoice.total.toFixed(2)} ist jetzt fällig.`,
          link: `/my-watches/selling/fees?invoice=${invoice.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Erstellen der Notification:`, error)
    }
  }
}

/**
 * Sendet erste Erinnerung (Tag 30)
 */
async function sendFirstReminder(invoice: any) {
  const daysSinceInvoice = getDaysSinceInvoice(invoice.createdAt)

  if (
    daysSinceInvoice >= REMINDER_SCHEDULE.FIRST_REMINDER_DAYS &&
    invoice.paymentRequestSentAt &&
    !invoice.firstReminderSentAt
  ) {
    console.log(
      `[invoice-reminders] Sende erste Erinnerung für Rechnung ${invoice.invoiceNumber} (Tag ${daysSinceInvoice})`
    )

    try {
      const seller = await prisma.user.findUnique({
        where: { id: invoice.sellerId },
      })

      if (seller?.email) {
        const { getFirstReminderEmail } = await import('./email')
        const { subject, html, text } = getFirstReminderEmail(
          seller.name || seller.firstName || 'Nutzer',
          invoice.invoiceNumber,
          invoice.total,
          invoice.dueDate,
          invoice.id
        )

        await sendEmail({
          to: seller.email,
          subject,
          html,
          text,
        })

        console.log(`[invoice-reminders] ✅ Erste Erinnerung gesendet an ${seller.email}`)
      }
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Senden der ersten Erinnerung:`, error)
    }

    // Update Invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        firstReminderSentAt: new Date(),
        reminderCount: { increment: 1 },
      },
    })

    // Plattform-Benachrichtigung
    try {
      await prisma.notification.create({
        data: {
          userId: invoice.sellerId,
          type: 'PAYMENT_REMINDER',
          title: 'Zahlungserinnerung',
          message: `Erinnerung: Ihre Rechnung ${invoice.invoiceNumber} über CHF ${invoice.total.toFixed(2)} ist noch offen.`,
          link: `/my-watches/selling/fees?invoice=${invoice.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Erstellen der Notification:`, error)
    }
  }
}

/**
 * Sendet zweite Erinnerung mit Mahnspesen (Tag 44)
 */
async function sendSecondReminder(invoice: any) {
  const daysSinceInvoice = getDaysSinceInvoice(invoice.createdAt)

  if (
    daysSinceInvoice >= REMINDER_SCHEDULE.SECOND_REMINDER_DAYS &&
    invoice.firstReminderSentAt &&
    !invoice.secondReminderSentAt
  ) {
    console.log(
      `[invoice-reminders] Sende zweite Erinnerung mit Mahnspesen für Rechnung ${invoice.invoiceNumber} (Tag ${daysSinceInvoice})`
    )

    // Füge Mahnspesen hinzu (nur einmal)
    if (!invoice.lateFeeAdded) {
      const newTotal = invoice.total + REMINDER_SCHEDULE.LATE_FEE_AMOUNT

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          total: newTotal,
          lateFeeAdded: true,
          lateFeeAmount: REMINDER_SCHEDULE.LATE_FEE_AMOUNT,
        },
      })

      // Update Invoice für weitere Verarbeitung
      invoice.total = newTotal
      invoice.lateFeeAdded = true
      invoice.lateFeeAmount = REMINDER_SCHEDULE.LATE_FEE_AMOUNT

      console.log(
        `[invoice-reminders] ✅ Mahnspesen CHF ${REMINDER_SCHEDULE.LATE_FEE_AMOUNT} hinzugefügt. Neuer Total: CHF ${newTotal.toFixed(2)}`
      )
    }

    try {
      const seller = await prisma.user.findUnique({
        where: { id: invoice.sellerId },
      })

      if (seller?.email) {
        const { getSecondReminderEmail } = await import('./email')
        const { subject, html, text } = getSecondReminderEmail(
          seller.name || seller.firstName || 'Nutzer',
          invoice.invoiceNumber,
          invoice.total,
          invoice.lateFeeAmount,
          invoice.dueDate,
          invoice.id
        )

        await sendEmail({
          to: seller.email,
          subject,
          html,
          text,
        })

        console.log(`[invoice-reminders] ✅ Zweite Erinnerung gesendet an ${seller.email}`)
      }
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Senden der zweiten Erinnerung:`, error)
    }

    // Update Invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        secondReminderSentAt: new Date(),
        reminderCount: { increment: 1 },
        status: 'overdue', // Markiere als überfällig
      },
    })

    // Plattform-Benachrichtigung
    try {
      await prisma.notification.create({
        data: {
          userId: invoice.sellerId,
          type: 'PAYMENT_REMINDER',
          title: 'Zweite Zahlungserinnerung',
          message: `WICHTIG: Ihre Rechnung ${invoice.invoiceNumber} ist überfällig. Mahnspesen CHF ${invoice.lateFeeAmount.toFixed(2)} wurden hinzugefügt.`,
          link: `/my-watches/selling/fees?invoice=${invoice.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Erstellen der Notification:`, error)
    }
  }
}

/**
 * Sendet letzte Erinnerung und sperrt Konto (Tag 58)
 */
async function sendFinalReminderAndBlockAccount(invoice: any) {
  const daysSinceInvoice = getDaysSinceInvoice(invoice.createdAt)

  if (
    daysSinceInvoice >= REMINDER_SCHEDULE.FINAL_REMINDER_DAYS &&
    invoice.secondReminderSentAt &&
    !invoice.finalReminderSentAt
  ) {
    console.log(
      `[invoice-reminders] Sende letzte Erinnerung und sperre Konto für Rechnung ${invoice.invoiceNumber} (Tag ${daysSinceInvoice})`
    )

    try {
      const seller = await prisma.user.findUnique({
        where: { id: invoice.sellerId },
      })

      if (seller?.email) {
        const { getFinalReminderEmail } = await import('./email')
        const { subject, html, text } = getFinalReminderEmail(
          seller.name || seller.firstName || 'Nutzer',
          invoice.invoiceNumber,
          invoice.total,
          invoice.lateFeeAmount,
          invoice.dueDate,
          invoice.id
        )

        await sendEmail({
          to: seller.email,
          subject,
          html,
          text,
        })

        console.log(`[invoice-reminders] ✅ Letzte Erinnerung gesendet an ${seller.email}`)
      }
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Senden der letzten Erinnerung:`, error)
    }

    // Update Invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        finalReminderSentAt: new Date(),
        reminderCount: { increment: 1 },
        status: 'overdue',
      },
    })

    // Sperre Konto
    await blockUserAccount(invoice.sellerId, invoice.invoiceNumber, invoice.total)

    // Plattform-Benachrichtigung
    try {
      await prisma.notification.create({
        data: {
          userId: invoice.sellerId,
          type: 'ACCOUNT_BLOCKED',
          title: 'Konto gesperrt',
          message: `Ihr Konto wurde aufgrund nicht bezahlter Gebühren gesperrt. Rechnung: ${invoice.invoiceNumber} (CHF ${invoice.total.toFixed(2)})`,
          link: `/my-watches/selling/fees?invoice=${invoice.id}`,
        },
      })
    } catch (error: any) {
      console.error(`[invoice-reminders] Fehler beim Erstellen der Notification:`, error)
    }
  }
}

/**
 * Sperrt Benutzerkonto aufgrund nicht bezahlter Gebühren
 */
async function blockUserAccount(userId: string, invoiceNumber: string, _amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error(`[invoice-reminders] User ${userId} nicht gefunden`)
      return
    }

    // Nur sperren wenn noch nicht gesperrt
    if (!user.isBlocked) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: 'system', // Automatische Sperre
          blockedReason: `unpaid_invoice:${invoiceNumber}`,
          hasUnpaidInvoices: true,
        },
      })

      console.log(
        `[invoice-reminders] ✅ Konto ${userId} gesperrt aufgrund nicht bezahlter Rechnung ${invoiceNumber}`
      )
    }

    // Update Invoice
    await prisma.invoice.updateMany({
      where: {
        sellerId: userId,
        status: { in: ['pending', 'overdue'] },
      },
      data: {
        accountBlockedAt: new Date(),
        accountBlockedReason: `Automatische Sperre nach ${REMINDER_SCHEDULE.FINAL_REMINDER_DAYS} Tagen`,
      },
    })
  } catch (error: any) {
    console.error(`[invoice-reminders] Fehler beim Sperren des Kontos:`, error)
  }
}

/**
 * Hauptfunktion: Verarbeitet alle Mahnungen für alle offenen Rechnungen
 */
export async function processInvoiceReminders() {
  console.log(`[invoice-reminders] Starte Mahnprozess-Verarbeitung...`)

  try {
    // Hole alle offenen Rechnungen
    const openInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['pending', 'overdue'] },
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            isBlocked: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`[invoice-reminders] Gefunden: ${openInvoices.length} offene Rechnungen`)

    let processedCount = 0

    for (const invoice of openInvoices) {
      // Prüfe jeden Schritt des Mahnprozesses
      // Tag 14: Erste Zahlungsaufforderung (Rechnung wird fällig)
      await sendPaymentRequest(invoice)

      // Tag 30: Erste Erinnerung (16 Tage nach Fälligkeit)
      await sendFirstReminder(invoice)

      // Tag 44: Zweite Erinnerung + Mahnspesen (30 Tage nach Fälligkeit)
      await sendSecondReminder(invoice)

      // Tag 58: Letzte Erinnerung + Konto-Sperre (44 Tage nach Fälligkeit)
      await sendFinalReminderAndBlockAccount(invoice)

      processedCount++
    }

    console.log(`[invoice-reminders] ✅ Verarbeitet: ${processedCount} Rechnungen`)

    return {
      processed: processedCount,
      total: openInvoices.length,
    }
  } catch (error: any) {
    console.error(`[invoice-reminders] Fehler bei Mahnprozess-Verarbeitung:`, error)
    throw error
  }
}

/**
 * Entsperrt Benutzerkonto nach Zahlung
 */
export async function unblockUserAccountAfterPayment(userId: string) {
  try {
    // Prüfe ob alle Rechnungen bezahlt sind
    const unpaidInvoices = await prisma.invoice.count({
      where: {
        sellerId: userId,
        status: { in: ['pending', 'overdue'] },
      },
    })

    if (unpaidInvoices === 0) {
      // Alle Rechnungen bezahlt, entsperre Konto
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockedBy: null,
          blockedReason: null,
          hasUnpaidInvoices: false,
        },
      })

      console.log(`[invoice-reminders] ✅ Konto ${userId} entsperrt nach Zahlung`)

      // Benachrichtigung
      try {
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'ACCOUNT_UNBLOCKED',
            title: 'Konto entsperrt',
            message: 'Ihr Konto wurde entsperrt. Alle Rechnungen sind bezahlt.',
            link: '/my-watches/selling/fees',
          },
        })
      } catch (error: any) {
        console.error(`[invoice-reminders] Fehler beim Erstellen der Notification:`, error)
      }
    }
  } catch (error: any) {
    console.error(`[invoice-reminders] Fehler beim Entsperren des Kontos:`, error)
  }
}
