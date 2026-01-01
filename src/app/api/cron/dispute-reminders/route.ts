import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// === RICARDO-STYLE DISPUTE CONFIGURATION ===
const DISPUTE_CONFIG = {
  SELLER_RESPONSE_DEADLINE_DAYS: 7,
  REFUND_DEADLINE_DAYS: 14,
  ESCALATION_LEVELS: {
    NONE: 0,
    FIRST_WARNING: 1,
    URGENT: 2,
    CRITICAL: 3,
  },
  MAX_WARNINGS_BEFORE_RESTRICTION: 3,
}

/**
 * POST /api/cron/dispute-reminders
 *
 * Automated job to:
 * 1. Send reminders for open disputes
 * 2. Auto-escalate disputes when seller doesn't respond (Ricardo-Style)
 * 3. Process refund deadlines
 * 4. Issue warnings for non-cooperative sellers
 *
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
      escalatedDisputes: 0,
      refundDeadlinesPassed: 0,
      warningsIssued: 0,
      errors: [] as string[],
    }

    // === 1. Find open disputes that need processing ===
    const openDisputes = await prisma.purchase.findMany({
      where: {
        disputeOpenedAt: { not: null },
        disputeStatus: { in: ['pending', 'under_review', 'escalated'] },
        disputeResolvedAt: null,
      },
      include: {
        buyer: {
          select: { id: true, email: true, name: true, nickname: true, firstName: true },
        },
        watch: {
          select: {
            title: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                firstName: true,
                disputeWarningCount: true,
                disputesLostCount: true,
              },
            },
          },
        },
      },
    })

    console.log(`[dispute-reminders] Found ${openDisputes.length} open disputes`)

    // === 2. Check for seller response deadline expirations (Ricardo-Style Escalation) ===
    for (const purchase of openDisputes) {
      try {
        // Check if seller response deadline has passed and seller hasn't responded
        if (
          purchase.sellerResponseDeadline &&
          now > purchase.sellerResponseDeadline &&
          !purchase.sellerRespondedAt &&
          purchase.disputeEscalationLevel === 0
        ) {
          console.log(
            `[dispute-reminders] Escalating dispute ${purchase.id} - seller didn't respond`
          )

          // Escalate the dispute
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              disputeStatus: 'escalated',
              disputeEscalatedAt: now,
              disputeEscalationLevel: DISPUTE_CONFIG.ESCALATION_LEVELS.FIRST_WARNING,
              disputeEscalationReason: 'no_seller_response',
            },
          })

          // Create audit trail
          await prisma.disputeComment.create({
            data: {
              purchaseId: purchase.id,
              userId: 'system',
              userRole: 'admin',
              type: 'status_change',
              content: `Dispute automatisch eskaliert: Verkäufer hat nicht innerhalb der 7-Tage-Frist geantwortet.`,
              isInternal: true,
            },
          })

          // Notify seller about escalation
          const sellerName =
            purchase.watch.seller.nickname ||
            purchase.watch.seller.firstName ||
            purchase.watch.seller.name ||
            'Verkäufer'
          await prisma.notification.create({
            data: {
              userId: purchase.watch.seller.id,
              type: 'PURCHASE',
              title: '🚨 Dispute eskaliert - Sofortige Aktion erforderlich',
              message: `Der Dispute für "${purchase.watch.title}" wurde eskaliert, da keine Stellungnahme erfolgte. Eine Entscheidung zugunsten des Käufers ist wahrscheinlich.`,
              link: `/disputes/${purchase.id}`,
              watchId: purchase.watchId,
            },
          })

          // Send escalation email to seller
          try {
            const { getDisputeEscalatedEmail } = await import('@/lib/email')
            const { subject, html, text } = getDisputeEscalatedEmail(
              sellerName,
              purchase.watch.title,
              'no_seller_response',
              purchase.id,
              'seller'
            )
            await sendEmail({
              to: purchase.watch.seller.email,
              subject,
              html,
              text,
            })
          } catch (e) {
            console.error('[dispute-reminders] Error sending escalation email:', e)
          }

          // Notify buyer
          const buyerName =
            purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'
          await prisma.notification.create({
            data: {
              userId: purchase.buyerId,
              type: 'PURCHASE',
              title: '📈 Dispute eskaliert',
              message: `Ihr Dispute für "${purchase.watch.title}" wurde eskaliert, da der Verkäufer nicht geantwortet hat. Der Fall wird nun mit Priorität bearbeitet.`,
              link: `/disputes/${purchase.id}`,
              watchId: purchase.watchId,
            },
          })

          // Notify admins
          const admins = await prisma.user.findMany({
            where: { isAdmin: true },
            select: { id: true, email: true },
          })

          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                type: 'PURCHASE',
                title: '🚨 Dispute eskaliert - Aktion erforderlich',
                message: `Dispute für "${purchase.watch.title}" wurde automatisch eskaliert (keine Verkäufer-Antwort).`,
                link: `/admin/disputes/${purchase.id}`,
                watchId: purchase.watchId,
              },
            })
          }

          results.escalatedDisputes++
        }
      } catch (error: any) {
        console.error(`[dispute-reminders] Error processing escalation for ${purchase.id}:`, error)
        results.errors.push(`Escalation ${purchase.id}: ${error.message}`)
      }
    }

    // === 3. Check for refund deadline expirations ===
    const disputesWithRefundDeadline = await prisma.purchase.findMany({
      where: {
        disputeRefundRequired: true,
        disputeRefundDeadline: { not: null, lt: now },
        disputeRefundCompletedAt: null,
      },
      include: {
        watch: {
          select: {
            title: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                firstName: true,
                disputeWarningCount: true,
              },
            },
          },
        },
        buyer: {
          select: { id: true, email: true, name: true, nickname: true, firstName: true },
        },
      },
    })

    for (const purchase of disputesWithRefundDeadline) {
      try {
        // Check if we already issued a warning for this refund deadline
        if (!purchase.sellerWarningIssued) {
          console.log(
            `[dispute-reminders] Refund deadline missed for ${purchase.id}, issuing warning`
          )

          const currentWarningCount = purchase.watch.seller.disputeWarningCount || 0
          const newWarningCount = currentWarningCount + 1

          // Update seller's warning count
          await prisma.user.update({
            where: { id: purchase.watch.seller.id },
            data: {
              disputeWarningCount: newWarningCount,
              lastDisputeWarningAt: now,
              // Restrict seller if they have too many warnings
              ...(newWarningCount >= DISPUTE_CONFIG.MAX_WARNINGS_BEFORE_RESTRICTION && {
                disputeRestrictionLevel: 'limited',
              }),
            },
          })

          // Mark warning as issued on this purchase
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              sellerWarningIssued: true,
              sellerWarningIssuedAt: now,
              sellerWarningReason: 'Rückerstattungsfrist überschritten',
            },
          })

          // Create audit trail
          await prisma.disputeComment.create({
            data: {
              purchaseId: purchase.id,
              userId: 'system',
              userRole: 'admin',
              type: 'status_change',
              content: `Verwarnung ausgestellt: Verkäufer hat Rückerstattungsfrist nicht eingehalten. Warnung #${newWarningCount}`,
              isInternal: true,
            },
          })

          // Send warning email to seller
          try {
            const { getSellerWarningEmail } = await import('@/lib/email')
            const sellerName =
              purchase.watch.seller.nickname ||
              purchase.watch.seller.firstName ||
              purchase.watch.seller.name ||
              'Verkäufer'
            const { subject, html, text } = getSellerWarningEmail(
              sellerName,
              newWarningCount,
              'Rückerstattungsfrist nicht eingehalten',
              purchase.watch.title,
              purchase.id
            )
            await sendEmail({
              to: purchase.watch.seller.email,
              subject,
              html,
              text,
            })
          } catch (e) {
            console.error('[dispute-reminders] Error sending warning email:', e)
          }

          // Notify seller
          await prisma.notification.create({
            data: {
              userId: purchase.watch.seller.id,
              type: 'PURCHASE',
              title: `⚠️ Verwarnung #${newWarningCount} auf Ihrem Konto`,
              message: `Die Rückerstattungsfrist für "${purchase.watch.title}" wurde nicht eingehalten. ${newWarningCount >= DISPUTE_CONFIG.MAX_WARNINGS_BEFORE_RESTRICTION ? 'Ihr Konto wurde eingeschränkt.' : ''}`,
              link: `/disputes/${purchase.id}`,
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
                title: '⚠️ Verkäufer-Warnung ausgestellt',
                message: `Warnung #${newWarningCount} für Verkäufer wegen nicht eingehaltener Rückerstattungsfrist.`,
                link: `/admin/disputes/${purchase.id}`,
                watchId: purchase.watchId,
              },
            })
          }

          results.refundDeadlinesPassed++
          results.warningsIssued++
        }
      } catch (error: any) {
        console.error(
          `[dispute-reminders] Error processing refund deadline for ${purchase.id}:`,
          error
        )
        results.errors.push(`Refund deadline ${purchase.id}: ${error.message}`)
      }
    }

    // === 4. Standard reminders for open disputes ===

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
            const hoursSinceLastReminder =
              (now.getTime() - lastReminderSent.getTime()) / (1000 * 60 * 60)
            if (hoursSinceLastReminder < 24) {
              continue // Skip, already reminded today
            }
          }

          // Send reminder to both parties
          const buyerName =
            purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'
          const sellerName =
            purchase.watch.seller.nickname ||
            purchase.watch.seller.firstName ||
            purchase.watch.seller.name ||
            'Verkäufer'

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

    console.log(
      `[dispute-reminders] Completed. Processed: ${results.processed}, Reminders: ${results.remindersCreated}, Overdue: ${results.overdueDisputes}, Escalated: ${results.escalatedDisputes}, RefundDeadlines: ${results.refundDeadlinesPassed}, Warnings: ${results.warningsIssued}`
    )

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    console.error('[dispute-reminders] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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
