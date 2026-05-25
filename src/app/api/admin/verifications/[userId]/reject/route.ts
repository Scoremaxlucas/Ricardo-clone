import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { logAdminAudit } from '@/lib/admin/auditLog'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    if (!(await isAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await request.json()
    const { reason } = body

    // Hole User-Daten für E-Mail
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        nickname: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Lehne Verifizierung ab und LÖSCHE Ausweiskopien (Datenschutz-Compliance)
    // Gemäss DSG Art. 6 / DSGVO Art. 5: Sensible Daten müssen nach Zweckerfüllung gelöscht werden.
    // Der Benutzer kann bei erneutem Versuch neue Dokumente hochladen.
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'rejected',
        verificationReviewedAt: new Date(),
        verificationReviewedBy: session.user.id,
        verified: false,
        // KRITISCH: Ausweiskopien nach Ablehnung löschen!
        idDocument: null,
        idDocumentPage1: null,
        idDocumentPage2: null,
        idDocumentType: null, // Bei Ablehnung auch Typ löschen für sauberen Neustart
      },
    })

    // Benachrichtigung für Benutzer erstellen
    try {
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'VERIFICATION_REJECTED',
          title: 'Verifizierung abgelehnt',
          message: reason
            ? `Ihre Verifizierung wurde abgelehnt. Grund: ${reason}. Bitte laden Sie erneut gültige Dokumente hoch.`
            : 'Ihre Verifizierung wurde abgelehnt. Bitte laden Sie erneut gültige Dokumente hoch.',
          link: '/verification',
        },
      })
    } catch (notifError) {
      console.error('[notifications] Fehler bei Ablehnungs-Benachrichtigung:', notifError)
    }

    await logAdminAudit({
      adminUserId: session.user.id,
      action: 'USER_VERIFICATION_REJECT',
      entityType: 'User',
      entityId: userId,
      metadata: { reason: typeof reason === 'string' ? reason.slice(0, 300) : null },
    })

    return NextResponse.json({ message: 'Verifizierung wurde abgelehnt' })
  } catch (error: any) {
    console.error('Error rejecting verification:', error)
    return NextResponse.json({ message: 'Fehler beim Ablehnen der Verifizierung' }, { status: 500 })
  }
}
