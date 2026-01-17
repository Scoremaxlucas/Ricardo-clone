import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { authOptions } from '@/lib/auth'
import { getMyPurchases, MyPurchaseItem } from '@/lib/my-purchases'
import { prisma } from '@/lib/prisma'
import { Gavel, Search, ShoppingBag, Tag } from 'lucide-react'
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

  // Fetch purchases and stats in parallel
  const [purchases, pendingOffersCount, activeBidsCount, activeSearchesCount] = await Promise.all([
    getMyPurchases(session.user.id).catch((error) => {
      console.error('[my-purchases] Error fetching purchases server-side:', error)
      return [] as MyPurchaseItem[]
    }),
    // Count pending price offers from buyer
    prisma.priceOffer.count({
      where: {
        buyerId: session.user.id,
        status: { in: ['pending', 'new', 'counter'] },
      },
    }),
    // Count active bids
    prisma.bid.count({
      where: {
        userId: session.user.id,
        watch: {
          isAuction: true,
          auctionEnd: { gt: new Date() },
        },
      },
    }),
    // Count active search subscriptions
    prisma.searchSubscription.count({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    }),
  ])

  // Calculate summary stats
  const pendingPurchases = purchases.filter(p =>
    p.status === 'pending' ||
    (!p.paymentConfirmed && !p.paid)
  )
  const totalSpent = purchases
    .filter(p => p.paymentConfirmed || p.paid)
    .reduce((sum, p) => sum + (p.totalAmount || p.watch.finalPrice || 0), 0)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary-600">
                  Startseite
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link href="/my-watches/buying" className="hover:text-primary-600">
                  Mein Kaufen
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-900">Gekaufte Artikel</li>
            </ol>
          </nav>

          {/* Header with Icon - like "Meine Angebote" */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-100 p-2.5">
                <ShoppingBag className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Gekaufte Artikel</h1>
                <p className="text-sm text-gray-500">Übersicht Ihrer Käufe und deren Status</p>
              </div>
            </div>

            {/* Summary Box - like "Gebühren" page */}
            {(pendingPurchases.length > 0 || totalSpent > 0) && (
              <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-5 py-3">
                <ShoppingBag className="h-8 w-8 text-primary-600" />
                <div>
                  {pendingPurchases.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-600">{pendingPurchases.length} ausstehende Käufe</p>
                      <p className="text-lg font-bold text-primary-600">
                        CHF {pendingPurchases.reduce((sum, p) => sum + (p.totalAmount || p.watch.finalPrice || 0), 0).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">{purchases.length} Käufe total</p>
                      <p className="text-lg font-bold text-primary-600">
                        CHF {totalSpent.toFixed(2)} ausgegeben
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Navigation - Related buying actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Link
              href="/my-watches/buying/offers"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Tag className="h-4 w-4 text-gray-500" />
              Preisvorschläge
              {pendingOffersCount > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                  {pendingOffersCount}
                </span>
              )}
            </Link>
            <Link
              href="/my-watches/buying/bidding"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Gavel className="h-4 w-4 text-gray-500" />
              Am Bieten
              {activeBidsCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {activeBidsCount}
                </span>
              )}
            </Link>
            <Link
              href="/my-watches/buying/search-subscriptions"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Search className="h-4 w-4 text-gray-500" />
              Suchaufträge
              {activeSearchesCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {activeSearchesCount}
                </span>
              )}
            </Link>
          </div>

          {/* Server-Side Rendered Purchases - Instant Display */}
          <MyPurchasesClient initialPurchases={purchases} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
