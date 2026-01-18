import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * POST/GET /api/cron/receipt-reminders
 * Ricardo-Style: Erinnert Käufer an ausstehende Erhalt-Bestätigung
 *
 * Wird alle 6 Stunden aufgerufen via Vercel Cron
 * Sendet Erinnerungen 24 Stunden vor Auto-Release
 */

const REMINDER_HOURS_BEFORE = 24 // Erinnerung 24 Stunden vor Auto-Release

async function sendReceiptReminders() {
  const now = new Date()
  const reminderWindow = new Date(now.getTime() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000)

  console.log(`[receipt-reminders] Starte Job um ${now.toISOString()}`)
  console.log(`[receipt-reminders] Suche Orders mit autoReleaseAt zwischen jetzt und ${reminderWindow.toISOString()}`)

  // Finde alle Orders, die:
  // - bezahlt wurden
  // - Käufer hat noch nicht bestätigt
  // - autoReleaseAt ist innerhalb der nächsten 24 Stunden
  const ordersNeedingReminder = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ['paid', 'release_pending'] },
      buyerConfirmedReceipt: false,
      autoReleaseAt: {
        gte: now,
        lte: reminderWindow,
      },
    },
    include: {
      buyer: {
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
        },
      },
      watch: {
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          images: true,
        },
      },
    },
  })

  console.log(`[receipt-reminders] Gefundene Orders: ${ordersNeedingReminder.length}`)

  let sentCount = 0
  const errors: string[] = []

  for (const order of ordersNeedingReminder) {
    try {
      if (!order.buyer?.email) {
        console.warn(`[receipt-reminders] Order ${order.orderNumber}: Keine E-Mail für Käufer`)
        continue
      }

      const buyerName = order.buyer.firstName || order.buyer.name || 'Käufer'
      const hoursRemaining = order.autoReleaseAt
        ? Math.round((new Date(order.autoReleaseAt).getTime() - now.getTime()) / (1000 * 60 * 60))
        : 24

      const watchImage = (() => {
        try {
          const images = typeof order.watch.images === 'string'
            ? JSON.parse(order.watch.images)
            : order.watch.images
          return Array.isArray(images) && images.length > 0 ? images[0] : null
        } catch {
          return null
        }
      })()

      // E-Mail senden
      await sendEmail({
        to: order.buyer.email,
        subject: `Erinnerung: Bitte bestätigen Sie den Erhalt von "${order.watch.title}"`,
        useNoReply: true,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🕐 Erinnerung</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
        Hallo ${buyerName},
      </p>

      <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
        Sie haben vor kurzem folgenden Artikel gekauft:
      </p>

      <!-- Produkt Card -->
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; gap: 16px;">
        ${watchImage ? `<img src="${watchImage}" alt="${order.watch.title}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">` : ''}
        <div>
          <h3 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">${order.watch.title}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${order.watch.brand} ${order.watch.model}</p>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">Bestellung: ${order.orderNumber}</p>
        </div>
      </div>

      <!-- Warning Box -->
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>⏰ Noch ca. ${hoursRemaining} Stunden</strong>
          <br><br>
          Bitte bestätigen Sie den Erhalt der Ware, falls Sie diese bereits erhalten haben.
          Wenn Sie nicht reagieren, wird die Zahlung automatisch an den Verkäufer freigegeben.
        </p>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
        Falls die Ware noch nicht angekommen ist oder Sie ein Problem haben, kontaktieren Sie bitte den Verkäufer oder melden Sie ein Problem.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://helvenda.ch/my-watches/buying/purchased?highlight=${order.id}"
           style="display: inline-block; background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Erhalt jetzt bestätigen
        </a>
      </div>

      <p style="font-size: 12px; color: #9ca3af; margin-top: 32px; text-align: center;">
        Dies ist eine automatische Erinnerung von Helvenda.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        Bei Fragen erreichen Sie uns unter
        <a href="mailto:support@helvenda.ch" style="color: #0f766e;">support@helvenda.ch</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
      })

      // Markiere als gesendet
      try {
        await prisma.$executeRaw`UPDATE "orders" SET "receiptReminderSentAt" = NOW() WHERE id = ${order.id}`
      } catch {
        // Column might not exist - that's OK, we'll add it later
        console.warn(`[receipt-reminders] Konnte receiptReminderSentAt nicht setzen für Order ${order.orderNumber}`)
      }

      sentCount++
      console.log(`[receipt-reminders] ✅ Erinnerung gesendet an ${order.buyer.email} für Order ${order.orderNumber}`)
    } catch (error: any) {
      const errMsg = `Order ${order.orderNumber}: ${error.message}`
      errors.push(errMsg)
      console.error(`[receipt-reminders] ❌ Fehler:`, errMsg)
    }
  }

  return { sentCount, errors, total: ordersNeedingReminder.length }
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendReceiptReminders()

  return NextResponse.json({
    success: result.errors.length === 0,
    message: `${result.sentCount} von ${result.total} Erinnerungen gesendet`,
    ...result,
    timestamp: new Date().toISOString(),
  })
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const authHeader = request.headers.get('authorization')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendReceiptReminders()

  return NextResponse.json({
    success: result.errors.length === 0,
    message: `${result.sentCount} von ${result.total} Erinnerungen gesendet`,
    ...result,
    timestamp: new Date().toISOString(),
  })
}
