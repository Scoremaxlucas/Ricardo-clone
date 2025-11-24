import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

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
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    console.log(`[check-payment-deadline] Prüfe Zahlungsfristen zum Zeitpunkt ${now.toISOString()}`)

    // Finde Purchases mit Zahlungsfrist die noch nicht bezahlt sind
    const purchasesWithPaymentDeadline = await prisma.purchase.findMany({
      where: {
        paymentDeadline: {
          not: null
        },
        paymentConfirmed: false, // Noch nicht bezahlt
        status: {
          not: 'cancelled' // Nicht storniert
        }
      },
      include: {
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                nickname: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true
          }
        }
      }
    })

    console.log(`[check-payment-deadline] Gefunden: ${purchasesWithPaymentDeadline.length} Purchases mit Zahlungsfrist`)

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
            paymentDeadlineMissed: true
          }
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
              watchId: purchase.watchId
            }
          })
        } catch (error) {
          console.error(`[check-payment-deadline] Fehler bei Benachrichtigung für Purchase ${purchase.id}:`, error)
        }

        deadlinesMissed++
        continue
      }

      // Prüfe ob Erinnerung gesendet werden muss (7, 10, 13 Tage)
      const shouldSendReminder = 
        (daysRemaining === 7 || daysRemaining === 10 || daysRemaining === 3) &&
        !purchase.paymentReminderSentAt

      if (shouldSendReminder && !isOverdue) {
        try {
          const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || purchase.buyer.email || 'Käufer'
          const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer'
          
          // Plattform-Benachrichtigung
          await prisma.notification.create({
            data: {
              userId: purchase.buyerId,
              type: 'PURCHASE',
              title: '⚠️ Zahlungserinnerung',
              message: `Sie haben noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} Zeit, um für "${purchase.watch.title}" zu zahlen.`,
              link: `/my-watches/buying/purchased`,
              watchId: purchase.watchId
            }
          })

          // E-Mail-Benachrichtigung
          try {
            const { getPaymentReminderEmail } = await import('@/lib/email')
            const { subject, html, text } = getPaymentReminderEmail(
              buyerName,
              sellerName,
              purchase.watch.title,
              daysRemaining,
              purchase.id
            )
            
            await sendEmail({
              to: purchase.buyer.email,
              subject,
              html,
              text
            })
          } catch (emailError) {
            console.error('[check-payment-deadline] Fehler beim Senden der Zahlungserinnerungs-E-Mail:', emailError)
          }

          // Markiere Erinnerung als gesendet
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              paymentReminderSentAt: now
            }
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
      totalChecked: purchasesWithPaymentDeadline.length
    })
  } catch (error: any) {
    console.error('[check-payment-deadline] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten: ' + error.message },
      { status: 500 }
    )
  }
}







