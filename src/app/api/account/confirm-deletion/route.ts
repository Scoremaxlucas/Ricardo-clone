import { getAccountDeletionScheduledEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Wartefrist in Tagen (wie Ricardo)
const DELETION_WAITING_PERIOD_DAYS = 14

/**
 * GET /api/account/confirm-deletion?token=xxx
 *
 * Bestätigt die Kontolöschung (NEUE VERSION mit Wartefrist):
 * 1. Validiert Token
 * 2. Sperrt das Konto (statt sofort löschen)
 * 3. Plant die Löschung in 14 Tagen
 * 4. Sendet Info-E-Mail mit Reaktivierungsmöglichkeit
 *
 * Die tatsächliche Löschung erfolgt durch einen Cronjob nach 14 Tagen.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Kein Token angegeben' }, { status: 400 })
    }

    // Finde User mit Token
    const user = await prisma.user.findFirst({
      where: {
        deletionToken: token,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        name: true,
        deletionTokenExpires: true,
        deletionScheduledAt: true,
        isBlocked: true,
        blockedReason: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Ungültiger oder bereits verwendeter Token' },
        { status: 400 }
      )
    }

    // Prüfe ob Löschung bereits geplant ist
    if (user.deletionScheduledAt && user.blockedReason === 'DELETION_SCHEDULED') {
      return NextResponse.json(
        {
          message: `Ihr Konto ist bereits zur Löschung vorgemerkt. Die endgültige Löschung erfolgt am ${user.deletionScheduledAt.toLocaleDateString('de-CH')}.`,
          alreadyScheduled: true,
          scheduledDate: user.deletionScheduledAt,
        },
        { status: 200 }
      )
    }

    // Prüfe Token-Ablauf
    if (user.deletionTokenExpires && user.deletionTokenExpires < new Date()) {
      return NextResponse.json(
        {
          message: 'Der Bestätigungslink ist abgelaufen. Bitte fordern Sie einen neuen Link an.',
        },
        { status: 400 }
      )
    }

    const userId = user.id
    const userEmail = user.email
    const userName = user.firstName || user.nickname || user.name || 'Benutzer'

    // Berechne Löschdatum (14 Tage ab jetzt)
    const deletionScheduledAt = new Date()
    deletionScheduledAt.setDate(deletionScheduledAt.getDate() + DELETION_WAITING_PERIOD_DAYS)

    console.log(`[confirm-deletion] Plane Kontolöschung für User: ${userEmail}`)
    console.log(`[confirm-deletion] Löschdatum: ${deletionScheduledAt.toISOString()}`)

    // === KONTO SPERREN (nicht löschen) ===
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Konto sperren
        isBlocked: true,
        blockedReason: 'DELETION_SCHEDULED',
        blockedAt: new Date(),
        // Löschung planen
        deletionConfirmedAt: new Date(),
        deletionScheduledAt,
        // Token behalten für Reaktivierung
        // deletionToken bleibt erhalten
      },
    })

    console.log(`[confirm-deletion] Konto gesperrt, Löschung geplant für: ${userEmail}`)

    // Sende Info-E-Mail mit Reaktivierungsmöglichkeit
    const { subject, html, text } = getAccountDeletionScheduledEmail(
      userName,
      deletionScheduledAt,
      DELETION_WAITING_PERIOD_DAYS
    )

    await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
      useNoReply: true,
    })

    return NextResponse.json({
      message: `Ihr Konto wurde gesperrt und wird am ${deletionScheduledAt.toLocaleDateString('de-CH')} endgültig gelöscht. Sie können Ihr Konto innerhalb der nächsten ${DELETION_WAITING_PERIOD_DAYS} Tage reaktivieren.`,
      success: true,
      scheduledDate: deletionScheduledAt,
      canReactivateUntil: deletionScheduledAt,
    })
  } catch (error) {
    console.error('[confirm-deletion] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten. Bitte kontaktieren Sie den Support.' },
      { status: 500 }
    )
  }
}
