import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processInvoiceReminders } from '@/lib/invoice-reminders'

/**
 * API-Route für Mahnprozess-Verarbeitung
 * Wird täglich von einem Cron-Job aufgerufen (z.B. um 2:00 Uhr)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Nur Admins können diesen Job manuell triggern (oder als Cron)
    if (!session?.user?.id) {
      // Wenn keine Session, prüfe ob es ein Cron-Job ist
      const authHeader = request.headers.get('authorization')
      if (
        !authHeader ||
        authHeader !== `Bearer ${process.env.CRON_SECRET || 'development-secret'}`
      ) {
        return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
      }
    } else {
      // Prüfe ob User Admin ist (nur aus Session)
      const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === true

      if (!isAdminInSession) {
        return NextResponse.json(
          { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
          { status: 403 }
        )
      }
    }

    console.log(`[invoices/process-reminders] Starte Mahnprozess-Verarbeitung...`)

    const result = await processInvoiceReminders()

    console.log(
      `[invoices/process-reminders] ✅ Verarbeitet: ${result.processed} von ${result.total} Rechnungen`
    )

    return NextResponse.json({
      message: 'Mahnprozess erfolgreich verarbeitet',
      processed: result.processed,
      total: result.total,
    })
  } catch (error: any) {
    console.error('Error processing invoice reminders:', error)
    return NextResponse.json(
      { message: 'Fehler bei Mahnprozess-Verarbeitung: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * GET für manuelle Prüfung (ohne Auth für einfachen Cron-Setup)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET || 'development-secret'}`) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const result = await processInvoiceReminders()

    return NextResponse.json({
      processed: result.processed,
      total: result.total,
    })
  } catch (error: any) {
    console.error('Error processing invoice reminders:', error)
    return NextResponse.json({ message: 'Fehler: ' + error.message }, { status: 500 })
  }
}
