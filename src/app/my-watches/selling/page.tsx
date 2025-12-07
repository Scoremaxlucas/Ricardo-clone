import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MySellingClient } from './MySellingClient'
import { getMySellingArticles } from '@/lib/my-selling'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'

// Revalidate every 30 seconds for fresh data
export const revalidate = 30

export default async function MySellingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-watches/selling')
  }

  // OPTIMIERT: Fetch articles server-side für instant rendering (wie Ricardo)
  // Artikel sind bereits im initial HTML, kein Client-Side API-Call nötig
  // WICHTIG: Fallback zu API-Route wenn Server-Side-Funktion fehlschlägt
  let items
  try {
    items = await getMySellingArticles(session.user.id)
    // WICHTIG: Wenn leeres Array, versuche Fallback (könnte temporärer Fehler sein)
    if (items.length === 0) {
      console.warn('[my-selling] Server-side returned empty array, trying API fallback...')
      // Versuche API-Route als Fallback (non-blocking)
      try {
        const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/articles/mine-fast?userId=${session.user.id}`, {
          headers: {
            'Cookie': `next-auth.session-token=${(await import('next-auth')).getServerSession(authOptions)?.then(s => s?.sessionToken) || ''}`,
          },
        })
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          if (fallbackData.watches && fallbackData.watches.length > 0) {
            items = fallbackData.watches
          }
        }
      } catch (fallbackError) {
        console.error('[my-selling] Fallback also failed:', fallbackError)
      }
    }
  } catch (error) {
    console.error('[my-selling] Error fetching articles server-side:', error)
    // WICHTIG: Bei Fehler leeres Array zurückgeben, aber Client wird API-Route verwenden
    items = []
  }

  const stats = {
    total: items.length,
    active: items.filter(item => item.isActive).length,
    inactive: items.filter(item => !item.isActive).length,
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4 text-sm text-gray-600">
            <Link href="/my-watches" className="text-primary-600 hover:text-primary-700">
              Mein Verkaufen
            </Link>
            <span className="mx-2">›</span>
            <span>Mein Verkaufen</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mein Verkaufen</h1>
                <p className="mt-1 text-gray-600">Verwalten Sie Ihre Verkaufsanzeigen</p>
              </div>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Artikel anbieten
            </Link>
          </div>

          {/* Server-Side Rendered Articles - Instant Display */}
          <MySellingClient initialItems={items} initialStats={stats} />
        </div>
      </div>
      <Footer />
    </div>
  )
}

