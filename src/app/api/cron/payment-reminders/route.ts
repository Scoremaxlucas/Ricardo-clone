/**
 * Cron Job: Payment Reminders & Auto-Cancellation
 *
 * Läuft täglich und:
 * 1. Sendet Zahlungserinnerungen (Tag 7, Tag 10, Tag 13)
 * 2. Storniert Bestellungen nach 14 Tagen ohne Zahlung
 *
 * Ricardo-Style: 14-Tage-Zahlungsfrist für Direktzahlungen
 */

import { prisma } from '@/lib/prisma'
import { sendPaymentReminderEmail, sendAutoCancellationEmail } from '@/lib/email-orders'
import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron Authorization
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    reminderssSent: 0,
    ordersCancelled: 0,
    errors: [] as string[],
  }

  try {
    // ================================================================
    // 1. ZAHLUNGSERINNERUNGEN
    // ================================================================
    // Finde alle Orders mit Zahlungsfrist, die noch nicht bezahlt sind
    const ordersNeedingReminder = await prisma.order.findMany({
      where: {
        // Nur Direktzahlungen (nicht Stripe)
        paymentMethod: {
          in: ['bank_transfer', 'cash_on_pickup'],
        },
        // Noch nicht bezahlt
        paymentStatus: {
          in: ['pending_bank_transfer', 'pending_cash'],
        },
        // Hat eine Zahlungsfrist
        paymentDeadline: {
          not: null,
        },
        // Noch nicht storniert
        orderStatus: {
          notIn: ['canceled', 'refunded'],
        },
        // Nicht bereits überfällig markiert
        paymentDeadlineMissed: false,
      },
      select: {
        id: true,
        orderNumber: true,
        paymentDeadline: true,
        paymentReminderCount: true,
        paymentReminderSentAt: true,
        buyer: {
          select: { email: true },
        },
      },
    })

    for (const order of ordersNeedingReminder) {
      if (!order.paymentDeadline) continue

      const daysUntilDeadline = Math.ceil(
        (new Date(order.paymentDeadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Erinnerungszeitpunkte: Tag 7 (7 Tage vor Frist), Tag 4 (4 Tage vor), Tag 1 (letzter Tag)
      const shouldSendReminder =
        (daysUntilDeadline === 7 && order.paymentReminderCount < 1) ||
        (daysUntilDeadline === 4 && order.paymentReminderCount < 2) ||
        (daysUntilDeadline === 1 && order.paymentReminderCount < 3)

      if (shouldSendReminder) {
        try {
          await sendPaymentReminderEmail(order.id, order.paymentReminderCount + 1)
          results.reminderssSent++
          console.log(`[cron/payment-reminders] Erinnerung #${order.paymentReminderCount + 1} gesendet für Order ${order.orderNumber}`)
        } catch (error: any) {
          results.errors.push(`Erinnerung für ${order.orderNumber}: ${error.message}`)
          console.error(`[cron/payment-reminders] Fehler bei Erinnerung für ${order.orderNumber}:`, error)
        }
      }
    }

    // ================================================================
    // 2. AUTO-STORNIERUNG
    // ================================================================
    // Finde alle Orders, deren Zahlungsfrist abgelaufen ist
    const overdueOrders = await prisma.order.findMany({
      where: {
        // Nur Direktzahlungen (nicht Stripe)
        paymentMethod: {
          in: ['bank_transfer', 'cash_on_pickup'],
        },
        // Noch nicht bezahlt
        paymentStatus: {
          in: ['pending_bank_transfer', 'pending_cash'],
        },
        // Zahlungsfrist ist abgelaufen
        paymentDeadline: {
          lt: now,
        },
        // Noch nicht storniert
        orderStatus: {
          notIn: ['canceled', 'refunded'],
        },
        // Noch nicht als überfällig markiert
        paymentDeadlineMissed: false,
      },
      select: {
        id: true,
        orderNumber: true,
        watchId: true,
      },
    })

    for (const order of overdueOrders) {
      try {
        // Transaktion: Order stornieren und Watch wieder freigeben
        await prisma.$transaction(async (tx) => {
          // 1. Order als storniert markieren
          await tx.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'canceled',
              paymentStatus: 'expired',
              paymentDeadlineMissed: true,
              paymentDeadlineMissedAt: now,
              autoCancelledAt: now,
              autoCancelReason: 'Zahlungsfrist von 14 Tagen abgelaufen',
            },
          })

          // 2. Watch wieder verfügbar machen (falls es eine separate "sold" Logik gibt)
          // Bei Helvenda wird der Artikel durch den Order-Status gesteuert
          // Keine zusätzliche Aktion nötig - der Artikel ist wieder verfügbar
        })

        // 3. Benachrichtigungen senden
        await sendAutoCancellationEmail(order.id, 'Zahlungsfrist von 14 Tagen abgelaufen')

        results.ordersCancelled++
        console.log(`[cron/payment-reminders] Order ${order.orderNumber} automatisch storniert`)
      } catch (error: any) {
        results.errors.push(`Stornierung ${order.orderNumber}: ${error.message}`)
        console.error(`[cron/payment-reminders] Fehler bei Stornierung von ${order.orderNumber}:`, error)
      }
    }

    console.log(`[cron/payment-reminders] Abgeschlossen: ${results.reminderssSent} Erinnerungen, ${results.ordersCancelled} Stornierungen`)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('[cron/payment-reminders] Kritischer Fehler:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        results,
      },
      { status: 500 }
    )
  }
}
