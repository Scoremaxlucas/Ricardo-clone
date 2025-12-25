import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getMyPurchases } from '@/lib/my-purchases'

// Alle Käufe des eingeloggten Users abrufen
// WICHTIG: Verwendet getMyPurchases für vollständige Daten inkl. Zahlungsschutz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Verwende die zentrale getMyPurchases Funktion
    // Diese lädt ALLE benötigten Felder inkl. paymentProtectionEnabled und Stripe-Felder
    const purchases = await getMyPurchases(session.user.id)

    console.log(
      `[my-purchases] User ${session.user.id} (${session.user.email}) hat ${purchases.length} Purchases`
    )

    return NextResponse.json({ purchases })
  } catch (error: any) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Laden der Käufe: ' + error.message },
      { status: 500 }
    )
  }
}
