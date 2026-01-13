import { authOptions } from '@/lib/auth'
import { getAccountReactivatedEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/account/cancel-deletion
 *
 * Reaktiviert ein zur Löschung vorgemerktes Konto:
 * 1. Prüft ob User eingeloggt ist
 * 2. Prüft ob Konto zur Löschung vorgemerkt ist
 * 3. Prüft ob Wartefrist noch nicht abgelaufen ist
 * 4. Reaktiviert das Konto
 * 5. Sendet Bestätigungs-E-Mail
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Hole User-Daten
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        name: true,
        isBlocked: true,
        blockedReason: true,
        deletionScheduledAt: true,
        deletionConfirmedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Konto zur Löschung vorgemerkt ist
    if (!user.deletionScheduledAt || user.blockedReason !== 'DELETION_SCHEDULED') {
      return NextResponse.json(
        { message: 'Ihr Konto ist nicht zur Löschung vorgemerkt.' },
        { status: 400 }
      )
    }

    // Prüfe ob Wartefrist abgelaufen ist
    if (user.deletionScheduledAt < new Date()) {
      return NextResponse.json(
        {
          message:
            'Die Wartefrist ist abgelaufen. Ihr Konto kann nicht mehr reaktiviert werden.',
        },
        { status: 400 }
      )
    }

    const userEmail = user.email
    const userName = user.firstName || user.nickname || user.name || 'Benutzer'

    console.log(`[cancel-deletion] Reaktiviere Konto für User: ${userEmail}`)

    // === KONTO REAKTIVIEREN ===
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Entsperren
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        // Löschung abbrechen
        deletionScheduledAt: null,
        deletionConfirmedAt: null,
        deletionCancelledAt: new Date(),
        // Token löschen
        deletionToken: null,
        deletionTokenExpires: null,
        deletionRequestedAt: null,
      },
    })

    console.log(`[cancel-deletion] Konto reaktiviert für: ${userEmail}`)

    // Sende Bestätigungs-E-Mail
    const { subject, html, text } = getAccountReactivatedEmail(userName)

    await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
      useNoReply: true,
    })

    return NextResponse.json({
      message:
        'Ihr Konto wurde erfolgreich reaktiviert. Die geplante Löschung wurde abgebrochen.',
      success: true,
    })
  } catch (error) {
    console.error('[cancel-deletion] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten. Bitte kontaktieren Sie den Support.' },
      { status: 500 }
    )
  }
}
