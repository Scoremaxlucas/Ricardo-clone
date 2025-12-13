import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, getVerificationApprovalEmail } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob User Admin ist
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const userId = params.userId

    // Hole User-Daten vor der Aktualisierung
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Genehmige Verifizierung
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'approved',
        verificationReviewedAt: new Date(),
        verificationReviewedBy: session.user.id,
        verified: true, // Stelle sicher, dass verified true ist
        verifiedAt: new Date(),
      },
    })

    // Erstelle Benachrichtigung für den Benutzer
    try {
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'VERIFICATION_APPROVED',
          title: 'Verifizierung erfolgreich',
          message:
            'Ihre Verifizierung wurde erfolgreich abgeschlossen. Sie können jetzt Artikel verkaufen!',
          link: '/sell',
        },
      })
      console.log(`[notifications] Verifizierungs-Benachrichtigung erstellt für Benutzer ${userId}`)
    } catch (notifError) {
      console.error(
        '[notifications] Fehler beim Erstellen der Verifizierungs-Benachrichtigung:',
        notifError
      )
      // Benachrichtigungs-Fehler sollte die Verifizierung nicht verhindern
    }

    // E-Mail an Benutzer senden, dass Verifizierung genehmigt wurde
    try {
      const userName = user.nickname || user.firstName || user.name || 'Benutzer'
      const { subject, html, text } = getVerificationApprovalEmail(userName, user.email)

      const emailResult = await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      })

      if (emailResult.success) {
        console.log(`Verifizierungs-Bestätigungs-E-Mail gesendet an ${user.email}`)
      } else {
        console.error(`Fehler beim Senden der Verifizierungs-E-Mail:`, emailResult.error)
        // E-Mail-Fehler sollte die Verifizierung nicht verhindern
      }
    } catch (emailError: any) {
      console.error('Fehler beim Senden der Verifizierungs-E-Mail:', emailError)
      // E-Mail-Fehler sollte die Verifizierung nicht verhindern
    }

    return NextResponse.json({ message: 'Verifizierung wurde genehmigt' })
  } catch (error: any) {
    console.error('Error approving verification:', error)
    return NextResponse.json(
      { message: 'Fehler beim Genehmigen der Verifizierung' },
      { status: 500 }
    )
  }
}
