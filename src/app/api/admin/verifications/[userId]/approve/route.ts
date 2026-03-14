import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

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

    // Genehmige Verifizierung und LÖSCHE Ausweiskopien (Datenschutz-Compliance)
    // Gemäss DSG Art. 6 / DSGVO Art. 5: Personendaten dürfen nur so lange aufbewahrt
    // werden, wie es für den Zweck erforderlich ist. Nach erfolgreicher Prüfung
    // wird nur das Ergebnis gespeichert, nicht die sensiblen Dokumente.
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'approved',
        verificationReviewedAt: new Date(),
        verificationReviewedBy: session.user.id,
        verified: true,
        verifiedAt: new Date(),
        // KRITISCH: Ausweiskopien nach erfolgreicher Verifizierung löschen!
        // Nur der Dokumenttyp wird behalten (nicht-sensitiv)
        idDocument: null,
        idDocumentPage1: null,
        idDocumentPage2: null,
      },
    })

    // Intentionally silent: approval should not notify users in the new flow.

    return NextResponse.json({ message: 'Verifizierung wurde genehmigt' })
  } catch (error: any) {
    console.error('Error approving verification:', error)
    return NextResponse.json(
      { message: 'Fehler beim Genehmigen der Verifizierung' },
      { status: 500 }
    )
  }
}
