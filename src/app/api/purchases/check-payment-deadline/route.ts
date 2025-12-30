import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API-Route zur Überwachung der Zahlungsfrist (14-Tage-Regel)
 * Sollte regelmäßig von einem Cron-Job aufgerufen werden (z.B. täglich)
 *
 * Prüft Purchases und:
 * - Sendet Erinnerung nach 7, 10, 13 Tagen
 * - Markiert als überschritten nach 14 Tagen
 * - Erstellt Benachrichtigungen für Käufer
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: API-Key oder Secret-Check für Sicherheit
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    console.log(`[check-payment-deadline] Prüfe Zahlungsfristen zum Zeitpunkt ${now.toISOString()}`)

    // Finde Purchases mit Zahlungsfrist die noch nicht bezahlt sind
    // WICHTIG: Explizites select um disputeInitiatedBy zu vermeiden (P2022)
    const purchasesWithPaymentDeadline = await prisma.purchase.findMany({
      where: {
        paymentDeadline: {
          not: null,
        },
        paymentConfirmed: false, // Noch nicht bezahlt
        status: {
          not: 'cancelled', // Nicht storniert
        },
      },
      select: {
        id: true,
        paymentDeadline: true,
        paymentConfirmed: true,
        paymentReminderSentAt: true,
        paymentReminderCount: true,
        paymentDeadlineMissed: true,
        sellerContactedAt: true,
        buyerContactedAt: true,
        status: true,
        watchId: true,
        buyerId: true,
        price: true,
        // disputeInitiatedBy wird NICHT selektiert
        watch: {
          select: {
            id: true,
            title: true,
            price: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                nickname: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
      },
    })

    console.log(
      `[check-payment-deadline] Gefunden: ${purchasesWithPaymentDeadline.length} Purchases mit Zahlungsfrist`
    )

    let remindersSent = 0
    let deadlinesMissed = 0

    for (const purchase of purchasesWithPaymentDeadline) {
      if (!purchase.paymentDeadline) continue

      const deadline = new Date(purchase.paymentDeadline)
      const timeUntilDeadline = deadline.getTime() - now.getTime()
      const daysRemaining = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24))
      const isOverdue = timeUntilDeadline < 0

      // Prüfe ob Frist überschritten
      if (isOverdue && !purchase.paymentDeadlineMissed) {
        // Markiere als überschritten
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            paymentDeadlineMissed: true,
          },
        })

        // Benachrichtigung an Käufer
        try {
          await prisma.notification.create({
            data: {
              userId: purchase.buyerId,
              type: 'PURCHASE',
              title: '❌ Zahlungsfrist überschritten',
              message: `Die 14-Tage-Zahlungsfrist für "${purchase.watch.title}" wurde überschritten. Bitte zahlen Sie umgehend.`,
              link: `/my-watches/buying/purchased`,
              watchId: purchase.watchId,
            },
          })
        } catch (error) {
          console.error(
            `[check-payment-deadline] Fehler bei Benachrichtigung für Purchase ${purchase.id}:`,
            error
          )
        }

        deadlinesMissed++
        continue
      }

      // Prüfe ob Erinnerung gesendet werden muss (7, 10, 13 Tage nach Kontaktaufnahme)
      // Berechne Tage seit Zahlungsfrist gesetzt wurde
      const contactedAt = purchase.sellerContactedAt || purchase.buyerContactedAt
      if (!contactedAt || !purchase.paymentDeadline) continue // Keine Kontaktaufnahme oder keine Zahlungsfrist, keine Zahlungserinnerung

      const daysSinceContact = Math.floor(
        (now.getTime() - new Date(contactedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      const reminderCount = purchase.paymentReminderCount || 0

      // Sende Erinnerungen nach 7, 10, 13 Tagen (nur wenn noch nicht gesendet)
      const shouldSendReminder =
        ((daysSinceContact === 7 && reminderCount === 0) ||
          (daysSinceContact === 10 && reminderCount === 1) ||
          (daysSinceContact === 13 && reminderCount === 2)) &&
        !isOverdue

      if (shouldSendReminder && !isOverdue) {
        try {
          const buyerName =
            purchase.buyer.nickname ||
            purchase.buyer.firstName ||
            purchase.buyer.name ||
            purchase.buyer.email ||
            'Käufer'
          const sellerName =
            purchase.watch.seller.nickname ||
            purchase.watch.seller.firstName ||
            purchase.watch.seller.name ||
            'Verkäufer'

          // Berechne verbleibende Tage bis Fristende
          const daysUntilDeadline = Math.ceil(
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Plattform-Benachrichtigung
          await prisma.notification.create({
            data: {
              userId: purchase.buyerId,
              type: 'PURCHASE',
              title: '⚠️ Zahlungserinnerung',
              message: `Sie haben noch ${daysUntilDeadline} Tag${daysUntilDeadline !== 1 ? 'e' : ''} Zeit, um für "${purchase.watch.title}" zu zahlen.`,
              link: `/my-watches/buying/purchased`,
              watchId: purchase.watchId,
            },
          })

          // E-Mail-Benachrichtigung
          try {
            const { getPaymentReminderEmail } = await import('@/lib/email')
            const { subject, html, text } = getPaymentReminderEmail(
              buyerName,
              sellerName,
              purchase.watch.title,
              daysUntilDeadline,
              purchase.id
            )

            await sendEmail({
              to: purchase.buyer.email,
              subject,
              html,
              text,
            })
          } catch (emailError) {
            console.error(
              '[check-payment-deadline] Fehler beim Senden der Zahlungserinnerungs-E-Mail:',
              emailError
            )
          }

          // Markiere Erinnerung als gesendet und erhöhe Zähler
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              paymentReminderSentAt: now,
              paymentReminderCount: { increment: 1 },
            },
          })

          remindersSent++
        } catch (error) {
          console.error(`[check-payment-deadline] Fehler bei Purchase ${purchase.id}:`, error)
        }
      }
    }

    return NextResponse.json({
      message: 'Zahlungsfristen geprüft',
      remindersSent,
      deadlinesMissed,
      totalChecked: purchasesWithPaymentDeadline.length,
    })
  } catch (error: any) {
    console.error('[check-payment-deadline] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten: ' + error.message },
      { status: 500 }
    )
  }
}
