import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/cleanup-existing-id-documents
 *
 * EINMALIGER Admin-Endpunkt zur Bereinigung bestehender Ausweiskopien.
 * Für DSGVO/DSG-Compliance müssen auch bereits gespeicherte Dokumente gelöscht werden.
 *
 * Nur für Admins zugänglich, sollte einmalig nach dem Update ausgeführt werden.
 */
export async function POST(request: NextRequest) {
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

    console.log('[cleanup-existing-id-documents] Starte Bereinigung...')

    // Zähle betroffene Benutzer vor der Bereinigung
    const usersWithDocs = await prisma.user.count({
      where: {
        verificationStatus: 'approved',
        OR: [
          { idDocument: { not: null } },
          { idDocumentPage1: { not: null } },
          { idDocumentPage2: { not: null } },
        ],
      },
    })

    console.log(`[cleanup-existing-id-documents] ${usersWithDocs} verifizierte Benutzer mit Ausweiskopien gefunden`)

    // Führe Bereinigung durch
    const result = await prisma.user.updateMany({
      where: {
        verificationStatus: 'approved',
        OR: [
          { idDocument: { not: null } },
          { idDocumentPage1: { not: null } },
          { idDocumentPage2: { not: null } },
        ],
      },
      data: {
        idDocument: null,
        idDocumentPage1: null,
        idDocumentPage2: null,
        // idDocumentType bleibt erhalten (nicht-sensitiv)
      },
    })

    console.log(`[cleanup-existing-id-documents] ${result.count} Benutzer bereinigt`)

    // Auch abgelehnte Benutzer bereinigen
    const rejectedResult = await prisma.user.updateMany({
      where: {
        verificationStatus: 'rejected',
        OR: [
          { idDocument: { not: null } },
          { idDocumentPage1: { not: null } },
          { idDocumentPage2: { not: null } },
        ],
      },
      data: {
        idDocument: null,
        idDocumentPage1: null,
        idDocumentPage2: null,
        idDocumentType: null,
      },
    })

    console.log(`[cleanup-existing-id-documents] ${rejectedResult.count} abgelehnte Benutzer bereinigt`)

    return NextResponse.json({
      success: true,
      message: 'Bestehende Ausweiskopien erfolgreich gelöscht (Datenschutz-Compliance)',
      cleaned: {
        approvedUsers: result.count,
        rejectedUsers: rejectedResult.count,
        total: result.count + rejectedResult.count,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[cleanup-existing-id-documents] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler bei der Bereinigung', error: error?.message },
      { status: 500 }
    )
  }
}
