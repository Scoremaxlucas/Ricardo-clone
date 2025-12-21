import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { authOptions } from '@/lib/auth'
import { getMyPurchases, MyPurchaseItem } from '@/lib/my-purchases'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MyPurchasesClient } from './MyPurchasesClient'

// Revalidate every 30 seconds for fresh data
export const revalidate = 30

export default async function MyPurchasedPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-watches/buying/purchased')
  }

  // OPTIMIERT: Fetch purchases server-side für instant rendering (wie Ricardo)
  // Purchases sind bereits im initial HTML, kein Client-Side API-Call nötig
  // WICHTIG: Fallback zu API-Route wenn Server-Side-Funktion fehlschlägt
  let purchases: MyPurchaseItem[] = []
  try {
    purchases = await getMyPurchases(session.user.id)
    // WICHTIG: Wenn leeres Array, könnte temporärer Fehler sein - Client wird API-Route verwenden
    if (purchases.length === 0) {
      console.warn(
        '[my-purchases] Server-side returned empty array, client will try API fallback...'
      )
    }
  } catch (error) {
    console.error('[my-purchases] Error fetching purchases server-side:', error)
    // WICHTIG: Bei Fehler leeres Array zurückgeben, aber Client wird API-Route verwenden
    purchases = []
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/my-watches/buying"
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu Meinen Käufen
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gekaufte Artikel</h1>
          <p className="mt-1 text-gray-600">Übersicht Ihrer Käufe und deren Status</p>
        </div>

        {/* Server-Side Rendered Purchases - Instant Display */}
        <MyPurchasesClient initialPurchases={purchases} />
      </div>
      <Footer />
    </div>
  )
}
