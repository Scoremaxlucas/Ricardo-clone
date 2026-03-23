import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { authOptions } from '@/lib/auth'
import { getProductDetailForPage } from '@/lib/product-detail'
import { getServerSession } from 'next-auth/next'
import nextDynamic from 'next/dynamic'
import { notFound } from 'next/navigation'

/**
 * Server Component: Daten werden auf dem Server geladen (kein clientseitiger Fetch-Waterfall).
 * Interaktion bleibt in ProductPageClient (dynamic chunk).
 */
export const dynamic = 'force-dynamic'

const ProductPageClient = nextDynamic(
  () =>
    import('@/components/product/ProductPageClient').then(m => ({ default: m.ProductPageClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] items-center justify-center" aria-busy="true">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"
          role="status"
          aria-label="Laden"
        />
      </div>
    ),
  }
)

interface ProductPageProps {
  params: { id: string }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = params
  const session = await getServerSession(authOptions)
  const data = await getProductDetailForPage(id, session?.user?.id ?? null)

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-8">
        <div className="mx-auto max-w-[1400px] px-4 py-8">
          <ProductPageClient
            watch={data.watch}
            images={data.images}
            conditionMap={data.conditionMap}
            lieferumfang=""
            seller={data.seller}
            saleInfo={data.saleInfo}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
