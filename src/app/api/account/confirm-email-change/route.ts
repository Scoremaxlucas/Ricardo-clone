import { getEmailChangedNotificationEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { getUserPreferredLanguage } from '@/lib/user-language'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/confirm-email-change
 *
 * Bestätigt die E-Mail-Änderung mit dem Token aus der E-Mail.
 * - Prüft Token
 * - Ändert E-Mail
 * - Sendet Benachrichtigung an alte E-Mail
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Kein Token angegeben', success: false },
        { status: 400 }
      )
    }

    // Benutzer mit diesem Token finden
    const user = await prisma.user.findFirst({
      where: {
        pendingEmailToken: token,
      },
      select: {
        id: true,
        email: true,
        pendingEmail: true,
        pendingEmailTokenExpires: true,
        firstName: true,
        name: true,
        nickname: true,
        isBlocked: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Ungültiger Token', success: false },
        { status: 400 }
      )
    }

    // Token-Ablauf prüfen
    if (!user.pendingEmailTokenExpires || user.pendingEmailTokenExpires < new Date()) {
      // Abgelaufenen Token aufräumen
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailTokenExpires: null,
        },
      })
      return NextResponse.json(
        {
          message: 'Der Bestätigungslink ist abgelaufen. Bitte fordern Sie eine neue E-Mail-Änderung an.',
          success: false,
          expired: true,
        },
        { status: 400 }
      )
    }

    // Benutzer gesperrt?
    if (user.isBlocked) {
      return NextResponse.json(
        { message: 'Ihr Konto ist gesperrt', success: false },
        { status: 403 }
      )
    }

    // Prüfen ob die neue E-Mail inzwischen vergeben wurde
    if (user.pendingEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.pendingEmail },
      })

      if (existingUser) {
        // E-Mail ist inzwischen vergeben
        await prisma.user.update({
          where: { id: user.id },
          data: {
            pendingEmail: null,
            pendingEmailToken: null,
            pendingEmailTokenExpires: null,
          },
        })
        return NextResponse.json(
          {
            message: 'Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet',
            success: false,
          },
          { status: 400 }
        )
      }
    }

    const oldEmail = user.email
    const newEmail = user.pendingEmail

    if (!newEmail) {
      return NextResponse.json(
        { message: 'Keine ausstehende E-Mail-Änderung gefunden', success: false },
        { status: 400 }
      )
    }

    // E-Mail-Adresse ändern
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailTokenExpires: null,
        // E-Mail als verifiziert markieren (wurde ja gerade bestätigt)
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })

    // Benachrichtigung an die alte E-Mail senden
    if (oldEmail) {
      try {
        const userName = user.firstName || user.name || user.nickname || 'Benutzer'
        const locale = await getUserPreferredLanguage(user.id)
        const notificationEmail = getEmailChangedNotificationEmail(
          userName,
          oldEmail,
          newEmail,
          locale
        )
        await sendEmail({
          to: oldEmail,
          subject: notificationEmail.subject,
          html: notificationEmail.html,
          text: notificationEmail.text,
        })
      } catch (emailError) {
        // Nicht kritisch - E-Mail wurde trotzdem geändert
        console.error('[confirm-email-change] Benachrichtigung an alte E-Mail fehlgeschlagen:', emailError)
      }
    }

    return NextResponse.json({
      message: 'Ihre E-Mail-Adresse wurde erfolgreich geändert',
      success: true,
      newEmail,
    })
  } catch (error) {
    console.error('[confirm-email-change] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten', success: false },
      { status: 500 }
    )
  }
}
