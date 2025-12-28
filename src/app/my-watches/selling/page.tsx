import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SellerListingsClient } from '@/components/seller'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Package, Plus, Receipt, Tag } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const revalidate = 30

export default async function MySellingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-watches/selling')
  }

  // Fetch counts for secondary nav badges
  const [pendingInvoicesCount, pendingOffersCount] = await Promise.all([
    prisma.invoice.count({
      where: {
        sellerId: session.user.id,
        status: { in: ['pending', 'overdue'] },
      },
    }),
    prisma.priceOffer.count({
      where: {
        watch: { sellerId: session.user.id },
        status: { in: ['pending', 'new'] },
      },
    }),
  ])

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
              <li className="text-gray-900">Meine Angebote</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-100 p-2.5">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Meine Angebote</h1>
                <p className="text-sm text-gray-500">Verwalten Sie Ihre Verkaufsanzeigen</p>
              </div>
            </div>

            {/* Primary CTA */}
            <Link
              href="/sell"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
            >
              <Plus className="h-5 w-5" />
              Artikel anbieten
            </Link>
          </div>

          {/* Secondary Navigation - Fees & Offers */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Link
              href="/my-watches/selling/fees"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Receipt className="h-4 w-4 text-gray-500" />
              Gebühren & Rechnungen
              {pendingInvoicesCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {pendingInvoicesCount}
                </span>
              )}
            </Link>
            <Link
              href="/my-watches/selling/offers"
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
          </div>

          {/* Client Component with Tabs and Grid */}
          <SellerListingsClient />
        </div>
      </main>
      <Footer />
    </div>
  )
}
