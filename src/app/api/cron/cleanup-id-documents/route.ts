import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/cleanup-id-documents
 *
 * Cronjob zur automatischen Löschung alter Ausweiskopien.
 * Sollte täglich ausgeführt werden (z.B. via Vercel Cron).
 *
 * Datenschutz-Compliance (DSG Art. 6 / DSGVO Art. 5):
 * - Ausweiskopien werden nur so lange gespeichert, wie für die Prüfung notwendig
 * - Alte pending Verifizierungen (>30 Tage) werden bereinigt
 * - Bereits genehmigte/abgelehnte sollten keine Dokumente mehr haben (Fallback-Bereinigung)
 */
export async function POST(request: NextRequest) {
  try {
    // Prüfe Cron-Secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[cleanup-id-documents] Unauthorized cron request')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    console.log(`[cleanup-id-documents] Start: ${now.toISOString()}`)

    // 30 Tage Grenze für pending Verifizierungen
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let cleanedPending = 0
    let cleanedApproved = 0
    let cleanedRejected = 0

    // 1. Alte pending Verifizierungen bereinigen (>30 Tage ohne Prüfung)
    // Diese Benutzer müssen erneut Dokumente hochladen
    const oldPendingUsers = await prisma.user.findMany({
      where: {
        verificationStatus: 'pending',
        verifiedAt: {
          lt: thirtyDaysAgo,
        },
        OR: [
          { idDocument: { not: null } },
          { idDocumentPage1: { not: null } },
          { idDocumentPage2: { not: null } },
        ],
      },
      select: {
        id: true,
        email: true,
        verifiedAt: true,
      },
    })

    for (const user of oldPendingUsers) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            idDocument: null,
            idDocumentPage1: null,
            idDocumentPage2: null,
            // Status auf "expired" setzen, damit User weiss, dass er neu hochladen muss
            verificationStatus: 'expired',
          },
        })

        // Benachrichtigung senden
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'VERIFICATION_EXPIRED',
            title: 'Verifizierung abgelaufen',
            message:
              'Ihre hochgeladenen Ausweisdokumente wurden aus Datenschutzgründen nach 30 Tagen gelöscht. Bitte laden Sie erneut Dokumente hoch.',
            link: '/verification',
          },
        })

        cleanedPending++
        console.log(`[cleanup-id-documents] Alte pending Verifizierung bereinigt: ${user.email}`)
      } catch (error) {
        console.error(`[cleanup-id-documents] Fehler bei User ${user.id}:`, error)
      }
    }

    // 2. Fallback: Bereits genehmigte Benutzer, die noch Dokumente haben (sollte nicht vorkommen)
    const approvedWithDocs = await prisma.user.updateMany({
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
      },
    })
    cleanedApproved = approvedWithDocs.count

    // 3. Fallback: Bereits abgelehnte Benutzer, die noch Dokumente haben (sollte nicht vorkommen)
    const rejectedWithDocs = await prisma.user.updateMany({
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
    cleanedRejected = rejectedWithDocs.count

    const totalCleaned = cleanedPending + cleanedApproved + cleanedRejected

    console.log(`[cleanup-id-documents] Fertig:`)
    console.log(`  - Alte pending: ${cleanedPending}`)
    console.log(`  - Approved fallback: ${cleanedApproved}`)
    console.log(`  - Rejected fallback: ${cleanedRejected}`)
    console.log(`  - Total: ${totalCleaned}`)

    return NextResponse.json({
      success: true,
      cleaned: {
        oldPending: cleanedPending,
        approvedFallback: cleanedApproved,
        rejectedFallback: cleanedRejected,
        total: totalCleaned,
      },
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('[cleanup-id-documents] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten', error: error?.message },
      { status: 500 }
    )
  }
}

// GET für manuelle Tests (nur in Development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'GET not allowed in production' }, { status: 405 })
  }
  return POST(request)
}
