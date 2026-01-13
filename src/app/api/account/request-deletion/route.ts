import { authOptions } from '@/lib/auth'
import { getAccountDeletionRequestEmail, getEmailBaseUrl, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TOKEN_EXPIRATION_HOURS = 24

/**
 * POST /api/account/request-deletion
 *
 * Initiiert den Kontolöschungs-Prozess:
 * 1. Prüft ob User eingeloggt ist
 * 2. Prüft ob offene Transaktionen/Rechnungen vorhanden sind
 * 3. Generiert Lösch-Token
 * 4. Sendet Bestätigungs-E-Mail
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
        // Prüfe offene Verpflichtungen
        watches: {
          where: {
            moderationStatus: { in: ['approved', 'pending'] },
          },
          select: { id: true },
        },
        invoices: {
          where: {
            status: { in: ['pending', 'overdue'] },
          },
          select: { id: true },
        },
        purchases: {
          where: {
            status: { in: ['pending', 'confirmed', 'shipped'] },
          },
          select: { id: true },
        },
        bids: {
          where: {
            watch: {
              moderationStatus: 'approved',
              isAuction: true,
              auctionEnd: { gt: new Date() },
            },
          },
          select: { id: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe auf offene Verpflichtungen
    const blockers: string[] = []

    if (user.watches.length > 0) {
      blockers.push(`${user.watches.length} aktive Angebote`)
    }

    if (user.invoices.length > 0) {
      blockers.push(`${user.invoices.length} offene Rechnungen`)
    }

    if (user.purchases.length > 0) {
      blockers.push(`${user.purchases.length} laufende Käufe`)
    }

    if (user.bids.length > 0) {
      blockers.push(`${user.bids.length} aktive Gebote`)
    }

    if (blockers.length > 0) {
      return NextResponse.json(
        {
          message: `Kontolöschung nicht möglich. Bitte schliessen Sie zuerst folgende Vorgänge ab: ${blockers.join(', ')}.`,
          blockers,
        },
        { status: 400 }
      )
    }

    // Generiere Lösch-Token
    const deletionToken = crypto.randomBytes(32).toString('hex')
    const deletionTokenExpires = new Date()
    deletionTokenExpires.setHours(deletionTokenExpires.getHours() + TOKEN_EXPIRATION_HOURS)

    // Speichere Token
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionToken,
        deletionTokenExpires,
        deletionRequestedAt: new Date(),
      },
    })

    // Generiere Bestätigungs-URL
    const baseUrl = getEmailBaseUrl()
    const confirmationUrl = `${baseUrl}/confirm-deletion?token=${deletionToken}`

    // Sende Bestätigungs-E-Mail
    const userName = user.firstName || user.nickname || user.name || 'Benutzer'
    const { subject, html, text } = getAccountDeletionRequestEmail(
      userName,
      confirmationUrl,
      TOKEN_EXPIRATION_HOURS
    )

    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
      useNoReply: true,
    })

    if (!emailResult.success) {
      console.error('[request-deletion] E-Mail-Versand fehlgeschlagen:', emailResult.error)
      // Token trotzdem speichern, User kann Link manuell anfordern
    }

    return NextResponse.json({
      message:
        'Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet. Bitte klicken Sie auf den Link, um die Löschung zu bestätigen.',
      success: true,
    })
  } catch (error) {
    console.error('[request-deletion] Fehler:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
