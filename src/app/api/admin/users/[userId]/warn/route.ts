import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob User Admin ist
    const isAdminInSession = session?.user?.isAdmin === true
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true, name: true, firstName: true, lastName: true },
    })
    const isAdmin = isAdminInSession || admin?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await request.json().catch(() => ({}))
    const { reason, message: warningMessage } = body

    // Hole User-Daten
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
        warningCount: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'User nicht gefunden' }, { status: 404 })
    }

    // Erhöhe Warnungsanzahl
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        warningCount: (user.warningCount || 0) + 1,
        lastWarnedAt: new Date(),
      },
    })

    const adminName =
      admin?.name || `${admin?.firstName} ${admin?.lastName}` || admin?.email || 'Ein Administrator'

    const userName =
      user.name || `${user.firstName} ${user.lastName}` || user.nickname || user.email

    // Erstelle Benachrichtigung für den User
    try {
      const reasonLabel =
        reason === 'inappropriate_content'
          ? 'Unangemessener Inhalt'
          : reason === 'spam'
            ? 'Spam'
            : reason === 'fraud'
              ? 'Betrug'
              : reason === 'harassment'
                ? 'Belästigung'
                : reason === 'terms_violation'
                  ? 'Verstoß gegen Nutzungsbedingungen'
                  : reason === 'fake_account'
                    ? 'Fake-Account'
                    : reason === 'other'
                      ? 'Sonstiges'
                      : reason || 'Unbekannt'

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'WARNING',
          title: 'Sie haben eine Verwarnung erhalten',
          message: warningMessage || `Grund: ${reasonLabel}`,
          link: null, // Kein Link, öffnet Modal statt weiterzuleiten
        },
      })
    } catch (notificationError) {
      console.warn('Could not create notification:', notificationError)
    }

    // Sende E-Mail-Benachrichtigung
    try {
      const emailSubject = `Verwarnung von Helvenda.ch - Warnung #${updatedUser.warningCount}`
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .count { font-size: 24px; font-weight: bold; color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Verwarnung</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="warning">
        <strong>Sie haben eine Verwarnung erhalten</strong>
        <p class="count">Warnung #${updatedUser.warningCount}</p>
      </div>

      ${reason ? `<p><strong>Grund:</strong> ${reason}</p>` : ''}
      ${warningMessage ? `<p><strong>Nachricht:</strong> ${warningMessage}</p>` : ''}

      <p>Diese Verwarnung wurde von einem Administrator ausgestellt. Bitte beachten Sie unsere Nutzungsbedingungen, um weitere Verwarnungen zu vermeiden.</p>

      <p style="margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/my-watches/account" class="button">
          Zu meinem Konto
        </a>
      </p>

      <p>Bei Fragen können Sie sich jederzeit an unseren Support wenden.</p>

      <div class="footer">
        <p>Mit freundlichen Grüssen<br>Das Helvenda.ch Team</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}">Helvenda.ch</a></p>
      </div>
    </div>
  </div>
</body>
</html>
      `

      await sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailHtml,
      })

      console.log(`Warnungs-E-Mail an ${user.email} gesendet`)
    } catch (emailError) {
      console.error('Fehler beim Versenden der Warnungs-E-Mail:', emailError)
      // E-Mail-Fehler sollte nicht die Warnung verhindern
    }

    // Erstelle Activity-Eintrag
    try {
      if (prisma.userActivity) {
        await prisma.userActivity.create({
          data: {
            userId: user.id,
            action: 'warned',
            details: JSON.stringify({
              adminId: session.user.id,
              adminEmail: admin?.email,
              adminName,
              reason: reason || null,
              message: warningMessage || null,
              warningCount: updatedUser.warningCount,
            }),
          },
        })
      }
    } catch (activityError) {
      console.warn('Could not create activity entry:', activityError)
    }

    return NextResponse.json({
      message: 'Warnung wurde gesendet',
      warningCount: updatedUser.warningCount,
    })
  } catch (error: any) {
    console.error('Error warning user:', error)
    return NextResponse.json(
      { message: 'Fehler beim Senden der Warnung: ' + error.message },
      { status: 500 }
    )
  }
}
