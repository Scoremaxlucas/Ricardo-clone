import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/cron/dispute-reminders
 * 
 * Automated job to send reminders for open disputes.
 * Should be called daily via Vercel Cron or external scheduler.
 * 
 * Security: Requires CRON_SECRET header for production
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret in production
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      processed: 0,
      remindersCreated: 0,
      overdueDisputes: 0,
      errors: [] as string[],
    }

    // === 1. Find open disputes that need reminders ===
    const openDisputes = await prisma.purchase.findMany({
      where: {
        disputeOpenedAt: { not: null },
        disputeStatus: { in: ['pending', 'under_review'] },
        disputeResolvedAt: null,
      },
      include: {
        buyer: {
          select: { id: true, email: true, name: true, nickname: true, firstName: true },
        },
        watch: {
          select: {
            title: true,
            seller: {
              select: { id: true, email: true, name: true, nickname: true, firstName: true },
            },
          },
        },
      },
    })

    console.log(`[dispute-reminders] Found ${openDisputes.length} open disputes`)

    for (const purchase of openDisputes) {
      results.processed++

      try {
        const disputeOpenedAt = purchase.disputeOpenedAt!
        const daysSinceOpened = Math.floor(
          (now.getTime() - disputeOpenedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        // Check if deadline is passed
        const deadline = purchase.disputeDeadline
        const isOverdue = deadline ? now > deadline : daysSinceOpened > 14

        if (isOverdue) {
          results.overdueDisputes++
          
          // Notify admins about overdue dispute
          const admins = await prisma.user.findMany({
            where: { isAdmin: true },
            select: { id: true, email: true },
          })

          for (const admin of admins) {
            // Check if we already sent overdue notification today
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: admin.id,
                title: { contains: 'Überfälliger Dispute' },
                link: `/admin/disputes/${purchase.id}`,
                createdAt: {
                  gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24h
                },
              },
            })

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  userId: admin.id,
                  type: 'PURCHASE',
                  title: '🚨 Überfälliger Dispute - Dringende Aktion erforderlich',
                  message: `Der Dispute für "${purchase.watch.title}" ist seit ${daysSinceOpened - 14} Tag(en) überfällig!`,
                  link: `/admin/disputes/${purchase.id}`,
                  watchId: purchase.watchId,
                },
              })

              // Send urgent email to admin
              if (admin.email) {
                try {
                  await sendEmail({
                    to: admin.email,
                    subject: `🚨 ÜBERFÄLLIG: Dispute für ${purchase.watch.title}`,
                    html: `
                      <h2>Überfälliger Dispute</h2>
                      <p><strong>Artikel:</strong> ${purchase.watch.title}</p>
                      <p><strong>Eröffnet am:</strong> ${disputeOpenedAt.toLocaleDateString('de-CH')}</p>
                      <p><strong>Überfällig seit:</strong> ${daysSinceOpened - 14} Tag(en)</p>
                      <p><a href="${process.env.NEXTAUTH_URL}/admin/disputes/${purchase.id}" style="color: #dc2626; font-weight: bold;">Jetzt bearbeiten</a></p>
                    `,
                    text: `Überfälliger Dispute für ${purchase.watch.title}. Bitte umgehend bearbeiten.`,
                  })
                } catch (e) {
                  console.error('Error sending overdue email:', e)
                }
              }
            }
          }
          continue
        }

        // === 2. Send reminders at specific intervals ===
        const reminderDays = [3, 7, 10]
        const reminderCount = purchase.disputeReminderCount || 0
        const lastReminderSent = purchase.disputeReminderSentAt

        // Check if it's time for a reminder
        const shouldSendReminder = reminderDays.some((day, index) => {
          if (reminderCount > index) return false // Already sent this reminder
          if (daysSinceOpened < day) return false // Too early
          return daysSinceOpened >= day && daysSinceOpened < day + 1
        })

        if (shouldSendReminder && reminderCount < reminderDays.length) {
          // Check if we sent a reminder in the last 24 hours
          if (lastReminderSent) {
            const hoursSinceLastReminder = (now.getTime() - lastReminderSent.getTime()) / (1000 * 60 * 60)
            if (hoursSinceLastReminder < 24) {
              continue // Skip, already reminded today
            }
          }

          // Send reminder to both parties
          const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'
          const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer'

          // Notify buyer
          await prisma.notification.create({
            data: {
              userId: purchase.buyerId,
              type: 'PURCHASE',
              title: '⏰ Erinnerung: Offener Dispute',
              message: `Der Dispute für "${purchase.watch.title}" ist seit ${daysSinceOpened} Tagen offen. Ein Admin wird sich in Kürze darum kümmern.`,
              link: `/my-watches/buying/purchased`,
              watchId: purchase.watchId,
            },
          })

          // Notify seller
          await prisma.notification.create({
            data: {
              userId: purchase.watch.seller.id,
              type: 'PURCHASE',
              title: '⏰ Erinnerung: Offener Dispute',
              message: `Der Dispute für "${purchase.watch.title}" ist seit ${daysSinceOpened} Tagen offen. Ein Admin wird sich in Kürze darum kümmern.`,
              link: `/my-watches/selling/sold`,
              watchId: purchase.watchId,
            },
          })

          // Notify admins
          const admins = await prisma.user.findMany({
            where: { isAdmin: true },
            select: { id: true },
          })

          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                type: 'PURCHASE',
                title: `⏰ Dispute seit ${daysSinceOpened} Tagen offen`,
                message: `Der Dispute für "${purchase.watch.title}" wartet noch auf Bearbeitung.`,
                link: `/admin/disputes/${purchase.id}`,
                watchId: purchase.watchId,
              },
            })
          }

          // Create dispute comment for audit trail
          await prisma.disputeComment.create({
            data: {
              purchaseId: purchase.id,
              userId: 'system', // System user
              userRole: 'admin',
              type: 'reminder_sent',
              content: `Automatische Erinnerung nach ${daysSinceOpened} Tagen gesendet.`,
              isInternal: true,
            },
          })

          // Update reminder count
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              disputeReminderCount: reminderCount + 1,
              disputeReminderSentAt: now,
            },
          })

          results.remindersCreated++
        }
      } catch (error: any) {
        console.error(`[dispute-reminders] Error processing dispute ${purchase.id}:`, error)
        results.errors.push(`${purchase.id}: ${error.message}`)
      }
    }

    console.log(`[dispute-reminders] Completed. Processed: ${results.processed}, Reminders: ${results.remindersCreated}, Overdue: ${results.overdueDisputes}`)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    console.error('[dispute-reminders] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Also support GET for manual triggering in development
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  return POST(request)
}
